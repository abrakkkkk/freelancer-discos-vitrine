// Pede à vitrine no ar para refazer as páginas dos discos que ganharam faixas numa data,
// para a lista aparecer na hora (sem esperar o cache de 1 hora).
// Só avisa discos que já têm lista: os que ficaram em dúvida não passam pelo preenchimento automático.
//
//   node --env-file=.env.local scripts/avisar-vitrine.mjs            (faixas gravadas hoje)
//   node --env-file=.env.local scripts/avisar-vitrine.mjs --em 2026-11-19

import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const i = args.indexOf('--em');
const EM = i >= 0 ? args[i + 1] : new Date().toISOString().slice(0, 10);
const URL_VITRINE = process.env.VITRINE_URL || 'https://freelancerdiscos.com.br';
const SEGREDO = process.env.REVALIDATE_SECRET;
if (!SEGREDO) {
  console.error('Defina REVALIDATE_SECRET no .env.local.');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const ids = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase.from('discos').select('id').eq('faixas->>em', EM).range(de, de + 999);
  if (error) throw error;
  ids.push(...data.map((d) => d.id));
  if (data.length < 1000) break;
}
console.log(`${ids.length} discos com faixas gravadas em ${EM}.`);

// A rota aceita até 500 discos por aviso.
for (let de = 0; de < ids.length; de += 500) {
  const lote = ids.slice(de, de + 500);
  const res = await fetch(new URL('/api/revalidar', URL_VITRINE), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': SEGREDO },
    body: JSON.stringify({ categoria: 'discos', ids: lote }),
  });
  console.log(`Lote ${de / 500 + 1}: ${res.status} ${await res.text()}`);
}
