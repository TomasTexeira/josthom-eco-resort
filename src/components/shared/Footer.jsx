import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png"
              alt="Josthom Eco Resort"
              className="h-24 object-contain brightness-0 invert mb-4"
            />
            <p className="text-stone-400 max-w-md leading-relaxed mb-6">
              Eco-resort de campo donde la naturaleza, la tranquilidad y la mejor carne de pastoreo 
              se unen para crear una experiencia única.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-700 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-700 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium mb-6 text-amber-400">Enlaces</h4>
            <ul className="space-y-3">
              {[
                { name: 'Alojamientos', page: 'Accommodations' },
                { name: 'Galería', page: 'Gallery' },
                { name: 'La Experiencia', page: 'Experience' },
                { name: 'Ubicación', page: 'Location' },
                { name: 'Contacto', page: 'Contact' },
              ].map((link) => (
                <li key={link.page}>
                  <Link 
                    to={createPageUrl(link.page)}
                    className="text-stone-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium mb-6 text-amber-400">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-stone-400">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Ruta Provincial, Buenos Aires, Argentina</span>
              </li>
              <li>
                <a href="tel:+5491112345678" className="flex items-center gap-3 text-stone-400 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                  <span>+54 9 11 1234-5678</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@josthom.com" className="flex items-center gap-3 text-stone-400 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                  <span>info@josthom.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-stone-500 text-sm">
          <p>© {new Date().getFullYear()} Josthom Eco-Resort. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}