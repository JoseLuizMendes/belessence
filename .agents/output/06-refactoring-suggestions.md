# Refactoring Suggestions

## 1) Consolidar padrão de ação

Hoje:
- `ActionLink` cobre CTAs com `<a>`.

Sugestão:
- Criar `Button` com mesmas variantes/contratos, para ações internas.

## 2) Estados e acessibilidade da navegação

Hoje:
- Navegação lateral revela labels no hover.

Sugestão:
- Adicionar foco visível (`focus-visible:ring-*`) e `aria-current` quando aplicável.
- (Opcional) Marcar item ativo por hash (`:target`) ou observador de interseção.

## 3) Expandir tokens apenas quando houver demanda

Hoje:
- Tokens robustos para cor/motion/shape.

Sugestão:
- Só criar tokens de spacing/text scale se houver CSS fora do Tailwind que exija contrato.

## 4) Normalizar padrões de “divisórias”

Hoje:
- Algumas divisórias são gradientes inline.

Sugestão:
- Criar uma utility/componente pequeno (ex.: `Divider`) para linhas 1px com variantes (full/center).

## 5) Páginas futuras

- Manter o contrato: cada página usa `Container + Section` e evita padding ad hoc.
- Evitar introduzir novas cores; usar `accent` como único highlight.
