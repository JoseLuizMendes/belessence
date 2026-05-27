/**
 * /admin/mensagens — Mensagens do formulário de contato
 * ─────────────────────────────────────────────────────────────────────
 * RSC: lê as mensagens, calcula resumo (cards) e contagens do filtro, e
 * delega a leitura/resposta/exclusão ao <MessagesClient>.
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/api/utils";
import {
  MessagesClient,
  type MessageDTO,
} from "@/components/admin/messages-client";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";

type Filter = "todas" | "nao" | "sim";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filter: Filter =
    sp.status === "nao" ? "nao" : sp.status === "sim" ? "sim" : "todas";

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const dto: MessageDTO[] = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    message: m.message,
    replied: m.replied,
    createdAt: m.createdAt.toISOString(),
  }));

  // ── Resumo + contagens ──────────────────────────────────────────────
  const total = dto.length;
  const unreplied = dto.filter((m) => !m.replied).length;
  const replied = total - unreplied;
  const weekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
  const last7 = dto.filter((m) => new Date(m.createdAt).getTime() >= weekAgo).length;

  const visible =
    filter === "nao"
      ? dto.filter((m) => !m.replied)
      : filter === "sim"
        ? dto.filter((m) => m.replied)
        : dto;

  const filters: { key: Filter; label: string; count: number; href: string }[] = [
    { key: "todas", label: "Todas", count: total, href: "/admin/mensagens" },
    {
      key: "nao",
      label: "Não respondidas",
      count: unreplied,
      href: "/admin/mensagens?status=nao",
    },
    {
      key: "sim",
      label: "Respondidas",
      count: replied,
      href: "/admin/mensagens?status=sim",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Atendimento"
        title="Mensagens"
        description={`${total} ${total === 1 ? "mensagem recebida" : "mensagens recebidas"}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total" value={total} />
        <MetricCard
          label="Não respondidas"
          value={unreplied}
          hint={unreplied > 0 ? "Responder hoje" : "Em dia"}
        />
        <MetricCard label="Respondidas" value={replied} />
        <MetricCard
          label="Últimos 7 dias"
          value={last7}
          hint={last7 > 0 ? "Ritmo de contato" : "Sem volume recente"}
        />
      </div>

      {/* Filtro de status */}
      <div
        role="tablist"
        aria-label="Filtrar mensagens"
        className="flex flex-wrap gap-2 mb-6"
      >
        {filters.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={f.href}
              role="tab"
              aria-selected={active}
              className={cn(
                "rounded-full px-4 py-2 text-[11px] font-medium tracking-[0.18em] uppercase",
                "transition-all duration-200 focus-ring",
                active
                  ? "bg-brand-wine text-brand-pink border border-brand-wine shadow-[0_4px_12px_-4px_rgba(46,11,18,0.35)]"
                  : "bg-admin-panel border border-admin text-ink-soft hover:border-brand-wine/40 hover:text-ink-strong",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "ml-2 font-data",
                  active ? "text-brand-pink/75" : "text-ink-muted",
                )}
              >
                {f.count}
              </span>
            </Link>
          );
        })}
      </div>

      <MessagesClient messages={visible} />
    </div>
  );
}
