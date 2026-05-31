"use client";

/**
 * TabbedProducts — Belessence (inspiração Boty)
 * ─────────────────────────────────────────────────────────────────────
 * Navegação de produtos da home em 2 níveis:
 *   Nível 1 (fileira principal): listas curadas (Destaques/Mais vendidos/
 *     Lançamentos/Promoções) + coleções derivadas do pool.
 *   Nível 2 (sub-fileira): refino por gênero (Todos/Feminino/Masculino/
 *     Unissex), exibido só quando há mais de um gênero no recorte atual.
 *
 * Filtra o pool recebido por prop EM MEMÓRIA — troca instantânea, sem
 * refetch. Reusa <ProductCard>. Sem cor/raio hardcoded (tokens do DS).
 */

import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ProductCard } from "./product-card";
import { blurReveal } from "@/lib/motion/presentation/gsap-helpers";
import { getEffectivePromotion, isEffectivelyNew } from "@/lib/product-status";
import type { Product } from "@/lib/products-db";
import type { Gender } from "@prisma/client";

const MAX_VISIBLE = 8;

type CuratedId = "destaques" | "bestsellers" | "novidades" | "promocoes";

interface PrimaryOption {
  id: string;
  label: string;
  kind: "curated" | "collection";
  /** curated → CuratedId; collection → valor de product.collection */
  value: string;
}

const CURATED: { id: CuratedId; label: string }[] = [
  { id: "destaques", label: "Destaques" },
  { id: "bestsellers", label: "Mais vendidos" },
  { id: "novidades", label: "Lançamentos" },
  { id: "promocoes", label: "Promoções" },
];

const GENDER_LABEL: Record<Gender, string> = {
  FEMININO: "Feminino",
  MASCULINO: "Masculino",
  UNISSEX: "Unissex",
};

function prettifyCollection(value: string): string {
  const cleaned = value.replace(/[-_]/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function hasActivePromo(p: Product): boolean {
  return (
    getEffectivePromotion({
      status: p.status,
      originalPrice: p.originalPrice,
      promotionStartsAt: p.promotionStartsAt,
      promotionEndsAt: p.promotionEndsAt,
    }) != null
  );
}

function isNew(p: Product): boolean {
  return isEffectivelyNew({
    createdAt: p.createdAt,
    markedAsNewUntil: p.markedAsNewUntil,
  });
}

function applyPrimary(products: Product[], option: PrimaryOption): Product[] {
  if (option.kind === "collection") {
    return products.filter((p) => p.collection === option.value);
  }
  switch (option.value as CuratedId) {
    case "bestsellers":
      return [...products].sort((a, b) => b.totalSold - a.totalSold);
    case "novidades":
      return products.filter(isNew);
    case "promocoes":
      return products.filter(hasActivePromo);
    case "destaques":
    default:
      return products;
  }
}

interface TabbedProductsProps {
  products: Product[];
}

export default function TabbedProducts({ products }: TabbedProductsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (titleRef.current) {
        blurReveal(titleRef.current, { trigger: headerRef.current });
      }
    },
    { scope: sectionRef },
  );

  // Opções primárias: curadas (com resultado) + coleções derivadas do pool.
  const primaryOptions = useMemo<PrimaryOption[]>(() => {
    const curated: PrimaryOption[] = CURATED.filter(
      (c) =>
        c.id === "destaques" ||
        applyPrimary(products, {
          id: c.id,
          label: c.label,
          kind: "curated",
          value: c.id,
        }).length > 0,
    ).map((c) => ({ id: c.id, label: c.label, kind: "curated", value: c.id }));

    const collections = Array.from(
      new Set(products.map((p) => p.collection).filter(Boolean)),
    )
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map<PrimaryOption>((c) => ({
        id: `col:${c}`,
        label: prettifyCollection(c),
        kind: "collection",
        value: c,
      }));

    return [...curated, ...collections];
  }, [products]);

  const [primaryId, setPrimaryId] = useState<string>("destaques");
  const [gender, setGender] = useState<Gender | "ALL">("ALL");

  const activePrimary =
    primaryOptions.find((o) => o.id === primaryId) ?? primaryOptions[0];

  const primaryFiltered = useMemo(
    () => (activePrimary ? applyPrimary(products, activePrimary) : products),
    [products, activePrimary],
  );

  // Gêneros presentes no recorte atual (sub-fileira só aparece se > 1).
  const availableGenders = useMemo(() => {
    const set = new Set<Gender>();
    for (const p of primaryFiltered) set.add(p.gender);
    return Array.from(set);
  }, [primaryFiltered]);

  const showGenderRow = availableGenders.length > 1;

  const visible = useMemo(() => {
    const byGender =
      gender === "ALL" || !showGenderRow
        ? primaryFiltered
        : primaryFiltered.filter((p) => p.gender === gender);
    return byGender.slice(0, MAX_VISIBLE);
  }, [primaryFiltered, gender, showGenderRow]);

  function selectPrimary(id: string) {
    setPrimaryId(id);
    setGender("ALL"); // reset do nível 2 ao trocar o nível 1
  }

  if (products.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="colecoes"
      className="py-16 sm:py-24 md:py-28 bg-surface-base"
    >
      <div className="container-belessence">
        <div ref={headerRef} className="text-center mb-10 sm:mb-14">
          <p className="eyebrow mb-4 text-brand-wine">Explore a coleção</p>
          <div className="overflow-hidden pb-[0.12em]">
            <h2
              ref={titleRef}
              className="display-title text-ink-strong text-[clamp(2rem,4.5vw,3.4rem)]"
            >
              Nossa Coleção
            </h2>
          </div>
          <div className="mx-auto mt-5 h-px w-12 divider-gold" />
        </div>

        {/* Nível 1 — pílulas principais */}
        <div
          role="group"
          aria-label="Filtrar por coleção"
          className="mb-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          {primaryOptions.map((opt) => {
            const active = opt.id === activePrimary?.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectPrimary(opt.id)}
                className={[
                  "pill-press focus-ring rounded-full px-4 py-2 text-xs font-medium tracking-[0.08em] uppercase transition-silk",
                  active
                    ? "bg-brand-wine text-brand-pink shadow-card"
                    : "border-subtle border bg-surface-panel text-ink-soft hover:text-brand-wine",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Nível 2 — refino por gênero */}
        {showGenderRow && (
          <div
            role="group"
            aria-label="Refinar por gênero"
            className="mb-10 flex flex-wrap items-center justify-center gap-2"
          >
            {(["ALL", ...availableGenders] as const).map((g) => {
              const active = gender === g;
              const label = g === "ALL" ? "Todos" : GENDER_LABEL[g];
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setGender(g)}
                  className={[
                    "pill-press focus-ring rounded-full px-3.5 py-1.5 text-[11px] font-medium tracking-[0.1em] uppercase transition-fast",
                    active
                      ? "bg-brand-pink text-brand-wine"
                      : "text-ink-muted hover:text-brand-wine",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                sizes="(max-width: 768px) 50vw, 280px"
              />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-ink-muted">
            Nenhum produto nesta seleção no momento.
          </p>
        )}
      </div>
    </section>
  );
}
