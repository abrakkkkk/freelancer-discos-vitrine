// Preenche discos.faixas com a lista de faixas do Discogs, em lote (caixas inteiras).
// Disco novo ou editado no estoque já é preenchido sozinho pela vitrine (/api/revalidar);
// este script é para caixas antigas.
//
// 1. Capa vinda do Discogs: o endereço da imagem traz o código do lançamento, então a lista é a dele.
// 2. Outras capas: busca por artista e título no Discogs, com a mesma conferência das capas.
// Só preenche disco com faixas vazias (null); nunca substitui o que já está gravado.
//
// Teste, só mostra e não grava:
//   node --env-file=.env.local scripts/preencher-faixas.mjs --loja "Loja 1" --caixas 49,50,51
// Grava no banco:
//   node --env-file=.env.local scripts/preencher-faixas.mjs --loja "Loja 1" --caixas 49,50,51 --gravar

import { createClient } from '@supabase/supabase-js';
import { buscarFaixasDoDisco, headersDiscogs, valorParaGravar } from '../src/utils/faixasDiscogs.js';

const args = process.argv.slice(2);
const valorArg = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const GRAVAR = args.includes('--gravar');
const LOJA = valorArg('--loja');
const CAIXAS = (valorArg('--caixas') || '').split(',').map((c) => c.trim()).filter(Boolean);
const LIMITE = Number(valorArg('--limite')) || Infinity;
if (!LOJA || CAIXAS.length === 0) {
  console.error('Informe --loja "Loja 1" e --caixas 49,50,51.');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = headersDiscogs();
if (!supabaseUrl || !supabaseKey || !headers) {
  console.error('Defina SUPABASE_URL, SUPABASE_SECRET_KEY, DISCOGS_KEY e DISCOGS_SECRET (use --env-file=.env.local).');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const { data: discos, error } = await supabase
  .from('discos')
  .select('id, artista, titulo, ano, caixa, capa_url')
  .eq('loja', LOJA)
  .in('caixa', CAIXAS)
  .eq('deletado', false)
  .is('faixas', null)
  .order('id');
if (error) {
  console.error('Erro ao ler os discos:', error.message);
  process.exit(1);
}

const fila = discos.slice(0, LIMITE);
console.log(`${fila.length} discos sem faixas em ${LOJA}, caixas ${CAIXAS.join(', ')}. ${GRAVAR ? 'Gravando.' : 'Teste, sem gravar.'}`);

const conta = { capa: 0, busca: 0, nada: 0, erro: 0 };
for (const [i, item] of fila.entries()) {
  let resultado = null;
  try {
    resultado = await buscarFaixasDoDisco(item, { headers });
  } catch (err) {
    conta.erro++;
    console.log(`[${i + 1}/${fila.length}] ERRO ${item.artista} - ${item.titulo}: ${err.message}`);
    continue;
  }

  if (resultado) conta[resultado.origem]++;
  else conta.nada++;
  console.log(
    `[${i + 1}/${fila.length}] ${resultado ? `${resultado.faixas.length} faixas (${resultado.origem})` : 'não achou'}  ${item.artista} - ${item.titulo}`,
  );

  if (!GRAVAR) continue;
  const { error: erroGravar } = await supabase
    .from('discos')
    .update({ faixas: valorParaGravar(resultado) })
    .eq('id', item.id)
    .is('faixas', null);
  if (erroGravar) {
    console.error('Erro ao gravar:', erroGravar.message);
    process.exit(1);
  }
}

console.log(`Pela capa: ${conta.capa}. Pela busca: ${conta.busca}. Não achou: ${conta.nada}. Erros: ${conta.erro}.`);
