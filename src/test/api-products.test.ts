/**
 * Testes — GET /api/products
 * Mocka @/lib/products-db. Foco: contrato HTTP + filtro por IDs.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/products-db", () => ({
  getAllProducts: vi.fn(),
  getFilteredProducts: vi.fn(),
}));

import { GET } from "@/app/api/products/route";
import { getAllProducts, getFilteredProducts } from "@/lib/products-db";

function makeReq(url: string): NextRequest {
  return new NextRequest(url);
}

const p1 = { id: "a", name: "Prod A", slug: "a" } as never;
const p2 = { id: "b", name: "Prod B", slug: "b" } as never;
const p3 = { id: "c", name: "Prod C", slug: "c" } as never;

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sem `ids` retorna lista completa via getFilteredProducts", async () => {
    vi.mocked(getFilteredProducts).mockResolvedValueOnce([p1, p2, p3]);
    const res = await GET(makeReq("http://localhost/api/products"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([p1, p2, p3]);
    expect(getFilteredProducts).toHaveBeenCalledOnce();
    expect(getAllProducts).not.toHaveBeenCalled();
  });

  it("com `?ids=a,b` retorna apenas esses produtos via getAllProducts", async () => {
    vi.mocked(getAllProducts).mockResolvedValueOnce([p1, p2, p3]);
    const res = await GET(makeReq("http://localhost/api/products?ids=a,b"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([p1, p2]);
    expect(getAllProducts).toHaveBeenCalledOnce();
    expect(getFilteredProducts).not.toHaveBeenCalled();
  });

  it("IDs inexistentes são silenciosamente removidos", async () => {
    vi.mocked(getAllProducts).mockResolvedValueOnce([p1]);
    const res = await GET(makeReq("http://localhost/api/products?ids=a,zzz"));
    expect(await res.json()).toEqual([p1]);
  });

  it("`?ids=,,,` (apenas vírgulas) retorna [] sem chamar o banco", async () => {
    // idsParam é truthy (",,,"), mas após split + filter(Boolean) fica vazio.
    const res = await GET(makeReq("http://localhost/api/products?ids=,,,"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
    expect(getAllProducts).not.toHaveBeenCalled();
    expect(getFilteredProducts).not.toHaveBeenCalled();
  });

  it("aceita espaços ao redor dos IDs (`a, b ,c`)", async () => {
    vi.mocked(getAllProducts).mockResolvedValueOnce([p1, p2, p3]);
    const res = await GET(
      makeReq("http://localhost/api/products?ids=a,%20b%20,c"),
    );
    expect(await res.json()).toEqual([p1, p2, p3]);
  });

  it("retorna 500 quando o banco lança", async () => {
    vi.mocked(getFilteredProducts).mockRejectedValueOnce(new Error("DB down"));
    const res = await GET(makeReq("http://localhost/api/products"));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Erro ao buscar produtos");
  });
});
