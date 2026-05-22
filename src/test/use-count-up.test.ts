/**
 * Testes — useCountUp
 * GSAP é mockado em setup.ts (tween com kill/play). Como a animação real
 * não acontece em jsdom, validamos o **contrato** do hook:
 *  - retorna `{ ref, value }` com `value` formatado inicial
 *  - `format` customizado é aplicado
 *  - reage a mudança de `to` (re-cria tween)
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCountUp } from "@/lib/hooks/use-count-up";
import gsap from "gsap";

describe("useCountUp", () => {
  it("retorna { ref, value } no formato default (int arredondado)", () => {
    const { result } = renderHook(() => useCountUp({ to: 1000 }));
    expect(result.current).toHaveProperty("ref");
    expect(result.current).toHaveProperty("value");
    // Valor inicial sempre começa em "0" (format(0))
    expect(result.current.value).toBe("0");
  });

  it("aplica format customizado ao valor inicial", () => {
    const format = (n: number) => `R$ ${n.toFixed(2)}`;
    const { result } = renderHook(() => useCountUp({ to: 100, format }));
    expect(result.current.value).toBe("R$ 0.00");
  });

  it("chama gsap.to para criar o tween da animação", () => {
    vi.clearAllMocks();
    renderHook(() => useCountUp({ to: 500, immediate: true }));
    expect(gsap.to).toHaveBeenCalled();
  });

  it("re-cria o tween quando `to` muda", () => {
    vi.clearAllMocks();
    const { rerender } = renderHook(
      ({ to }: { to: number }) => useCountUp({ to, immediate: true }),
      { initialProps: { to: 100 } },
    );
    const firstCalls = vi.mocked(gsap.to).mock.calls.length;
    rerender({ to: 200 });
    expect(vi.mocked(gsap.to).mock.calls.length).toBeGreaterThan(firstCalls);
  });

  it("ref é uma RefObject com `.current` mutável", () => {
    const { result } = renderHook(() => useCountUp({ to: 100 }));
    expect(result.current.ref).toHaveProperty("current");
    // Inicia null (não foi attachado a nenhum elemento DOM no teste)
    expect(result.current.ref.current).toBeNull();
  });

  describe("prefers-reduced-motion (a11y)", () => {
    const original = window.matchMedia;
    afterEach(() => {
      window.matchMedia = original;
      vi.clearAllMocks();
    });

    it("com reduced-motion, define o valor final direto sem animar", () => {
      // Stub matchMedia para retornar matches:true neste teste.
      window.matchMedia = ((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;

      vi.clearAllMocks(); // zera chamadas acumuladas de testes anteriores
      const { result } = renderHook(() =>
        useCountUp({ to: 1234, format: (n) => String(Math.round(n)) }),
      );
      // Sem animação: valor já é o final.
      expect(result.current.value).toBe("1234");
      // gsap.to NÃO é chamado no caminho reduced-motion.
      expect(gsap.to).not.toHaveBeenCalled();
    });
  });
});
