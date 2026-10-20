# Design System — Freelancer Discos Vitrine

<!-- impeccable:design-schema 1 -->

## Incumbent Visual World

A vitrine adota uma identidade visual sóbria, sólida e autêntica de loja física de discos ("Solid Dark"), recusando expressamente modismos de IA como glassmorphism, degradês coloridos em texto ou cards flutuantes com desfoque.

## Color Palette

- **Fundo Base:** `#09090b` (preto sólido fosco)
- **Superfícies de Cards:** `#151518` (cinza escuro sólido)
- **Modais e Drawers:** `#18181c` (superfície sólida de alta opacidade)
- **Overlays:** `#050506` (100% opaco, sem transparência)
- **Bordas Estruturais:** `#232328`, `#2d2d35` (1px sólido)
- **Destaque Primário (Accent):** `#8b1e1e` (vinho / bordô profundo)
- **Texto Principal:** `#e4e4e7` (branco suave de alto contraste)
- **Texto Secundário:** `#a1a1aa`, `#71717a`
- **Badges de Selo/Gravadora:** Fundo `#1f1b24`, borda `#3c3247`, texto `#d8b4fe`

## Typography

- **Títulos:** Outfit (geométrica, moderna, elegante)
- **Corpo e Dados:** Figtree (alta legibilidade em telas pequenas e ambientes com pouca luz)

## Regras Anti-Padrão Proibidas

1. **Sem Glassmorphism:** Proibido `backdrop-filter: blur()` e fundos com transparência em superfícies.
2. **Sem Texto em Gradiente:** Ênfase é dada por peso (`fontWeight: 700`) e tamanho, nunca por degradê.
3. **Sem Halos Neon:** Sombras são sutis e direcionais com offset (`0 2px 8px rgba(0, 0, 0, 0.4)`), nunca brilhos coloridos fluorescentes.
4. **Sem Cards Aninhados:** Cada produto possui apenas um container card limpo.
