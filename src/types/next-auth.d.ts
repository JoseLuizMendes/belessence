/**
 * Augmentação de tipos do Auth.js — expõe `user.id` na sessão e no JWT.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
