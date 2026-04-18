import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import ContactForm from "./ContactForm";
import { contentApi } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Contacto",
  description: "Contactá a Josthom Eco Resort por WhatsApp o email.",
};

export default async function ContactPage() {
  const content = await contentApi.get("contact").catch(() => null);

  return (
    <>
      {/* Hero banner oscuro */}
      <section className="bg-charcoal-900 pt-24 pb-14 text-center text-white px-4">
        <p className="section-label text-brand-400">Contacto</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">
          {content?.title || "Hablemos"}
        </h1>
        <p className="mt-3 text-white/60 text-sm">
          {content?.subtitle || "Estamos para ayudarte"}
        </p>
      </section>

      <div className="section-container py-16 grid grid-cols-1 lg:grid-cols-2 gap-14">

        {/* Info de contacto */}
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Información de contacto</h2>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">WhatsApp</p>
                  <a
                    href="https://wa.me/5491138323695"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 text-sm hover:underline"
                  >
                    +54 9 11 3832-3695
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">Respuesta rápida durante el día</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Email</p>
                  <a href="mailto:reservas@josthom.com.ar" className="text-brand-600 hover:text-brand-700 text-sm hover:underline">
                    reservas@josthom.com.ar
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Dirección</p>
                  <p className="text-gray-500 text-sm">Villa Paranacito, Entre Ríos</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Horario de atención</p>
                  <p className="text-gray-500 text-sm">Lunes a Domingo, 8:00 – 18:00 hs</p>
                  <p className="text-xs text-gray-400 mt-0.5">Check-in: 15:00 hs · Check-out: 11:00 hs</p>
                </div>
              </li>
            </ul>
          </div>

          <a
            href="https://wa.me/5491138323695?text=Hola!%20Quiero%20consultar%20sobre%20disponibilidad"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex gap-2"
          >
            <Phone size={16} /> Escribirnos por WhatsApp
          </a>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
