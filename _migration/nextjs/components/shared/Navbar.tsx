"use client";
/**
 * Navbar — transparente en hero, blanca al hacer scroll.
 * Estilo: base44 — logo izquierda, links centro, botón "Reservar" naranja derecha.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png";

const NAV_LINKS = [
  { href: "/",              label: "Inicio" },
  { href: "/accommodations",label: "Alojamientos" },
  { href: "/gallery",       label: "Galería" },
  { href: "/experience",    label: "La Experiencia" },
  { href: "/location",      label: "Ubicación" },
  { href: "/contact",       label: "Contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = isHome && !scrolled && !menuOpen;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        transparent
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src={LOGO_URL}
            alt="Josthom Eco Resort"
            width={140}
            height={48}
            className={`h-9 w-auto object-contain transition-all duration-300 ${
              transparent ? "brightness-0 invert" : "brightness-100"
            }`}
            priority
          />
        </Link>

        {/* Desktop nav — centrado */}
        <ul className="hidden lg:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    transparent
                      ? "text-white/90 hover:text-white"
                      : isActive
                        ? "text-brand-600"
                        : "text-gray-700 hover:text-brand-600"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA Desktop */}
        <Link
          href="/accommodations"
          className="hidden lg:inline-flex items-center px-5 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-200 shadow-sm"
        >
          Reservar
        </Link>

        {/* Hamburger Mobile */}
        <button
          className={`lg:hidden p-2 rounded-md transition-colors ${
            transparent ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menú"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-5 space-y-1 shadow-lg animate-slide-up">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-brand-600 bg-brand-50"
                  : "text-gray-700 hover:text-brand-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/accommodations"
              onClick={() => setMenuOpen(false)}
              className="block text-center py-2.5 px-4 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              Reservar ahora
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
