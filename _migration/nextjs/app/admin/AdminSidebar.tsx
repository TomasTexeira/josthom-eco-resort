"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, List, BarChart2, Home, Image, FileText, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin",                  icon: List,         label: "Reservas" },
  { href: "/admin/calendar",         icon: CalendarDays, label: "Calendario" },
  { href: "/admin/balance",          icon: BarChart2,    label: "Balance" },
  { href: "/admin/accommodations",   icon: Home,         label: "Alojamientos" },
  { href: "/admin/gallery",          icon: Image,        label: "Galería" },
  { href: "/admin/content",          icon: FileText,     label: "Contenido" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/set-cookies", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col min-h-screen shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="font-bold text-green-800 text-sm tracking-wide">
          JOSTHOM
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">Panel Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-green-50 text-green-800"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
