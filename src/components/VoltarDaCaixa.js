'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import Botao from './Botao';

function SetaParaLoja({ lojaHref, nomeLoja }) {
  return (
    <Botao href={lojaHref} icone aria-label={`Voltar para ${nomeLoja}`}>
      <FiArrowLeft size={19} />
    </Botao>
  );
}

function Seta({ lojaHref, nomeLoja, catalogoHref = '/' }) {
  const router = useRouter();
  const doCatalogo = useSearchParams().get('de') === 'catalogo';
  if (!doCatalogo) return <SetaParaLoja lojaHref={lojaHref} nomeLoja={nomeLoja} />;

  return (
    <Botao
      href={catalogoHref}
      icone
      aria-label="Voltar para a busca"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        // Sem histórico (link aberto direto), segue para o catálogo pelo href.
        if (window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      <FiArrowLeft size={19} />
    </Botao>
  );
}

/**
 * Seta da página da caixa. Vindo do catálogo (`?de=catalogo`), volta para a busca de onde o
 * cliente saiu; nos outros casos, vai para a loja. O parâmetro é lido no navegador para a
 * página continuar em cache no servidor.
 */
export default function VoltarDaCaixa(props) {
  return (
    <Suspense fallback={<SetaParaLoja {...props} />}>
      <Seta {...props} />
    </Suspense>
  );
}
