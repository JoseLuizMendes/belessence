/**
 * /admin/cupons — Gestão de cupons de desconto
 * ─────────────────────────────────────────────────────────────────────
 * RSC: lê os cupons via Prisma, converte Decimals→number e datas→ISO para um
 * DTO serializável, calcula um resumo (cards) e delega a parte interativa
 * (criar/editar/ativar/excluir) ao <CouponsClient>.
 */

import { prisma } from "@/lib/prisma";
import { Tag, CheckCircle2, CalendarX, Percent } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CouponsClient, type CouponDTO } from "@/components/admin/coupons-client";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  const dto: CouponDTO[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    minOrder: c.minOrder != null ? Number(c.minOrder) : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
  }));

  // ── Resumo ──────────────────────────────────────────────────────────
  const now = new Date();
  const isExpired = (c: CouponDTO) =>
    c.expiresAt != null && new Date(c.expiresAt) < now;
  const isExhausted = (c: CouponDTO) =>
    c.maxUses != null && c.usedCount >= c.maxUses;

  const activeCount = dto.filter(
    (c) => c.active && !isExpired(c) && !isExhausted(c),
  ).length;
  const deadCount = dto.filter((c) => isExpired(c) || isExhausted(c)).length;
  const totalUses = dto.reduce((acc, c) => acc + c.usedCount, 0);
  const pctValues = dto.filter((c) => c.type === "PERCENTAGE").map((c) => c.value);
  const avgPct =
    pctValues.length > 0
      ? Math.round(pctValues.reduce((a, b) => a + b, 0) / pctValues.length)
      : null;

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
          Marketing
        </p>
        <h1 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
          Cupons
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {dto.length} {dto.length === 1 ? "cupom" : "cupons"} cadastrado
          {dto.length === 1 ? "" : "s"}
        </p>
      </header>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={CheckCircle2}
          label="Cupons ativos"
          accent="bg-emerald-50 text-emerald-700"
        >
          <AnimatedNumber
            value={activeCount}
            immediate
            className="font-playfair italic text-3xl text-ink-strong tabular-nums block"
          />
        </StatCard>
        <StatCard
          icon={CalendarX}
          label="Expirados/esgotados"
          accent="bg-red-50 text-red-700"
        >
          <AnimatedNumber
            value={deadCount}
            immediate
            className="font-playfair italic text-3xl text-ink-strong tabular-nums block"
          />
        </StatCard>
        <StatCard
          icon={Tag}
          label="Total de usos"
          accent="bg-blue-50 text-blue-700"
        >
          <AnimatedNumber
            value={totalUses}
            immediate
            className="font-playfair italic text-3xl text-ink-strong tabular-nums block"
          />
        </StatCard>
        <StatCard
          icon={Percent}
          label="Desconto médio (%)"
          accent="bg-purple-50 text-purple-700"
        >
          <span className="font-playfair italic text-3xl text-ink-strong tabular-nums block">
            {avgPct != null ? `${avgPct}%` : "—"}
          </span>
        </StatCard>
      </div>

      <CouponsClient coupons={dto} />
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  accent: string;
  children: React.ReactNode;
}

function StatCard({ icon: Icon, label, accent, children }: StatCardProps) {
  return (
    <div className="bg-surface-panel rounded-token-md p-5">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${accent}`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-muted mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}
