import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import ContactForm from "./ContactForm";
import { contentApi } from "@/lib/api-client";

export const revalidate = 86400;
export const metadata: Metadata = { title: "Contacto", description: "Contactá a Josthom Eco Resort por WhatsApp o email." };

export default async function ContactPage() {
  const content = await contentApi.get("contact").catch(() => null);

  return (
    <>
      <section className="bg-amber-800 pt-20 pb-12 text-center text-white px-4">
        <h1 className="text-4xl font-bold">{content?.title || "Contacto"}</h1>
        <p className="mt-2 text-white/80">{content?.subtitle || "Estamos para ayudarte"}</p>
      </section>

      <div className="section-container py-14 grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Info de contacto */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Hablemos</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={20} className="text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">WhatsApp</p>
                  <a
                    href="https://wa.me/5491138323695"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline"
                  >
                    +54 9 11 3832-3695
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">Respuesta rápida durante el día</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={20} className="text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a href="mailto:reservas@josthom.com.ar" className="text-amber-700 hover:underline">
                    reservas@josthom.com.ar
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Dirección</p>
                  <p className="text-gray-600">Villa Paranacito, Entre Ríos</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={20} className="text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Horario de atención</p>
                  <p className="text-gray-600">Lunes a Domingo, 8:00 – 18:00 hs</p>
                  <p className="text-xs text-gray-400 mt-0.5">Check-in: 14:00 hs · Check-out: 18:00 hs</p>
                </div>
              </li>
            </ul>
          </div>

          {/* CTA WhatsApp */}
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
        <ContactForm />
      </div>
    </>
  );
}
