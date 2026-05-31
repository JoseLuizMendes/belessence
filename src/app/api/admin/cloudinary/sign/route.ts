/**
 * POST /api/admin/cloudinary/sign
 * ─────────────────────────────────────────────────────────────────────
 * Gera assinatura para upload direto do browser para Cloudinary.
 *
 * Fluxo: <CldUploadWidget> chama este endpoint → recebe { signature, timestamp,
 * apiKey, cloudName } → envia o arquivo direto pro Cloudinary com esses
 * parâmetros. O bytes do arquivo NUNCA passa pelo nosso servidor.
 *
 * Auth: protegido pelo middleware (matcher `/api/admin/:path*`).
 * Por defesa em profundidade, conferimos o cookie aqui também.
 *
 * Env vars exigidas (`.env.local`):
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  — exposto no widget
 *   CLOUDINARY_API_KEY                 — exposto na assinatura, mas só no response
 *   CLOUDINARY_API_SECRET              — servidor only
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER  — pasta default (ex.: "belessence/products")
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth/presentation/admin-auth";

export async function POST(req: NextRequest) {
  // Defesa em profundidade — o middleware já protege, mas conferimos aqui.
  const cookieStore = await cookies();
  const isAuthed = await verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const defaultFolder =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER ?? "belessence/products";

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[cloudinary/sign] env vars ausentes");
    return NextResponse.json(
      { error: "Cloudinary não configurado no servidor" },
      { status: 500 },
    );
  }

  // O widget envia params que ele quer assinar (folder, public_id, etc.).
  // Aceitamos um subset seguro e ignoramos qualquer coisa que não esteja na lista.
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* body opcional */
  }

  // Apenas params que faz sentido o cliente controlar.
  const folder = typeof body.folder === "string" ? body.folder : defaultFolder;
  const source = typeof body.source === "string" ? body.source : undefined;
  const uploadPreset =
    typeof body.upload_preset === "string" ? body.upload_preset : undefined;

  const timestamp = Math.round(Date.now() / 1000);

  // `paramsToSign` precisa conter EXATAMENTE os campos que o widget enviará
  // (além de api_key e signature). O Cloudinary recalcula a assinatura no
  // servidor e bate com a nossa.
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
  };
  if (source) paramsToSign.source = source;
  if (uploadPreset) paramsToSign.upload_preset = uploadPreset;

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return NextResponse.json({
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  });
}
