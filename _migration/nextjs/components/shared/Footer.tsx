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
    <footer className="bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand — spans 2 cols on large screens */}
          <div className="lg:col-span-2">
            <Image
              src={LOGO_URL}
              alt="Josthom Eco Resort"
              width={160}
              height={64}
              className="h-16 w-auto object-contain brightness-0 invert mb-4"
            />
            <p className="text-stone-400 max-w-md leading-relaxed mb-6">
              Eco-resort de campo donde la naturaleza, la tranquilidad y los animales se unen
              para crear una experiencia única.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/josthom_ok/?hl=es"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-700 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100069739778814"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium mb-6 text-amber-400">Enlaces</h4>
            <ul className="space-y-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-stone-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-medium mb-6 text-amber-400">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-stone-400">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Arroyo Sagastume S/N, 2823 Villa Paranacito, Entre Ríos</span>
              </li>
              <li>
                <a
                  href="https://wa.me/5491138323695"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-stone-400 hover:text-white transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>+54 9 11 3832-3695</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-stone-500 text-sm">
          <p>© {year} Josthom Eco-Resort. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
