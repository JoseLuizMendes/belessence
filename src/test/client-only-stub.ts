// Stub para o módulo virtual `client-only` do Next.js durante testes Vitest.
// O `client-only` original aborta o build se for importado em código server;
// em testes, queremos apenas permitir o import sem efeito colateral.
// (Espelha o server-only-stub.ts — resolve o import de forma determinística
// em qualquer ambiente, sem depender do hoisting do pnpm.)
export {};
