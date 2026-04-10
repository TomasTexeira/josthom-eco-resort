/**
 * Layout del panel de administración.
 * Sidebar con las 6 secciones del admin original.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("josthom_access");
  if (!token) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
