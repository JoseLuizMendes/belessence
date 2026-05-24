/**
 * Mostra o código TOTP que o servidor espera AGORA, a partir do
 * `ADMIN_TOTP_SECRET` do `.env`. Útil para diagnóstico: compare com o número
 * que o app autenticador (Authy) mostra no mesmo instante.
 *
 *  - Iguais   → o segredo está certo (o problema é a senha ou o relógio).
 *  - Diferentes → o Authy está com outro segredo (rode admin-setup.mjs e
 *                 re-escaneie o QR).
 *
 * Uso: node scripts/admin-totp-now.mjs
 */

import fs from "fs";
import { generate } from "otplib";

if (!fs.existsSync(".env")) {
  console.error("Arquivo .env não encontrado. Rode dentro de frontend/belessence/.");
  process.exit(1);
}

const m = fs.readFileSync(".env", "utf8").match(/^ADMIN_TOTP_SECRET="?([^"\r\n]+)"?/m);
if (!m) {
  console.error("ADMIN_TOTP_SECRET não está no .env — 2FA não configurado.");
  process.exit(1);
}

const code = await generate({ secret: m[1] });
console.log("\nCódigo TOTP esperado agora:", code);
console.log("(muda a cada 30s — compare com o Authy no mesmo instante)\n");
