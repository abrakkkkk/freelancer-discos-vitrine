'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Contador compartilhado: com sacola e detalhe abertos juntos, a página só volta
// a rolar quando o último fechar.
let modaisAbertos = 0;
let overflowOriginal = '';

/**
 * Comportamento de modal no celular e no teclado:
 * - trava a rolagem da página por trás;
 * - fecha com Esc e com o botão "voltar" do Android/navegador;
 * - leva o foco para o painel, mantém o Tab dentro dele e devolve o foco ao fechar.
 * O painel referenciado precisa de tabIndex={-1}.
 *
 * Links dentro do modal devem usar a função retornada (fecharENavegar): ela fecha o
 * modal, remove a entrada do histórico e só então navega. Navegar direto faria o
 * history.back() do fechamento desfazer a navegação.
 */
export function useModalDialog(isOpen, onClose, dialogRef) {
  const router = useRouter();
  const onCloseRef = useRef(onClose);
  const destinoRef = useRef(null);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const focoAnterior = document.activeElement;
    if (modaisAbertos === 0) {
      overflowOriginal = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    modaisAbertos++;

    dialogRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (e) => {
      const dialog = dialogRef.current;
      if (!dialog || !dialog.contains(document.activeElement)) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const focaveis = [...dialog.querySelectorAll(FOCAVEIS)];
      if (focaveis.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === dialog)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    // Entrada própria no histórico: o "voltar" fecha o modal em vez de sair da página.
    // O estado do Next é preservado (spread) para o roteador continuar funcionando.
    const marca = `modal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.history.pushState({ ...window.history.state, __modal: marca }, '');
    let fechadoPeloVoltar = false;
    const handlePopState = () => {
      // Ainda é a entrada deste modal (outro modal acima dele foi fechado): continua aberto.
      if (window.history.state?.__modal === marca) return;
      fechadoPeloVoltar = true;
      onCloseRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);

      modaisAbertos--;
      if (modaisAbertos === 0) document.body.style.overflow = overflowOriginal;

      const destino = destinoRef.current;
      destinoRef.current = null;

      // Fechado pelo X/overlay/Esc/link: remove a entrada que criamos, se ela ainda for a atual.
      if (!fechadoPeloVoltar && window.history.state?.__modal === marca) {
        if (destino) {
          const navegar = () => setTimeout(() => router.push(destino), 0);
          window.addEventListener('popstate', navegar, { once: true });
        }
        window.history.back();
      } else if (destino) {
        router.push(destino);
      }

      if (focoAnterior && typeof focoAnterior.focus === 'function' && document.contains(focoAnterior)) {
        focoAnterior.focus({ preventScroll: true });
      }
    };
  }, [isOpen, dialogRef, router]);

  return useCallback((href) => {
    destinoRef.current = href;
    onCloseRef.current();
  }, []);
}
