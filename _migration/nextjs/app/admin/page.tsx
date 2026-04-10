/**
 * Admin — Gestión de reservas (tab principal)
 * Migrado desde src/components/admin/BookingsManager.jsx
 */
import BookingsManager from "./BookingsManager";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("josthom_access")?.value || "";
  return <BookingsManager token={token} />;
}
