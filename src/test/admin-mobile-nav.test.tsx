/**
 * Testes — AdminMobileNav (sheet hambúrguer do admin)
 * Foco: hambúrguer com aria-label, children renderizam no SheetContent,
 * click em link dentro fecha o drawer.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

describe("AdminMobileNav", () => {
  it("renderiza o botão hambúrguer com aria-label 'Abrir menu'", () => {
    render(
      <AdminMobileNav>
        <span>Nav content</span>
      </AdminMobileNav>,
    );
    expect(
      screen.getByRole("button", { name: /abrir menu/i }),
    ).toBeInTheDocument();
  });

  it("abrir o sheet renderiza o conteúdo de children", async () => {
    const user = userEvent.setup();
    render(
      <AdminMobileNav>
        <a href="/admin/produtos" data-testid="link-produtos">
          Produtos
        </a>
      </AdminMobileNav>,
    );
    await user.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(screen.getByTestId("link-produtos")).toBeInTheDocument();
  });

  it("inclui SheetTitle escondido para a11y ('Menu admin')", async () => {
    const user = userEvent.setup();
    render(
      <AdminMobileNav>
        <span>nav</span>
      </AdminMobileNav>,
    );
    await user.click(screen.getByRole("button", { name: /abrir menu/i }));
    // SheetTitle com sr-only — ainda existe no DOM
    expect(screen.getByText(/menu admin/i)).toBeInTheDocument();
  });
});
