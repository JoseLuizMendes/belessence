"use client";

/**
 * ContactForm — usado em /contato
 * Envia para POST /api/contact (persiste em ContactMessage)
 */

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

export function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao enviar mensagem");
      }

      toast.success("Mensagem enviada! Responderemos em breve.");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar mensagem",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
          >
            Nome
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            placeholder="Seu nome"
            className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
          >
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="voce@exemplo.com"
            className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
        >
          Assunto
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          placeholder="Sobre o que gostaria de falar?"
          className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
        >
          Mensagem
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          placeholder="Conte com calma. Responderemos pessoalmente."
          className="w-full px-4 py-3 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Enviar mensagem
          </>
        )}
      </Button>
    </form>
  );
}
