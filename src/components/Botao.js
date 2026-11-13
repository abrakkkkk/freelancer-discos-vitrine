import Link from 'next/link';

const VARIANTES = ['primario', 'secundario', 'terciario', 'whatsapp', 'perigo'];
const TAMANHOS = { p: 'botao--p', m: '', g: 'botao--g' };

/**
 * Botão do site. Com `href` vira link com a mesma aparência.
 * `tamanho="p"` (36px) é só para o computador: no celular a área de toque mínima é 44px.
 * Botão só com ícone (`icone`) precisa de `aria-label`.
 */
export default function Botao({
  variante = 'secundario',
  tamanho = 'm',
  icone = false,
  bloco = false,
  carregando = false,
  prefixo = null,
  sufixo = null,
  href,
  className = '',
  type = 'button',
  disabled,
  children,
  ...resto
}) {
  const classes = [
    'botao',
    `botao--${VARIANTES.includes(variante) ? variante : 'secundario'}`,
    TAMANHOS[tamanho] ?? '',
    icone ? 'botao--icone' : '',
    bloco ? 'botao--bloco' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const conteudo = (
    <>
      {carregando ? <span className="botaoGiro" aria-hidden="true" /> : prefixo}
      {children}
      {!carregando && sufixo}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...resto}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {conteudo}
    </button>
  );
}
