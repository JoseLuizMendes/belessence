/**
 * /admin/mensagens — Mensagens do formulário de contato
 * ─────────────────────────────────────────────────────────────────────
 * RSC: lê as mensagens, calcula resumo (cards) e contagens do filtro, e
 * delega a leitura/resposta/exclusão ao <MessagesClient>.
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Inbox, MailWarning, MailCheck, CalendarClock } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  MessagesClient,
  type MessageDTO,
} from "@/components/admin/messages-client";

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
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7 = dto.filter((m) => new Date(m.createdAt).getTime() >= weekAgo).length;

  const visible =
    filter === "nao"
      ? dto.filter((m) => !m.replied)
      : filter === "sim"
        ? dto.filter((m) => m.replied)
        : dto;

  const filters: { key: Filter; label: string; count: number; href: string }[] = [
    { key: "todas", label: "Todas", count: total, href: "/admin/mensagens" },
    { key: "nao", label: "Não respondidas", count: unreplied, href: "/admin/mensagens?status=nao" },
    { key: "sim", label: "Respondidas", count: replied, href: "/admin/mensagens?status=sim" },
  ];

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
          Atendimento
        </p>
        <h1 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
          Mensagens
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {total} {total === 1 ? "mensagem recebida" : "mensagens recebidas"}
        </p>
      </header>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Inbox} label="Total" accent="bg-blue-50 text-blue-700">
          {total}
        </StatCard>
        <StatCard
          icon={MailWarning}
          label="Não respondidas"
          accent="bg-amber-50 text-amber-700"
        >
          {unreplied}
        </StatCard>
        <StatCard
          icon={MailCheck}
          label="Respondidas"
          accent="bg-emerald-50 text-emerald-700"
        >
          {replied}
        </StatCard>
        <StatCard
          icon={CalendarClock}
          label="Últimos 7 dias"
          accent="bg-purple-50 text-purple-700"
        >
          {last7}
        </StatCard>
      </div>

      {/* Filtro */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={f.href}
              className={`px-4 py-2 rounded-full text-[11px] tracking-[0.16em] uppercase transition-colors ${
                active
                  ? "bg-brand-wine text-brand-pink"
                  : "bg-surface-panel text-ink-soft hover:bg-surface-section"
              }`}
            >
              {f.label}
              <span
                className={`ml-2 tabular-nums ${active ? "text-brand-pink/70" : "text-ink-muted"}`}
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

interface StatCardProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  accent: string;
  children: number;
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
      <AnimatedNumber
        value={children}
        immediate
        className="font-playfair italic text-3xl text-ink-strong tabular-nums block"
      />
    </div>
  );
}
