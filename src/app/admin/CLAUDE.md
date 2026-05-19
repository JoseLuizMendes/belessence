# CLAUDE.md — `src/app/admin/`

> Painel administrativo do Belessence. Protegido por cookie
> `admin_session === process.env.ADMIN_SECRET`, validado em
> [`src/middleware.ts`](../../middleware.ts).

---

## 1. Estrutura

```
admin/
├── login/                    # Página pública (única exceção do middleware)
├── (authenticated)/          # Route group — apenas organização
│   ├── cupons/
│   ├── mensagens/
│   ├── pedidos/
│   └── produtos/
├── pedidos/[id]/             # Detalhes de pedido
└── produtos/[id]/, /novo/    # CRUD de produto
```

O `(authenticated)` **não** garante autenticação por si só — o middleware
sim. O grupo só evita o nome aparecer na URL.

## 2. Regras de auth

1. **`/admin/login` é a única rota pública** sob `/admin`. Não adicione
   outras exceções no middleware sem revisão.
2. **Login flow** (esperado):
   - POST `/api/admin/login` (criar se ainda não existe) compara senha
     com `ADMIN_SECRET` e seta cookie `admin_session` com `httpOnly`,
     `sameSite: 'lax'`, `secure` em prod.
   - Logout: limpar cookie + `redirect('/admin/login')`.
3. **`ADMIN_SECRET`** é segredo de servidor. Nunca expor via
   `NEXT_PUBLIC_*`, nunca enviar para o client.
4. UI admin **nunca** confia em `localStorage`/`sessionStorage` para
   autorização — apenas cookie validado pelo middleware.

## 3. UX do admin

- Páginas admin **podem** ser mais densas que o público — o usuário é
  operador, não cliente. Mas mantenha tokens de design do projeto (não
  inventar paleta).
- Mobile-friendly mas não otimizado para conversão — focar em formulários
  claros e tabelas legíveis.
- Confirmação obrigatória antes de ações destrutivas (deletar produto,
  cancelar pedido) — usar `AlertDialog` shadcn.

## 4. Mutações

- Toda mutação admin chama `/api/admin/*` ou Server Action marcada com
  `"use server"`.
- Após mutação que afeta vitrine pública: `revalidatePath('/')`,
  `revalidatePath('/allProducts')`, `revalidatePath('/product/[slug]')`
  conforme apropriado.
- Estoque, preço e status de pedido **nunca** são alteráveis pelo client
  sem passagem pelo handler.

## 5. Componentes de apoio

- Forms admin: ver [`../../components/admin/`](../../components/admin/).
- Upload de imagem: `cloudinary-upload.tsx` consome
  `/api/admin/cloudinary` para gerar signature; **nunca colocar API key
  Cloudinary no client**.

## 6. Não faça

- Não exibir mensagens do tipo "Você não está autenticado" no client antes
  do middleware redirecionar — confiar no fluxo do servidor.
- Não criar rotas admin fora de `/admin/*` (o matcher do middleware
  depende desse prefixo).
- Não loggar payloads admin no client (`console.log` em produção vaza
  dados sensíveis).
