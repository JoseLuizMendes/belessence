---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
nicho: "inspiration"
escopo: "Arquivos estáticos servidos por Next.js"
---

# inspiration

> **Nota de Uso:** Acessados via `/<path>`. Imagens devem ser otimizadas pelo `<Image>` quando possível. Cloudinary é o storage primário; aqui são fallbacks / arquivos locais.
>
> Gerado por `tools/generate-claude-md.js` em 2026-05-30 conforme regra **R8** (`[[CLAUDE]]` raiz + `[[Preferencias Dev#4. CLAUDE.md Universal]]`).

---

## Escopo do Diretório

Acessados via `/<path>`. Imagens devem ser otimizadas pelo `<Image>` quando possível. Cloudinary é o storage primário; aqui são fallbacks / arquivos locais.

---

## Diretrizes Específicas

- Arquivos servidos como estáticos via `/path/file.ext`.
- Imagens grandes preferencialmente no Cloudinary (`res.cloudinary.com`) — aqui só fallbacks / favicons / arquivos pequenos.
- Sem código executável.

---

## Stack Local

Arquivos estáticos (PNG/SVG/WebP/AVIF). Sem código.

---

## Testes

N/A.

---

## Dependências Permitidas

N/A.

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev]]` — stack aprovada
- `[[Niche CLAUDE Template]]` — template canon
