/**
 * Testes — Wishlist Server Actions
 * Cobre: deslogado é no-op; logado delega ao repository.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// setup.ts mocka wishlist-actions inteiro globalmente. Desfazemos pra testar a
// implementação real e mockamos só as dependências (auth + repository).
vi.unmock("@/lib/wishlist/presentation/wishlist-actions");

vi.mock("@/lib/auth/infrastructure/external/auth", () => ({
  auth: vi.fn(),
}));

vi.mock(
  "@/lib/wishlist/infrastructure/persistence/wishlist-repository",
  () => ({
    getWishlistProductIds: vi.fn(),
    toggleWishlist: vi.fn(),
    removeWishlistItem: vi.fn(),
    clearWishlist: vi.fn(),
  }),
);

import { auth } from "@/lib/auth/infrastructure/external/auth";
import * as repo from "@/lib/wishlist/infrastructure/persistence/wishlist-repository";
import {
  getWishlistAction,
  toggleWishlistAction,
  removeWishlistAction,
  clearWishlistAction,
} from "@/lib/wishlist/presentation/wishlist-actions";

const authMock = vi.mocked(auth);
const repoMock = vi.mocked(repo);

describe("Wishlist Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("quando deslogado", () => {
    beforeEach(() => authMock.mockResolvedValue(null));

    it("getWishlistAction retorna []", async () => {
      expect(await getWishlistAction()).toEqual([]);
    });
    it("toggleWishlistAction retorna { ok: false, favorited: false }", async () => {
      expect(await toggleWishlistAction("p-1")).toEqual({
        ok: false,
        favorited: false,
      });
    });
    it("removeWishlistAction retorna { ok: false }", async () => {
      expect(await removeWishlistAction("p-1")).toEqual({ ok: false });
    });
    it("clearWishlistAction retorna { ok: false }", async () => {
      expect(await clearWishlistAction()).toEqual({ ok: false });
    });
  });

  describe("quando logado", () => {
    beforeEach(() => authMock.mockResolvedValue({ user: { id: "u-99" } }));

    it("getWishlistAction retorna IDs do usuário", async () => {
      repoMock.getWishlistProductIds.mockResolvedValueOnce(["p-1", "p-2"]);
      expect(await getWishlistAction()).toEqual(["p-1", "p-2"]);
      expect(repoMock.getWishlistProductIds).toHaveBeenCalledWith("u-99");
    });
    it("toggleWishlistAction propaga favorited do repository", async () => {
      repoMock.toggleWishlist.mockResolvedValueOnce(true);
      expect(await toggleWishlistAction("p-1")).toEqual({
        ok: true,
        favorited: true,
      });
      expect(repoMock.toggleWishlist).toHaveBeenCalledWith("u-99", "p-1");
    });
    it("toggleWishlistAction (favorited=false após toggle)", async () => {
      repoMock.toggleWishlist.mockResolvedValueOnce(false);
      expect(await toggleWishlistAction("p-1")).toEqual({
        ok: true,
        favorited: false,
      });
    });
    it("removeWishlistAction delega", async () => {
      await removeWishlistAction("p-1");
      expect(repoMock.removeWishlistItem).toHaveBeenCalledWith("u-99", "p-1");
    });
    it("clearWishlistAction delega", async () => {
      await clearWishlistAction();
      expect(repoMock.clearWishlist).toHaveBeenCalledWith("u-99");
    });
  });
});
