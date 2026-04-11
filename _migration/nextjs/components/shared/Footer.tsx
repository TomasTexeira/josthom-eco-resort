import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MapPin, Phone } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png";

const LINKS = [
  { href: "/accommodations", label: "Alojamientos" },
  { href: "/gallery",        label: "Galería" },
  { href: "/experience",     label: "Experiencias" },
  { href: "/location",       label: "Ubicación" },
  { href: "/contact",        label: "Contacto" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div className="space-y-3">
          <Image
            src={LOGO_URL}
            alt="Josthom Eco Resort"
            width={130}
            height={44}
            className="h-10 w-auto object-contain brightness-0 invert opacity-90"
          />
          <p className="text-sm leading-relaxed text-gray-400">
            Eco Resort en Villa Paranacito, Entre Ríos. Naturaleza, tranquilidad y el Río Uruguay.
          </p>
          <div className="flex gap-3 pt-1">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
              <Facebook size={18} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Navegación</h3>
          <ul className="space-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Contacto</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <span>Villa Paranacito, Entre Ríos, Argentina</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-amber-500" />
              <a href="https://wa.me/5491138323695" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                +54 9 11 3832-3695
              </a>
            </li>
          </ul>
        </div>

        {/* Horarios */}
        <div>
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Horarios</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>Atención: Lunes a Domingo</li>
            <li>8:00 hs — 18:00 hs</li>
            <li className="mt-3 pt-3 border-t border-gray-700">Check-in: 14:00 hs</li>
            <li>Check-out: 18:00 hs</li>
          </ul>
        </div>

      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {year} Josthom Eco Resort. Todos los derechos reservados.
      </div>
    </footer>
  );
}
