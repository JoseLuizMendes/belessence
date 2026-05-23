"use client";

/**
 * Wrapper client do SessionProvider do Auth.js — permite usar `useSession`
 * em componentes client. Montado uma vez no layout raiz.
 */

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
