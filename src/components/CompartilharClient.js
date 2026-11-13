'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import Botao from './Botao';
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
      <div className="edCompartilharMeio">
      {/* No celular este contêiner não gera caixa (display: contents) e o vinil fica
          escondido; regras no CSS. */}
      <div className="edQrCapa">
      <svg className="edQrVinil" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle cx="50" cy="50" r="49.5" fill="#1b1b20" stroke="var(--border-light)" strokeWidth="0.5" />
        {[46, 42, 38, 34, 30, 26].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#2c2c33" strokeWidth="0.6" />
        ))}
        <circle cx="50" cy="50" r="20" fill="var(--accent)" />
        <circle cx="50" cy="50" r="2.6" fill="#f4f4f5" />
      </svg>
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
      </div>

      <p className="edQrEndereco">{endereco}</p>
      <p className="edQrDica">Aponte a câmera para abrir o catálogo.</p>

      {/* Celular: menu de compartilhar do sistema. Computador: copiar o endereço. */}
      <div className="edCompartilharAcoes">
        {podeCompartilhar ? (
          <>
            <Botao variante="primario" tamanho="g" bloco onClick={compartilhar} prefixo={<FiShare2 size={18} aria-hidden="true" />}>
              Compartilhar
            </Botao>
            <Botao variante="terciario" onClick={copiar} prefixo={iconeCopiar}>
              {copiado ? 'Link copiado' : 'Copiar link'}
            </Botao>
          </>
        ) : (
          <Botao variante="primario" tamanho="g" bloco onClick={copiar} prefixo={iconeCopiar}>
            {copiado ? 'Link copiado' : 'Copiar link'}
          </Botao>
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
