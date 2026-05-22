/**
 * Testes — useHasMounted
 * Hook simples via useSyncExternalStore. No jsdom (client), retorna true.
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";

describe("useHasMounted", () => {
  it("retorna true em ambiente client (jsdom)", () => {
    const { result } = renderHook(() => useHasMounted());
    expect(result.current).toBe(true);
  });

  it("retorna o mesmo valor estável entre re-renders", () => {
    const { result, rerender } = renderHook(() => useHasMounted());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
