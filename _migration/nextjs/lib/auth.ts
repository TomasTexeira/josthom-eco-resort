/**
 * Utilidades de autenticación para Next.js App Router.
 * Guarda tokens en cookies httpOnly via Server Actions.
 */
import { cookies } from "next/headers";
import { authApi } from "./api-client";

const ACCESS_TOKEN_KEY = "josthom_access";
const REFRESH_TOKEN_KEY = "josthom_refresh";

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_KEY)?.value;
}

export async function getServerUser() {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await authApi.me(token);
  } catch {
    return null;
  }
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_KEY, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hora
    path: "/",
  });
  cookieStore.set(REFRESH_TOKEN_KEY, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
}
