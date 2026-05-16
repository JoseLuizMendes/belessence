/**
 * /api/newsletter — POST
 * ─────────────────────────────────────────────────────────────────────
 * Inscreve um email na lista de newsletter (persiste em NewsletterSubscriber).
 *
 * Body: { email: string }
 * Idempotente: se o email já existe, retorna 200 com `alreadySubscribed: true`.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Verifica se já existe
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      // Se inativo, reativa
      if (!existing.active) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { active: true },
        });
      }
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "Você já está inscrita na nossa newsletter!",
      });
    }

    await prisma.newsletterSubscriber.create({
      data: { email },
    });

    return NextResponse.json({
      success: true,
      alreadySubscribed: false,
      message: "Inscrição confirmada! Você receberá nossas novidades em breve.",
    });
  } catch (error) {
    console.error("[/api/newsletter] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar inscrição" },
      { status: 500 },
    );
  }
}
