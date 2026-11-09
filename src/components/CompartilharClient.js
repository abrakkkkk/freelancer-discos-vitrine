'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiCheck, FiCopy, FiShare2 } from 'react-icons/fi';

const semAssinatura = () => () => {};

export default function CompartilharClient() {
  // O endereço só existe no navegador: assim o QR sempre aponta para o domínio aberto.
  const url = useSyncExternalStore(semAssinatura, () => window.location.origin, () => '');
  const podeCompartilhar = useSyncExternalStore(
    semAssinatura,
    () => typeof navigator.share === 'function',
    () => false
  );
  const [aviso, setAviso] = useState('');
  const timerAviso = useRef(null);
  const endereco = url.replace(/^https?:\/\//, '');

  const avisar = (texto) => {
    setAviso(texto);
    clearTimeout(timerAviso.current);
    timerAviso.current = setTimeout(() => setAviso(''), 3000);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      avisar('Link copiado');
    } catch (_) {
      avisar('Não deu para copiar. Selecione o endereço acima.');
    }
  };

  const compartilhar = async () => {
    try {
      await navigator.share({ title: 'Freelancer Discos', url });
    } catch (err) {
      // Fechar a janela de compartilhamento também cai aqui e não é erro.
      if (err?.name !== 'AbortError') copiar();
    }
  };

  const copiado = aviso === 'Link copiado';
  const iconeCopiar = copiado ? <FiCheck size={17} aria-hidden="true" /> : <FiCopy size={17} aria-hidden="true" />;

  return (
    <div className="edCompartilhar">
      {/* QR, endereço e ações no meio da área livre; o crédito fica no pé. */}
      <div className="edCompartilharMeio">
      <div className="edQr">
        {url && (
          <QRCodeSVG
            value={url}
            size={248}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
            title={`QR code do site ${endereco}`}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        )}
      </div>

      <p className="edQrEndereco">{endereco}</p>
      <p className="edQrDica">Aponte a câmera para abrir o catálogo.</p>

      {/* No celular: o menu do sistema (WhatsApp, Instagram...). No computador: copiar. */}
      <div className="edCompartilharAcoes">
        {podeCompartilhar ? (
          <>
            <button type="button" onClick={compartilhar} className="edBotaoPrincipal">
              <FiShare2 size={18} aria-hidden="true" />
              Compartilhar
            </button>
            <button type="button" onClick={copiar} className="edBotaoTexto">
              {iconeCopiar}
              {copiado ? 'Link copiado' : 'Copiar link'}
            </button>
          </>
        ) : (
          <button type="button" onClick={copiar} className="edBotaoPrincipal">
            {iconeCopiar}
            {copiado ? 'Link copiado' : 'Copiar link'}
          </button>
        )}
      </div>

      <p role="status" className="edCompartilharAviso">
        {aviso && !copiado ? aviso : ''}
      </p>
      </div>

      <p className="edCredito">
        Disco do fundo: vinyl record, de pool party,{' '}
        <a href="https://thenounproject.com/icon/vinyl-record-2198121/">Noun Project</a>
      </p>
    </div>
  );
}
