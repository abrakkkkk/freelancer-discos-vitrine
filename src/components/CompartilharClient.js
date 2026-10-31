'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiCheck, FiCopy, FiShare2 } from 'react-icons/fi';

const semAssinatura = () => () => {};

const estiloBotao = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  width: '100%',
  minHeight: '48px',
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
};

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
      avisar('Não foi possível copiar. Selecione o link acima.');
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

  return (
    <div style={{ maxWidth: '360px', margin: '0 auto', padding: '8px 0 16px' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '280px',
          aspectRatio: '1 / 1',
          margin: '0 auto',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        {url && (
          <QRCodeSVG
            value={url}
            size={248}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
            title={`QR code do site ${url}`}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        )}
      </div>

      <p style={{ marginTop: '16px', fontSize: '14px', color: '#a1a1aa', textAlign: 'center' }}>
        Aponte a câmera do celular para abrir o catálogo.
      </p>
      <p
        style={{
          marginTop: '4px',
          minHeight: '21px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#ffffff',
          textAlign: 'center',
          overflowWrap: 'anywhere',
          userSelect: 'all',
        }}
      >
        {url}
      </p>

      <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
        {podeCompartilhar && (
          <button
            type="button"
            onClick={compartilhar}
            style={{ ...estiloBotao, backgroundColor: '#8b1e1e', border: '1px solid #8b1e1e', color: '#ffffff' }}
          >
            <FiShare2 size={18} aria-hidden="true" />
            Compartilhar link
          </button>
        )}
        <button
          type="button"
          onClick={copiar}
          style={{ ...estiloBotao, backgroundColor: '#151518', border: '1px solid #2d2d35', color: '#ffffff' }}
        >
          {aviso === 'Link copiado' ? <FiCheck size={18} aria-hidden="true" /> : <FiCopy size={18} aria-hidden="true" />}
          Copiar link
        </button>
      </div>

      <p role="status" style={{ minHeight: '20px', marginTop: '10px', fontSize: '13px', color: '#a1a1aa', textAlign: 'center' }}>
        {aviso}
      </p>
    </div>
  );
}
