// Condição física marcada no estoque (coluna condicoes, lista de códigos). Mesma lista e ordem do
// seletor do estoque (freelancer-discos, src/components/CondicaoSelector.js).

export const CONDICOES = [
  { id: 'capa_pirata', nome: 'Capa Pirata' },
  { id: 'capa_avariada', nome: 'Capa Avariada' },
  { id: 'midia_arranhada', nome: 'Mídia Arranhada' },
  { id: 'midia_avariada', nome: 'Mídia Avariada' },
  { id: 'midia_incompleta', nome: 'Mídia Incompleta' },
  { id: 'disco_empenado', nome: 'Disco Empenado' },
];

const ehImportado = (item) => Boolean(item?.observacao && /importado/i.test(item.observacao));

/**
 * O único selo do item na lista: a primeira condição marcada (na ordem do estoque), senão
 * "Importado". Um selo só por disco, para a capa não ficar carregada.
 */
export function seloDoItem(item) {
  const marcadas = Array.isArray(item?.condicoes) ? item.condicoes : [];
  const condicao = CONDICOES.find((c) => marcadas.includes(c.id));
  if (condicao) return condicao.nome;
  return ehImportado(item) ? 'Importado' : null;
}
