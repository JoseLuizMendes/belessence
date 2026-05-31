/**
 * Route handler do Auth.js v5. Expõe os endpoints /api/auth/* (signin,
 * callback, session, csrf, etc.). Toda a lógica vive em `@/lib/auth`.
 */

import { handlers } from "@/lib/auth/infrastructure/external/auth";

export const { GET, POST } = handlers;
