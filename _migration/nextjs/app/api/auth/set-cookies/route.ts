/**
 * API Route para guardar tokens en cookies httpOnly desde el cliente.
 * El login page llama a este endpoint después de autenticarse.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json();

  const cookieStore = await cookies();

  cookieStore.set("josthom_access", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60,          // 1 hora
    path: "/",
  });

  cookieStore.set("josthom_refresh", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("josthom_access");
  cookieStore.delete("josthom_refresh");
  return NextResponse.json({ ok: true });
}
