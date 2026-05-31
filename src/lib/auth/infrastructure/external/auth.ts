/**
 * Auth.js v5 (NextAuth) — configuração central da loja.
 * ─────────────────────────────────────────────────────────────────────
 * - Estratégia de sessão: JWT (obrigatório com o provider Credentials).
 * - Provider Credentials: email + senha (hash bcrypt em User.passwordHash).
 * - Provider Google: cabeado, mas só é ativado se AUTH_GOOGLE_ID/SECRET
 *   existirem no ambiente (fica "pronto e desligado" até ter as chaves).
 * - PrismaAdapter persiste contas OAuth (Google) na tabela accounts.
 *
 * Este módulo é server-only (toca Prisma + bcrypt). Não importar em
 * componentes client — use `useSession`/`signIn`/`signOut` de
 * `next-auth/react` no client.
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { loginSchema } from "@/lib/shared/domain/zod-schemas";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    authorize: async (raw) => {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });
      // Conta inexistente OU conta só-OAuth (sem senha) → falha silenciosa.
      if (!user?.passwordHash) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

// Google só entra na lista quando as chaves OAuth estão configuradas.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  providers,
  callbacks: {
    // `token.sub` já recebe o id do usuário no sign-in (claim padrão do JWT).
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
