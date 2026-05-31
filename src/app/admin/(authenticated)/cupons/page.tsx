/**
 * /admin/cupons — Gestão de cupons de desconto
 * ─────────────────────────────────────────────────────────────────────
 * RSC: lê os cupons via Prisma, converte Decimals→number e datas→ISO para um
 * DTO serializável, calcula um resumo (cards) e delega a parte interativa
 * (criar/editar/ativar/excluir) ao <CouponsClient>.
 */

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { CouponsClient, type CouponDTO } from "@/components/admin/coupons-client";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";

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
      <PageHeader
        eyebrow="Marketing"
        title="Cupons"
        description={`${dto.length} ${dto.length === 1 ? "cupom cadastrado" : "cupons cadastrados"}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Cupons ativos" value={activeCount} />
        <MetricCard
          label="Expirados ou esgotados"
          value={deadCount}
          hint={deadCount > 0 ? "Revisar e limpar" : undefined}
        />
        <MetricCard label="Total de usos" value={totalUses} />
        <MetricCard
          label="Desconto médio"
          value={avgPct != null ? `${avgPct}%` : "—"}
          hint={avgPct != null ? "Em cupons percentuais" : "Sem cupons percentuais"}
        />
      </div>

      <CouponsClient coupons={dto} />
    </div>
  );
}
