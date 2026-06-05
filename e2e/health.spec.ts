import { test, expect } from "@playwright/test";

/**
 * Smoke dos healthchecks (fatia 1 da Fase 3). Usa o `request` fixture do
 * Playwright (sem navegar). Valida liveness (sem banco) e readiness (com banco).
 */
test("GET /api/health (liveness) responde 200 e status ok", async ({
  request,
}) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("GET /api/health/ready (readiness) responde 200 com o banco up", async ({
  request,
}) => {
  const res = await request.get("/api/health/ready");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.checks.db.ok).toBe(true);
});
