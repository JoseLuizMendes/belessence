/**
 * Testes — LenisProvider
 * Foco: passthrough de children, init+cleanup de Lenis no useEffect.
 * Lenis já é mockado globalmente em src/test/setup.ts.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LenisProvider } from "@/components/providers/lenis-provider";
import Lenis from "lenis";

describe("LenisProvider", () => {
  it("renderiza children sem alterações", () => {
    render(
      <LenisProvider>
        <div data-testid="child">Hello</div>
      </LenisProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("instancia Lenis no mount", () => {
    vi.clearAllMocks();
    render(
      <LenisProvider>
        <span />
      </LenisProvider>,
    );
    expect(Lenis).toHaveBeenCalledOnce();
  });

  it("destrói Lenis no unmount (cleanup)", () => {
    vi.clearAllMocks();
    render(
      <LenisProvider>
        <span />
      </LenisProvider>,
    );

    // O mock de Lenis em setup.ts retorna um objeto com .destroy()
    const instance = vi.mocked(Lenis).mock.results[0]?.value;
    expect(instance).toBeDefined();

    cleanup();
    expect(instance.destroy).toHaveBeenCalledOnce();
  });
});
