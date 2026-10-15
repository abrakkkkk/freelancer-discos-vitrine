import { formatCaixa } from './stringUtils';

export const WHATSAPP_PHONE = '5585987879214';

export function formatPrice(valor) {
  return Number(valor || 0)
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    .replace(/\u00a0/g, ' ');
}

export function formatWhatsAppMessage(itens = [], nome = '', bairro = '') {
  const linhasItens = itens.map((item) => {
    const rotuloCaixa = formatCaixa(item.caixa, item.loja);
    const localizacao = [item.loja, rotuloCaixa !== '—' ? rotuloCaixa : null]
      .filter(Boolean)
      .join(' · ');

    const precoFmt = formatPrice(item.preco);
    const artistaPrefix = item.artista ? `${item.artista} - ` : '';
    const localStr = localizacao ? ` (${localizacao})` : '';

    return `• ${artistaPrefix}${item.titulo}${localStr} - ${precoFmt}`;
  });

  const total = itens.reduce((acc, item) => acc + (Number(item.preco) || 0), 0);
  const totalFmt = formatPrice(total);

  const partes = [
    'Olá, Freelancer Discos! Tenho interesse nestes itens:',
    ...linhasItens,
    '',
    `Total: ${totalFmt}`,
  ];

  if (nome && nome.trim()) {
    partes.push(`Nome: ${nome.trim()}`);
  }

  if (bairro && bairro.trim()) {
    partes.push(`Bairro: ${bairro.trim()}`);
  }

  return partes.join('\n');
}

export function generateWhatsAppUrl(itens = [], nome = '', bairro = '') {
  const mensagem = formatWhatsAppMessage(itens, nome, bairro);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(mensagem)}`;
}
