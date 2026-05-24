# Login do Admin — Documentação e Guia de Suporte

> Painel administrativo do **Mari Beauty** (`/admin/*`). Single-tenant: existe
> **uma** operadora (a "Mari"). Este documento explica como o login funciona,
> o que foi corrigido, e — principalmente — **como você presta suporte** quando
> algo der errado no login dela.

---

## 1. Visão geral — como o login funciona

Há **dois caminhos** de entrada, e ambos terminam setando o mesmo cookie de
sessão assinado (`admin_session`):

### Caminho A — Senha + código do autenticador (TOTP)
1. A operadora digita a **senha** e o **código de 6 dígitos** do app
   autenticador (Authy / Google Authenticator).
2. O servidor confere a senha contra o hash bcrypt (`ADMIN_PASSWORD_HASH`) e o
   código contra o segredo TOTP (`ADMIN_TOTP_SECRET`).
3. Se os dois baterem, cria a sessão e redireciona para `/admin`.
4. **Proteção anti-força-bruta:** após **5 tentativas erradas** vindas do mesmo
   IP, o login fica **bloqueado por 15 minutos** (lockout).

### Caminho B — Entrar com Google
- OAuth com **allowlist de e-mails** (`ADMIN_ALLOWLIST_EMAILS`). Só e-mails
  nessa lista conseguem entrar. É o **plano B**: se a senha/TOTP der problema,
  o Google ainda entra (e vice-versa).

### A sessão
- O cookie `admin_session` é um **JWT assinado** (não o segredo em texto puro).
- **Dura 12 horas** e depois expira (precisa logar de novo). Isso é de
  propósito, para reduzir o risco de um cookie roubado.
- O cookie é `httpOnly` (o JavaScript da página não consegue lê-lo) — por isso
  ele **não aparece** em `document.cookie`. Isso é correto e seguro.

---

## 2. Credenciais atuais

| Item | Valor |
| --- | --- |
| URL de login | `/admin/login` |
| Senha | `mari2026` |
| Código (TOTP) | O número de 6 dígitos que o **Authy** mostra no momento (muda a cada 30s) |
| Alternativa | Botão **"Entrar com Google"** (e-mail precisa estar na allowlist) |

> Para trocar a senha por uma mais forte, veja a seção **5.1**.

---

## 3. O que foi feito nesta rodada (changelog)

1. **Bug crítico corrigido — hash da senha corrompido pelo `.env`.**
   O Next carrega o `.env` com *dotenv-expand*, que interpreta `$` como
   referência de variável. O hash bcrypt contém `$` (ex.: `$2b$12$...`), então
   em runtime ele era **quebrado** (de 60 para ~11 caracteres) e **a senha
   nunca validava** → "Credenciais inválidas". **Correção:** os `$` no
   `ADMIN_PASSWORD_HASH` do `.env` agora estão **escapados como `\$`**. O
   script `scripts/admin-setup.mjs` também foi ajustado para já imprimir o
   hash escapado — qualquer setup futuro sai correto.

2. **Prisma client regenerado.** O model `AdminLoginAttempt` existia no schema
   mas o client gerado estava desatualizado, o que quebrava o controle de
   lockout (`prisma.adminLoginAttempt` vinha `undefined`). Rodamos
   `pnpm prisma generate`.

3. **UX da tela de login melhorada.**
   - O campo de código virou um **input segmentado de 6 caixas** (componente
     `input-otp` do shadcn) — fica óbvio que é um código que você digita.
   - Texto de ajuda explicando que o código vem do **app autenticador** e
     **muda a cada 30 segundos** (antes dava a impressão de que um código
     seria "enviado").
   - Quando o 2FA **não** está configurado, o campo some e aparece um aviso
     apontando para o `admin-setup.mjs`.
   - Botão com estado **"Entrando…"** durante o envio.

### Arquivos tocados
- `src/app/admin/login/page.tsx` — Server Component + server action `login`.
- `src/components/admin/admin-login-form.tsx` — **novo** (parte interativa).
- `scripts/admin-setup.mjs` — passa a escapar `$` no hash.
- `scripts/admin-set-password.mjs` — **novo** (troca só a senha, escapando `$`).
- `scripts/admin-totp-now.mjs` — **novo** (mostra o TOTP esperado, p/ diagnóstico).
- `docs/admin-login.md` — **novo** (este documento).
- `.env` — `ADMIN_PASSWORD_HASH` reescrito escapado (local, não commitado).

