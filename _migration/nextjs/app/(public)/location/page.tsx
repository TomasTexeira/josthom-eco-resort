import type { Metadata } from "next";
import { MapPin, Car, Phone } from "lucide-react";
import { contentApi } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Cómo llegar",
  description: "Ubicación y cómo llegar a Josthom Eco Resort en Villa Paranacito, Entre Ríos.",
};

const TIPS = [
  { icon: "🚗", title: "Desde Buenos Aires",  desc: "163 km por Ruta 12. Aproximadamente 2 horas. Ideal salir temprano para disfrutar el día." },
  { icon: "🌧️", title: "Camino con lluvia",   desc: "Los últimos kilómetros son camino de tierra. Con lluvia intensa recomendamos vehículo 4x4 o tracción doble." },
  { icon: "🐕", title: "Pet-friendly",         desc: "Viajás con mascotas. Consultá disponibilidad al reservar." },
  { icon: "🛒", title: "Provisiones",          desc: "Supermercado en Villa Paranacito a 5 km. Recomendamos traer lo básico para los primeros días." },
];

export default async function LocationPage() {
  const content = await contentApi.get("location").catch(() => null);

  return (
    <>
      {/* Hero banner oscuro */}
      <section className="bg-charcoal-900 pt-24 pb-14 text-center text-white px-4">
        <p className="section-label text-brand-400">Ubicación</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">
          {content?.title || "¿Cómo llegar?"}
        </h1>
        <p className="mt-3 text-white/60 text-sm">Villa Paranacito, Entre Ríos, Argentina</p>
      </section>

      <div className="section-container py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Mapa */}
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin size={18} className="text-brand-600" /> Ubicación exacta
          </h2>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-80">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3354!2d-58.6897!3d-33.7283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDQzJzQyLjAiUyA1OMKwNDEnMjIuMiJX!5e0!3m2!1ses!2sar!4v1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Josthom Eco Resort"
            />
          </div>
          <a
            href="https://wa.me/5491138323695?text=Hola!%20Necesito%20ayuda%20con%20las%20indicaciones%20para%20llegar"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex gap-2"
          >
            <Phone size={16} /> Pedir indicaciones por WhatsApp
          </a>
        </div>

        {/* Instrucciones */}
        <div className="space-y-7">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Car size={18} className="text-brand-600" /> Cómo llegar
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              {content?.content ||
                "Seguí la Ruta Nacional 12 hasta Villa Paranacito. Al llegar al pueblo, tomá el camino costero hacia el Arroyo Sagastume. El complejo está señalizado."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIPS.map((tip) => (
              <div key={tip.title} className="bg-brand-50 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{tip.icon}</span>
                  <h3 className="font-semibold text-sm text-gray-900">{tip.title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
