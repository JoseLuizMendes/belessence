# CLAUDE.md — `src/test/`

> Suítes de teste e setup. Stack: **Vitest** (+ jsdom) + Testing Library.
> E2E (Playwright) tem config própria na raiz do app.

---

## 1. Conteúdo

- `setup.ts` — setup global do Vitest. Importa `@testing-library/jest-dom`
  e mocka `gsap`, `@gsap/react`, `lenis` (incompatíveis com jsdom).
- `*.test.ts(x)` — testes unitários e de componente.

## 2. Convenções

1. **Vitest** é o runner. Comandos:
   - `pnpm test` — watch
   - `pnpm test:ui` — UI mode
   - `pnpm test -- --run` — single run (CI)
2. **Localização dos testes**:
   - Unit puro (sem React): aqui (`src/test/*.test.ts`).
   - Component tests: ao lado do componente (`product-card.test.tsx`) ou
     aqui, mantendo consistência. **Escolher um padrão por feature**.
3. **Naming**: `<arquivo-em-teste>.test.ts(x)`.
4. **AAA**: Arrange → Act → Assert. Separar com linha em branco.

## 3. Mocks

- **GSAP/Lenis** já são mockados globalmente (ver `setup.ts`). Não
  re-mockar nos testes.
- **Prisma**: **não mockar** em testes que verificam regra de negócio
  crítica (checkout, cupom, estoque). Usar banco de teste real (Postgres
  local ou `pg-mem`). Em testes de UI puros, mockar a função do
  `*-db.ts` é ok.
- **fetch**: usar `vi.fn()` ou MSW se ficar complexo.

## 4. Componentes

- `render` de `@testing-library/react`.
- Queries por **role/label** (acessíveis), evite `getByTestId` salvo
  necessidade.
- Sempre `userEvent` em vez de `fireEvent` para interações.
- Componentes async (RSC) **não** podem ser testados unitariamente —
  cobrir via E2E ou testar o `*-client.tsx` filho.

## 5. E2E (Playwright)

- Config: `playwright.config.*` (a criar/atualizar).
- Comando: `pnpm test:e2e`.
- Suítes E2E ficam em `e2e/` (fora de `src/`).
- Foco: fluxos críticos — busca → carrinho → checkout → sucesso; admin
  login → criar produto.

## 6. Cobertura

- Não buscar % de cobertura — buscar **cobertura dos caminhos críticos**:
  cálculo de preço, frete, cupom, estoque, validação de input.
- Testar erros tão importante quanto sucesso (ex.: cupom expirado, sem
  estoque, payload inválido).

## 7. Não faça

- Não criar testes que dependem de animação real (`gsap` está mockado de
  propósito).
- Não testar implementação interna (estado privado, classes CSS) — teste
  comportamento observável.
- Não compartilhar estado entre testes — cada `it` deve ser isolado.
