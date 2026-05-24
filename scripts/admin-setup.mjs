/**
 * Setup do login admin (Caminho A: senha + TOTP).
 * Gera o hash bcrypt da senha e um segredo TOTP, imprimindo as linhas para
 * colar no .env e um QR para escanear no app autenticador.
 *
 * Uso: node scripts/admin-setup.mjs "<senha-do-admin>"
 *
 * Nada é gravado em disco — copie a saída para o seu .env (que não é commitado).
 */

import bcrypt from "bcryptjs";
import { generateSecret, generateURI } from "otplib";
import qrcode from "qrcode-terminal";

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/admin-setup.mjs "<senha-do-admin>"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("Senha muito curta — use pelo menos 8 caracteres.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const secret = generateSecret();
const uri = generateURI({ issuer: "Mari Beauty Admin", label: "admin", secret });

// O Next carrega o .env com dotenv-expand, que interpreta `$` como referência
// de variável. Hashes bcrypt contêm `$` (ex.: `$2b$12$...`) — sem escapar, o
// valor é corrompido em runtime e a senha nunca valida. Escapamos cada `$`.
const hashEscaped = hash.replace(/\$/g, "\\$");

console.log("\n=== Copie estas linhas para o seu .env ===\n");
console.log(`ADMIN_PASSWORD_HASH="${hashEscaped}"`);
console.log(`ADMIN_TOTP_SECRET="${secret}"`);
console.log(
  "\n=== 2FA: escaneie o QR abaixo OU digite a chave manual no app ===\n",
);
console.log(`Chave (entrada manual): ${secret}`);
console.log(`otpauth URI: ${uri}\n`);
qrcode.generate(uri, { small: true });
console.log(
  "\nApós salvar no .env, reinicie o servidor. O login passará a exigir o código.\n",
);
