/**
 * Testes — product-image (helpers de URL de imagem)
 * Funções puras. Cobre placeholder, caminhos locais e injeção de
 * transformações Cloudinary (f_auto,q_auto).
 */

import { describe, it, expect } from "vitest";
import { productImageSrc, isCloudinaryUrl } from "@/lib/products/infrastructure/external/product-image";

describe("productImageSrc", () => {
  it("retorna placeholder para null/undefined/vazio", () => {
    expect(productImageSrc(null)).toBe("/assets/placeholder.svg");
    expect(productImageSrc(undefined)).toBe("/assets/placeholder.svg");
    expect(productImageSrc("")).toBe("/assets/placeholder.svg");
    expect(productImageSrc("   ")).toBe("/assets/placeholder.svg");
  });

  it("devolve caminho local inalterado", () => {
    expect(productImageSrc("/assets/Perf1.jpg")).toBe("/assets/Perf1.jpg");
  });

  it("faz trim de espaços ao redor", () => {
    expect(productImageSrc("  /assets/x.png  ")).toBe("/assets/x.png");
  });

  it("URL não-Cloudinary é mantida como está", () => {
    const url = "https://example.com/img.jpg";
    expect(productImageSrc(url)).toBe(url);
  });

  it("injeta f_auto,q_auto em URL Cloudinary sem transformações", () => {
    const raw =
      "https://res.cloudinary.com/demo/image/upload/v1234/product.jpg";
    const out = productImageSrc(raw);
    expect(out).toContain("/image/upload/f_auto,q_auto/");
    expect(out).toContain("v1234/product.jpg");
  });

  it("não duplica transformações se já existirem", () => {
    const raw =
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/product.jpg";
    const out = productImageSrc(raw);
    // Não deve adicionar outro f_auto,q_auto
    expect(out.match(/f_auto/g)?.length).toBe(1);
  });

  it("URL Cloudinary sem /image/upload/ é mantida", () => {
    const raw = "https://res.cloudinary.com/demo/raw/upload/file.pdf";
    expect(productImageSrc(raw)).toBe(raw);
  });

  it("string http malformada cai no catch e é devolvida", () => {
    const raw = "http://[invalid";
    expect(productImageSrc(raw)).toBe(raw);
  });
});

describe("isCloudinaryUrl", () => {
  it("true para host res.cloudinary.com", () => {
    expect(
      isCloudinaryUrl("https://res.cloudinary.com/demo/image/upload/x.jpg"),
    ).toBe(true);
  });

  it("false para outros hosts", () => {
    expect(isCloudinaryUrl("https://example.com/x.jpg")).toBe(false);
  });

  it("false para caminho local / vazio / null", () => {
    expect(isCloudinaryUrl("/assets/x.jpg")).toBe(false);
    expect(isCloudinaryUrl("")).toBe(false);
    expect(isCloudinaryUrl(null)).toBe(false);
  });

  it("false para URL malformada", () => {
    expect(isCloudinaryUrl("http://[invalid")).toBe(false);
  });
});
