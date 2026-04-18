import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MapPin, Phone } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png";

const LINKS = [
  { href: "/accommodations", label: "Alojamientos" },
  { href: "/gallery",        label: "Galería" },
  { href: "/experience",     label: "La Experiencia" },
  { href: "/location",       label: "Ubicación" },
  { href: "/contact",        label: "Contacto" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-charcoal-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src={LOGO_URL}
              alt="Josthom Eco Resort"
              width={160}
              height={64}
              className="h-14 w-auto object-contain brightness-0 invert mb-5"
            />
            <p className="text-gray-400 max-w-sm leading-relaxed text-sm mb-6">
              Eco-resort de campo donde la naturaleza, la tranquilidad y los animales
              se unen para crear una experiencia única.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/josthom_ok/?hl=es"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-600 transition-colors duration-200"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100069739778814"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-600 transition-colors duration-200"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-5">
              Enlaces
            </h4>
            <ul className="space-y-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-gray-400 text-sm hover:text-white transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-5">
              Contacto
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-500" />
                <span>Arroyo Sagastume S/N, 2823<br />Villa Paranacito, Entre Ríos</span>
              </li>
              <li>
                <a
                  href="https://wa.me/5491138323695"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-400 text-sm hover:text-white transition-colors duration-200"
                >
                  <Phone className="w-4 h-4 flex-shrink-0 text-brand-500" />
                  <span>+54 9 11 3832-3695</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>© {year} Josthom Eco Resort · Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
