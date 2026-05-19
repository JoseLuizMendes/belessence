# CLAUDE.md — `src/lib/hooks/`

> **React hooks** custom do projeto. **Client-only.** Cada hook em arquivo
> `use-*.ts` próprio.

---

## 1. Hooks existentes

| Hook | Propósito |
| --- | --- |
| `use-count-up.ts` | Animar contagem numérica (ex.: total carrinho) |
| `use-has-mounted.ts` | Saber se está no client (pós-hidratação) |

## 2. Regras

1. **Client-only.** Hooks só rodam dentro de Client Components.
   Adicionar `import "client-only"` no topo é boa prática para impedir
   import acidental em server bundle.
2. **Um hook por arquivo.** Nome do arquivo = `kebab-case` do hook
   (`use-count-up.ts` → `useCountUp`).
3. **Sempre prefixo `use`** — exigência do React/ESLint.
4. **Não retornar JSX**. Hooks retornam estado/funções; componentes
   retornam JSX.
5. **Cleanup obrigatório**: `useEffect` que adiciona listener, intervalo,
   subscription **deve** retornar função de cleanup. Memory leak aqui afeta
   navegação inteira (SPA).
6. **Dependency array correto**. Confiar no ESLint
   (`react-hooks/exhaustive-deps`). Não silenciar com `// eslint-disable`
   sem comentário explicando por quê.

## 3. Padrões úteis

- **`useHasMounted`** resolve mismatch SSR/CSR em Zustand persistido:
  ```ts
  const mounted = useHasMounted();
  if (!mounted) return null;
  return <CartCount />;
  ```
- **Stores Zustand**: usar selector fino:
  ```ts
  const count = useCartStore(s => s.items.length);
  ```
- **Debounce/throttle**: se for adicionar, criar `use-debounce.ts` reutilizável
  (não inline no componente).

## 4. Testando hooks

- `renderHook` de `@testing-library/react`.
- Mocks de Zustand: importar a store e chamar `.setState()` antes do
  `renderHook` para preparar estado.

## 5. Não faça

- Não criar hook que apenas wrappear um hook nativo sem ganho real.
- Não acessar `window`/`document` sem guard ou sem estar em `useEffect`.
- Não usar `useLayoutEffect` em código que precisa renderizar no server —
  use `useEffect`.
- Não importar hooks daqui dentro de `src/lib/*.ts` server-side.
