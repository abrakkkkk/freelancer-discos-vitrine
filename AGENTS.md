# Protocolo Obrigatório de Engenharia e Design — Freelancer Discos Vitrine

Este arquivo é lido automaticamente pelo Antigravity sempre que o projeto for aberto.

## 1. Skill de Design Obrigatória: Impeccable

Para todas as tarefas de frontend, UI, UX, componentes e design neste projeto, a skill **`impeccable`** (`.agents/skills/impeccable/SKILL.md`) é **OBRIGATÓRIA**.

### Diretrizes Centrais (Craft Floor)
- **Zero Glassmorphism / Vibecoding:** Proibido o uso de `backdrop-filter`, fundos transparentes `rgba()` em superfícies e bordas com neons/degradês.
- **Design Sólido e Autêntico:** Utilizar cores sólidas e opacas da paleta do sistema (`#09090b`, `#151518`, `#18181c`, `#232328`, `#8b1e1e`).
- **Mobile-First Real:** Alvos de toque com no mínimo 44px, tipografia legível (Figtree para texto, Outfit para títulos), inputs com 16px para evitar auto-zoom no iOS Safari.
- **Detector Impeccable:** Antes de finalizar qualquer alteração de UI, verificar regras anti-padrão via `.agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe detect src`.

## 2. Comandos Disponíveis do Impeccable
- `/impeccable audit` — Auditoria técnica de qualidade, responsividade e acessibilidade.
- `/impeccable critique` — Revisão heurística de hierarquia visual e clareza de interface.
- `/impeccable polish` — Ajuste fino e checagem de consistência visual antes do deploy.
- `/impeccable harden` — Blindagem de estados de erro, overflow de texto e casos de borda.
- `/impeccable distill` — Simplificação e remoção de elementos desnecessários.

## 3. Regras de Negócio Críticas
- **Segurança Supabase:** Nunca expor `SUPABASE_SECRET_KEY` ou chaves de serviço no cliente; o acesso ao banco ocorre estritamente no servidor (`src/lib/supabaseServer.js`).
- **Chaves de Sacola:** Itens da sacola devem utilizar a chave composta `categoria:id` via `getCartItemKey()`.
- **Labels de Gravadoras:** Sempre preservar o parser de gravadoras `extractRecordLabel()` em itens do catálogo.
- **Aprovação do Usuário:** Nunca realizar alterações substanciais no código ou no design sem comunicação prévia.

