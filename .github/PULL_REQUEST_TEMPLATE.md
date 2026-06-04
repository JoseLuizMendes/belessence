## O que muda

<!-- Descreva objetivamente o que este PR faz e por quê. -->

## Tipo (Conventional Commits)

<!-- O título do PR deve seguir Conventional Commits: `tipo(escopo): resumo`. -->

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `chore` — manutenção/infra (sem mudança de comportamento)
- [ ] `docs` — só documentação
- [ ] `test` — só testes
- [ ] `refactor` — refatoração sem mudar comportamento
- [ ] `ci` — pipeline/CI
- [ ] `perf` — performance

## Checklist

- [ ] Título do PR no padrão Conventional Commits (`tipo(escopo): resumo`)
- [ ] `pnpm lint` e `pnpm typecheck` passam localmente
- [ ] `pnpm test:coverage` verde (cobertura não regrediu)
- [ ] Se mexi no schema: gerei migration (`pnpm migrate`) — **não** usei `db push`
- [ ] Sem segredos no diff (nada de `.env` real)
- [ ] CI verde no Preview antes do merge

## Notas para revisão

<!-- Pontos de atenção, decisões, link do Preview da Vercel, screenshots. -->
