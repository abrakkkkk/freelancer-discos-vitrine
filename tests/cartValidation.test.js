import { describe, it, expect } from 'vitest';
import { formatWhatsAppMessage, generateWhatsAppUrl } from '../src/utils/cartUtils';

describe('cartUtils', () => {
  it('gera texto formatado com loja e caixa para o WhatsApp', () => {
    const itens = [
      { id: 1, titulo: 'Abbey Road', artista: 'The Beatles', preco: 150, loja: 'Loja 1', caixa: '5' },
      { id: 2, titulo: 'Thriller', artista: 'Michael Jackson', preco: 120, loja: 'Loja 2', caixa: 'Caixa 3B' },
    ];
    const msg = formatWhatsAppMessage(itens, 'Carlos', 'Aldeota');
    expect(msg).toContain('The Beatles - Abbey Road (Loja 1 · Caixa 5) - R$ 150,00');
    expect(msg).toContain('Michael Jackson - Thriller (Loja 2 · Caixa 3B) - R$ 120,00');
    expect(msg).toContain('Total: R$ 270,00');
    expect(msg).toContain('Nome: Carlos');
    expect(msg).toContain('Bairro: Aldeota');
  });

  it('gera URL wa.me com número da loja e mensagem codificada', () => {
    const itens = [
      { id: 1, titulo: 'Clube da Esquina', artista: 'Milton Nascimento', preco: 250, loja: 'Loja 1', caixa: '1' },
    ];
    const url = generateWhatsAppUrl(itens, 'Ana', 'Meireles');
    expect(url).toContain('https://wa.me/5585987879214?text=');
    expect(url).toContain(encodeURIComponent('Milton Nascimento - Clube da Esquina'));
    expect(url).toContain(encodeURIComponent('Total: R$ 250,00'));
  });

  it('omite linhas de nome e bairro se não preenchidos', () => {
    const itens = [
      { id: 1, titulo: 'Roots', artista: 'Sepultura', preco: 180, loja: 'Loja 1', caixa: '10' },
    ];
    const msg = formatWhatsAppMessage(itens, '', '');
    expect(msg).not.toContain('Nome:');
    expect(msg).not.toContain('Bairro:');
  });
});
