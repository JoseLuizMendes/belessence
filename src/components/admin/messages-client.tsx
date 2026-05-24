"use client";

/**
 * MessagesClient — lista interativa de mensagens de contato.
 * Recebe as mensagens já filtradas/serializadas do RSC e orquestra:
 *  - Dialog de leitura da mensagem completa
 *  - "Responder por email" (mailto) que também marca como respondida
 *  - Toggle manual respondida/não respondida
 *  - Excluir com AlertDialog
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Mail, MailOpen, Reply, Trash2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  setMessageReplied,
  deleteMessage,
} from "@/app/admin/(authenticated)/mensagens/actions";

export interface MessageDTO {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  replied: boolean;
  createdAt: string;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `há ${days}d`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function fullDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function mailtoHref(m: MessageDTO): string {
  return `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`;
}

export function MessagesClient({ messages }: { messages: MessageDTO[] }) {
  const [selected, setSelected] = useState<MessageDTO | null>(null);
  const [, startTransition] = useTransition();

  const toggleReplied = (m: MessageDTO, replied: boolean) => {
    startTransition(async () => {
      const r = await setMessageReplied(m.id, replied);
      if (!r.ok) toast.error(r.error ?? "Falha ao atualizar.");
      else toast.success(replied ? "Marcada como respondida." : "Marcada como não respondida.");
      setSelected((cur) => (cur && cur.id === m.id ? { ...cur, replied } : cur));
    });
  };

  const handleReply = (m: MessageDTO) => {
    // Marca como respondida ao iniciar a resposta (não bloqueia o mailto).
    if (!m.replied) {
      startTransition(async () => {
        await setMessageReplied(m.id, true);
      });
    }
  };

  const handleDelete = (m: MessageDTO) => {
    startTransition(async () => {
      const r = await deleteMessage(m.id);
      if (!r.ok) toast.error(r.error ?? "Falha ao excluir.");
      else {
        toast.success("Mensagem excluída.");
        setSelected((cur) => (cur && cur.id === m.id ? null : cur));
      }
    });
  };

  if (messages.length === 0) {
    return (
      <div className="bg-surface-panel rounded-token-md p-12 text-center">
        <Inbox className="h-12 w-12 text-ink-muted mx-auto mb-4" strokeWidth={1.2} />
        <p className="text-base text-ink-strong font-medium mb-1">
          Nenhuma mensagem por aqui
        </p>
        <p className="text-sm text-ink-soft">
          As mensagens enviadas pelo formulário de contato aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {messages.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSelected(m)}
              className={`w-full text-left bg-surface-panel rounded-token-md p-4 sm:p-5 flex gap-4 transition-colors hover:bg-surface-section/60 ${
                m.replied ? "" : "ring-1 ring-brand-wine/15"
              }`}
            >
              {/* Avatar */}
              <div
                className={`relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  m.replied
                    ? "bg-surface-section text-ink-soft"
                    : "bg-brand-wine/10 text-brand-wine"
                }`}
              >
                {m.name.trim().charAt(0).toUpperCase() || "?"}
                {!m.replied && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-wine ring-2 ring-surface-panel" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-strong truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={`text-[10px] uppercase tracking-[0.14em] ${
                        m.replied
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {m.replied ? "Respondida" : "Nova"}
                    </Badge>
                    <span className="text-[11px] text-ink-soft whitespace-nowrap">
                      {relativeDate(m.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-ink-strong font-medium mt-1.5 truncate">
                  {m.subject}
                </p>
                <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">
                  {m.message}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Dialog: leitura da mensagem */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="bg-surface-panel max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-playfair italic text-2xl text-ink-strong pr-6">
                  {selected.subject}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="text-sm text-ink-soft">
                    <span className="text-ink-strong font-medium">
                      {selected.name}
                    </span>{" "}
                    · {selected.email}
                    <br />
                    {fullDate(selected.createdAt)}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="my-2 rounded-token-sm bg-surface-base border border-border-subtle p-4 text-sm text-ink-strong whitespace-pre-wrap max-h-72 overflow-y-auto">
                {selected.message}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleReplied(selected, !selected.replied)}
                    className="rounded-full text-[10px] tracking-[0.18em] uppercase border-border-subtle text-ink-soft hover:bg-surface-section"
                  >
                    {selected.replied ? (
                      <>
                        <Mail className="h-3 w-3" />
                        Marcar não respondida
                      </>
                    ) : (
                      <>
                        <MailOpen className="h-3 w-3" />
                        Marcar respondida
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Excluir mensagem"
                        className="rounded-full text-[10px] tracking-[0.18em] uppercase text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-playfair italic text-2xl text-ink-strong">
                          Excluir mensagem?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          A mensagem de <strong>{selected.name}</strong> será
                          removida permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(selected)}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          Sim, excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Button
                  asChild
                  onClick={() => handleReply(selected)}
                  className="loreal-btn-pill h-10 px-5 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90"
                >
                  <a href={mailtoHref(selected)}>
                    <Reply className="h-3.5 w-3.5" />
                    Responder por email
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