---

## 4. Onde mora cada coisa (mapa rápido)

| Responsabilidade | Arquivo |
| --- | --- |
| Tela de login + server action | `src/app/admin/login/page.tsx` |
| Formulário (UI interativa) | `src/components/admin/admin-login-form.tsx` |
| Verificar senha + TOTP + lockout | `src/lib/admin-login.ts` |
| Sessão assinada (cookie/JWT) | `src/lib/admin-auth.ts` |
| Login com Google + allowlist | `src/lib/admin-google.ts` |
| Proteção das rotas `/admin/*` | `src/middleware.ts` |
| **Gerar senha + TOTP (reset completo)** | `scripts/admin-setup.mjs` |
| **Trocar só a senha** | `scripts/admin-set-password.mjs` |
| **Destravar lockout** | `scripts/admin-unlock.mjs` |
| **Ver o código TOTP esperado agora** | `scripts/admin-totp-now.mjs` |
| Tabela de tentativas | model `AdminLoginAttempt` (`prisma/schema.prisma`) |

Variáveis de ambiente do login (no `.env`, **nunca commitar**):
`ADMIN_SECRET`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`,
`ADMIN_ALLOWLIST_EMAILS`, `AUTH_GOOGLE_*`.

---

## 5. GUIA DE SUPORTE — quando a Mari não consegue entrar

> Todos os comandos rodam **dentro de `frontend/belessence/`** e usam **pnpm**
> (não use `npm install`/`yarn` — quebra o `pnpm-lock.yaml`).
> **Regra de ouro:** sempre que mudar o `.env`, **reinicie o servidor**
> (`Ctrl+C` e `pnpm dev` de novo) — o Next só lê o `.env` na inicialização.

### 5.0 Diagnóstico rápido — qual é o sintoma?

| O que ela vê / relata | Vá para |
| --- | --- |
| "Muitas tentativas. Aguarde alguns minutos." | **5.2** (lockout) |
| "Credenciais inválidas" e ela tem certeza da senha | **5.3** (TOTP) ou **5.1** (senha) |
| Esqueceu a senha | **5.1** |
| Trocou de celular / perdeu o Authy / código nunca funciona | **5.3** |
| Nada funciona e é urgente | **5.4** (Google) e **5.5** (reset total) |
| "Caiu" sozinho / pediu login de novo do nada | **5.6** (sessão expirou — normal) |

---

### 5.1 Esqueceu a senha (ou quer trocar)

**Opção recomendada (só a senha, mantém o TOTP atual):**
```bash
cd frontend/belessence
node scripts/admin-set-password.mjs "NOVA_SENHA"
```
O script gera o hash, **escapa os `$` automaticamente**, grava no `.env`, e
confirma com uma verificação (`verificação: OK`). Depois é só reiniciar o
servidor. Não há nada para copiar/colar à mão.

**Opção completa (gera senha + TOTP + QR de uma vez):**
```bash
cd frontend/belessence
node scripts/admin-setup.mjs "NOVA_SENHA"
```
> ⚠️ Esse script gera **também um TOTP secret NOVO** e **não grava** no `.env`
> (só imprime). Se você usar a saída inteira, terá que colar as duas linhas e
> **re-escanear o QR** no Authy. Para manter o Authy atual, prefira o
> `admin-set-password.mjs` acima.

**Por que isso importa:** o `$` no hash bcrypt **precisa** estar escapado como
`\$` no `.env`. Sem escapar, o Next corrompe o valor e a senha nunca valida —
foi exatamente o bug que tivemos. Os scripts acima já cuidam disso; **evite**
escrever o hash no `.env` à mão.

---

### 5.2 Lockout — "Muitas tentativas. Aguarde alguns minutos."

Acontece após 5 erros do mesmo IP. **Duas formas de resolver:**

- **Esperar 15 minutos** — o bloqueio expira sozinho.
- **Destravar na hora:**
  ```bash
  cd frontend/belessence
  node scripts/admin-unlock.mjs            # zera TODAS as tentativas
  # ou, para um IP específico:
  node scripts/admin-unlock.mjs 200.x.x.x
  ```
  Não precisa reiniciar o servidor depois desse comando (mexe direto no banco).

---

### 5.3 Código do Authy não funciona ("Credenciais inválidas" com senha certa)

Causas e correções, em ordem de probabilidade:

1. **O Authy está com um segredo diferente do `.env`.** Acontece se em algum
   momento rodaram `admin-setup.mjs` (que gera segredo novo) sem atualizar o
   `.env`, ou se escanearam um QR antigo. **Correção:** rode o setup,
   atualize o `.env` com a **nova** linha `ADMIN_TOTP_SECRET` e **re-escaneie
   o QR** no Authy:
   ```bash
   cd frontend/belessence
   node scripts/admin-setup.mjs "mari2026"   # use a senha atual dela
   ```
   Copie a linha `ADMIN_TOTP_SECRET=...` para o `.env`, escaneie o QR que
   aparece no terminal, reinicie o servidor.

2. **Relógio do celular fora de hora.** O TOTP depende do horário. O sistema
   tolera ±30s, mas se o celular estiver muito adiantado/atrasado, falha.
   **Correção:** no celular, ative **data e hora automáticas**. No Authy
   especificamente: *Configurações → Account → (sincronizar horário)*.

3. **Digitou o código velho.** O código muda a cada 30s. Se faltar pouco
   tempo, espere o próximo e digite o novo.

**Como conferir rápido se o segredo bate** (mostra o código que o `.env`
espera *agora* — compare com o que o Authy mostra no mesmo instante):
```bash
cd frontend/belessence
node scripts/admin-totp-now.mjs
```
Se esse número for **igual** ao do Authy → o segredo está certo (problema é
senha ou relógio). Se for **diferente** → o Authy está com outro segredo
(faça o passo 1).

---

### 5.4 Plano B imediato — Entrar com Google

Se a senha/TOTP estiver enrolada e for urgente, use o botão
**"Entrar com Google"** na tela de login. Requisito: o e-mail da conta Google
precisa estar em `ADMIN_ALLOWLIST_EMAILS` no `.env` (lista separada por
vírgula). Para adicionar um e-mail, edite essa variável e reinicie o servidor.

---

### 5.5 Reset total (perdeu tudo: senha **e** Authy)

```bash
cd frontend/belessence
node scripts/admin-setup.mjs "umaSenhaNova123"
```
1. Cole **as duas** linhas (`ADMIN_PASSWORD_HASH` e `ADMIN_TOTP_SECRET`) no
   `.env`, substituindo as antigas.
2. **Escaneie o QR** que aparece no terminal com o Authy (ou digite a chave
   manual mostrada).
3. Reinicie o servidor (`pnpm dev`).
4. Pronto: nova senha + novo 2FA.

---

### 5.6 "Ela foi deslogada sozinha"

Normal: a sessão dura **12 horas** e depois expira. É só logar de novo.

Se você quiser **forçar logout de todas as sessões** (ex.: suspeita de cookie
vazado), abra `src/lib/admin-auth.ts` e **incremente** a constante
`TOKEN_VERSION` (de `1` para `2`). Isso invalida todos os cookies emitidos.
Requer um novo deploy/restart.

---

## 6. Cheat sheet (cola rápida)

```bash
cd frontend/belessence

# Destravar lockout (todas as chaves)
node scripts/admin-unlock.mjs

# Trocar só a senha (mantém TOTP) — grava no .env já escapado e verifica
node scripts/admin-set-password.mjs "NOVA_SENHA"

# Reset completo: gera senha + TOTP + QR (cole as 2 linhas no .env, re-escaneie)
node scripts/admin-setup.mjs "NOVA_SENHA"

# Ver o código TOTP que o .env espera agora (comparar com o Authy)
node scripts/admin-totp-now.mjs
```

**Lembretes:**
- Mudou o `.env`? **Reinicie** o `pnpm dev`.
- `$` no hash bcrypt **sempre** escapado como `\$` no `.env`.
- Sempre **pnpm**, nunca `npm install`/`yarn`.
- O `.env` **nunca** vai para o git.
