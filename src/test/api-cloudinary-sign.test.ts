/**
 * Testes — POST /api/admin/cloudinary/sign
 * Gera assinatura de upload. Mocka next/headers (cookies) e o SDK cloudinary.
 * Foco: auth defensiva (401), env ausente (500), caminho feliz (assinatura).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const { cookieGet, apiSignRequest } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  apiSignRequest: vi.fn(() => "fake-signature"),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

vi.mock("cloudinary", () => ({
  v2: { utils: { api_sign_request: apiSignRequest } },
}));

// Auth admin agora é via token assinado. Mockamos a verificação: só o token
// "valid-token" é aceito (a correção do jose é coberta por admin-auth).
vi.mock("@/lib/auth/presentation/admin-auth", () => ({
  ADMIN_COOKIE: "admin_session",
  verifyAdminSession: vi.fn(async (token?: string) => token === "valid-token"),
}));

import { POST } from "@/app/api/admin/cloudinary/sign/route";

function makeReq(body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/cloudinary/sign", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/admin/cloudinary/sign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ADMIN_SECRET", "secret-123");
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("CLOUDINARY_API_KEY", "key-abc");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret-xyz");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna 401 sem cookie de sessão", async () => {
    cookieGet.mockReturnValueOnce(undefined);
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });

  it("retorna 401 com cookie inválido", async () => {
    cookieGet.mockReturnValueOnce({ value: "errado" });
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
    expect(apiSignRequest).not.toHaveBeenCalled();
  });

  it("retorna 500 quando faltam env vars do Cloudinary", async () => {
    cookieGet.mockReturnValueOnce({ value: "valid-token" });
    vi.stubEnv("CLOUDINARY_API_SECRET", ""); // remove o secret
    const res = await POST(makeReq());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/não configurado/i);
  });

  it("caminho feliz: retorna assinatura + metadados", async () => {
    cookieGet.mockReturnValueOnce({ value: "valid-token" });
    const res = await POST(makeReq({ folder: "belessence/custom" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.signature).toBe("fake-signature");
    expect(json.apiKey).toBe("key-abc");
    expect(json.cloudName).toBe("demo");
    expect(json.folder).toBe("belessence/custom");
    expect(typeof json.timestamp).toBe("number");

    // api_sign_request chamado com timestamp + folder e o secret
    const [params, secret] = apiSignRequest.mock.calls[0] as unknown as [
      Record<string, unknown>,
      string,
    ];
    expect(params.folder).toBe("belessence/custom");
    expect(params).toHaveProperty("timestamp");
    expect(secret).toBe("secret-xyz");
  });

  it("usa folder default quando body não informa", async () => {
    cookieGet.mockReturnValueOnce({ value: "valid-token" });
    const res = await POST(makeReq({}));
    const json = await res.json();
    expect(json.folder).toBe("belessence/products");
  });

  it("body ausente/inválido não quebra (folder default)", async () => {
    cookieGet.mockReturnValueOnce({ value: "valid-token" });
    const res = await POST(makeReq()); // sem body
    expect(res.status).toBe(200);
  });
});
