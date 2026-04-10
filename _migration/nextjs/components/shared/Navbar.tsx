"use client";
/**
 * Navbar — migrada desde src/components/shared/Navbar.jsx
 * Transparente en hero, blanca al hacer scroll.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png";

const NAV_LINKS = [
  { href: "/accommodations", label: "Alojamientos" },
  { href: "/gallery",        label: "Galería" },
  { href: "/experience",     label: "Experiencias" },
  { href: "/location",       label: "Ubicación" },
  { href: "/contact",        label: "Contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = isHome && !scrolled && !menuOpen;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        transparent ? "bg-transparent" : "bg-white shadow-sm"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={LOGO_URL}
            alt="Josthom Eco Resort"
            width={140}
            height={48}
            className={`h-10 w-auto object-contain transition-all duration-300 ${
              transparent ? "brightness-0 invert" : "brightness-100"
            }`}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-green-700 ${
                  transparent ? "text-white/90" : "text-gray-700"
                } ${pathname === link.href ? "text-green-700 font-semibold" : ""}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/accommodations"
          className="hidden lg:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-green-800 text-white hover:bg-green-900 transition-colors"
        >
          Reservar
        </Link>

        {/* Mobile hamburger */}
        <button
          className={`lg:hidden p-2 rounded-md ${transparent ? "text-white" : "text-gray-700"}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menú"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 animate-slide-up">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-green-700"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/accommodations"
            onClick={() => setMenuOpen(false)}
            className="block text-center py-2 px-4 rounded-lg bg-green-800 text-white text-sm font-medium"
          >
            Reservar ahora
          </Link>
        </div>
      )}
    </header>
  );
}
