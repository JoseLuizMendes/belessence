import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom não implementa window.matchMedia. Componentes que verificam
// prefers-reduced-motion (Newsletter, etc.) precisam dele.
// IMPORTANTE: não usar vi.fn() aqui — clearAllMocks() em outros testes
// limparia a implementação. Função pura sobrevive.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// jsdom não implementa IntersectionObserver. Componentes que observam
// viewport (BrandGallery, Hero, animações com once:true) precisam dele.
if (typeof globalThis.IntersectionObserver === "undefined") {
  // @ts-expect-error — tipo simplificado, suficiente para testes
  globalThis.IntersectionObserver = class {
    constructor(_cb: unknown) {
      void _cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

// jsdom não implementa ResizeObserver. Componentes responsivos
// (Embla, Radix Tabs, etc.) podem precisar.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    constructor(_cb: unknown) {
      void _cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom não implementa scrollIntoView no Element.prototype.
if (
  typeof window !== "undefined" &&
  !Element.prototype.scrollIntoView
) {
  Element.prototype.scrollIntoView = function () {};
}

// Mock global do Prisma — testes individuais sobrescrevem com mockResolvedValueOnce.
// Centralizado aqui para evitar repetir em cada arquivo de teste.
// Cobertura: models usados em src/lib/* e src/app/api/*.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    contactMessage: {
      create: vi.fn(),
    },
    newsletterSubscriber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (arg: unknown) => {
      // Suporta tanto array de promises quanto callback(tx)
      if (Array.isArray(arg)) return Promise.all(arg);
      if (typeof arg === "function") return (arg as (tx: unknown) => unknown)({});
      return arg;
    }),
  },
}));

// Mock GSAP para não quebrar testes unitários (GSAP requer browser).
// `to/from/fromTo/set` retornam um "tween" com kill/play/pause — alguns
// hooks (useCountUp) chamam esses métodos na cleanup.
const makeTween = () => ({
  kill: vi.fn(),
  play: vi.fn().mockReturnThis(),
  pause: vi.fn().mockReturnThis(),
  resume: vi.fn().mockReturnThis(),
  restart: vi.fn().mockReturnThis(),
  progress: vi.fn().mockReturnThis(),
});

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    from: vi.fn(() => makeTween()),
    to: vi.fn(() => makeTween()),
    fromTo: vi.fn(() => makeTween()),
    set: vi.fn(() => makeTween()),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
      lagSmoothing: vi.fn(),
    },
  },
  ScrollTrigger: {
    create: vi.fn(() => ({ kill: vi.fn() })),
    update: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock("@gsap/react", () => ({
  useGSAP: vi.fn((fn: () => void) => fn()),
}));

vi.mock("lenis", () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    raf: vi.fn(),
    destroy: vi.fn(),
  })),
}));
