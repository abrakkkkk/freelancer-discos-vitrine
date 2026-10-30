// Procura capa para os itens ativos sem capa_url, usando a mesma rota e a mesma conferência
// de artista/título da vitrine (/api/cover). Pode ser interrompido e retomado.
//
// Precisa do servidor da vitrine rodando (npm run dev ou npm start) em --url (padrão http://localhost:3000).
//
// Teste, só busca e não grava:
//   node --env-file=.env.local scripts/preencher-capas.mjs --limite 100
// Grava no banco (a rota só preenche capa vazia, nunca substitui):
//   node --env-file=.env.local scripts/preencher-capas.mjs --gravar

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const valorArg = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const GRAVAR = args.includes('--gravar');
const LIMITE = Number(valorArg('--limite')) || Infinity;
// --ignorar-caixas 3,4,5 pula as caixas 3, 4 e 5, sem pegar as de sufixo B (3B é outra caixa).
const CAIXAS_IGNORADAS = new Set((valorArg('--ignorar-caixas') || '').split(',').filter(Boolean));
const caixaIgnorada = (caixa) => {
  const numero = String(caixa ?? '').trim().match(/^(?:caixa\s*)?(\d+)$/i)?.[1];
  return numero !== undefined && CAIXAS_IGNORADAS.has(numero);
};
const PARALELO = Number(valorArg('--paralelo')) || 3;
const ESPERA_APOS_FALHA_MS = 30000;
const MAX_TENTATIVAS = 6;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// O ritmo segue o limite informado pelo Discogs (60 buscas por minuto): com folga vai rápido,
// perto do limite espera a janela liberar. Sem o valor (resposta do cache), não há busca a poupar.
const pausaPeloLimite = (restante) => {
  if (restante === null) return 0;
  if (restante > 8) return 0;
  if (restante > 3) return 1000;
  return 3000;
};
const URL_BASE = valorArg('--url') || 'http://localhost:3000';
const PASTA = path.resolve(process.cwd(), '.cache');
const PROGRESSO = path.join(PASTA, GRAVAR ? 'preencher-capas-gravar.json' : 'preencher-capas-teste.json');
const CSV = path.join(PASTA, GRAVAR ? 'preencher-capas-gravar.csv' : 'preencher-capas-teste.csv');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Defina SUPABASE_URL e SUPABASE_SECRET_KEY (use --env-file=.env.local).');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const campo = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

fs.mkdirSync(PASTA, { recursive: true });
// O arquivo inicial traz o que já foi processado em outra máquina (usado no GitHub Actions).
const INICIAL = path.resolve(process.cwd(), 'scripts/preencher-capas-feitos.json');
const lerLista = (arq) => (fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : []);
const feitos = new Set([...(GRAVAR ? lerLista(INICIAL) : []), ...lerLista(PROGRESSO)]);
if (!fs.existsSync(CSV)) fs.writeFileSync(CSV, '﻿resultado,tabela,id,artista,titulo,ano,capa\r\n');

async function listarSemCapa(tabela) {
  const itens = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from(tabela)
      .select('id, artista, titulo, ano, caixa, loja')
      .eq('deletado', false)
      .eq('ativo', true)
      .is('capa_url', null)
      .order('id')
      .range(de, de + 999);
    if (error) throw error;
    itens.push(...data);
    if (data.length < 1000) break;
  }
  return itens;
}

let processados = 0;
let achados = 0;
let pendentes = 0;
const t0 = Date.now();

const fila = [];
for (const tabela of ['discos', 'cds']) {
  for (const item of await listarSemCapa(tabela)) {
    if (!feitos.has(`${tabela}:${item.id}`) && !caixaIgnorada(item.caixa)) fila.push({ tabela, item });
  }
}
console.log(`${fila.length} itens na fila, ${PARALELO} buscas em paralelo`);

// O limite do Discogs é por chave, não por conexão: o paralelo só aproveita o tempo em que
// uma busca espera resposta. Quem controla o total por minuto é pausaPeloLimite.
async function trabalhador() {
  while (fila.length && processados < LIMITE) {
    const { tabela, item } = fila.shift();
    const chave = `${tabela}:${item.id}`;

    const params = new URLSearchParams({
      categoria: tabela,
      artista: item.artista || '',
      titulo: item.titulo || '',
    });
    if (item.ano) params.set('ano', String(item.ano));
    if (GRAVAR) params.set('id', String(item.id));

    let capa = null;
    let concluiu = false;
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS && !concluiu; tentativa++) {
      try {
        const res = await fetch(`${URL_BASE}/api/cover?${params}`, { signal: AbortSignal.timeout(60000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        capa = (await res.json()).cover || null;
        concluiu = true;
        const restante = res.headers.get('x-discogs-restante');
        await sleep(pausaPeloLimite(restante === null ? null : Number(restante)));
      } catch (err) {
        console.error(`${chave}: ${err.message}, tentativa ${tentativa} de ${MAX_TENTATIVAS}`);
        if (tentativa < MAX_TENTATIVAS) await sleep(ESPERA_APOS_FALHA_MS);
      }
    }
    // Item que não completou a busca fica de fora do progresso: a próxima execução tenta de novo.
    if (!concluiu) {
      pendentes++;
      continue;
    }

    processados++;
    if (capa) achados++;
    fs.appendFileSync(
      CSV,
      [capa ? 'achou' : 'sem', tabela, item.id, item.artista, item.titulo, item.ano, capa].map(campo).join(',') + '\r\n'
    );
    feitos.add(chave);
    if (processados % 25 === 0) {
      fs.writeFileSync(PROGRESSO, JSON.stringify([...feitos]));
      const min = ((Date.now() - t0) / 60000).toFixed(1);
      console.log(`${processados} itens, ${achados} com capa, ${min} min`);
    }
  }
}

await Promise.all(Array.from({ length: PARALELO }, trabalhador));

fs.writeFileSync(PROGRESSO, JSON.stringify([...feitos]));
console.log(`Fim: ${processados} itens nesta execução, ${achados} com capa, ${pendentes} pendentes para a próxima execução (${GRAVAR ? 'gravado' : 'teste, nada gravado'}).`);
