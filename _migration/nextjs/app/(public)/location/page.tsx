import type { Metadata } from "next";
import { MapPin, Car, Phone } from "lucide-react";
import { contentApi } from "@/lib/api-client";

export const revalidate = 86400;
export const metadata: Metadata = { title: "Cómo llegar", description: "Ubicación y cómo llegar a Josthom Eco Resort en Villa Paranacito, Entre Ríos." };

const TIPS = [
  { icon: "🚗", title: "Desde Buenos Aires", desc: "163 km por Ruta 12. Aproximadamente 2 horas. Ideal salir temprano para disfrutar el día." },
  { icon: "🌧️", title: "Camino con lluvia", desc: "Los últimos kilómetros son camino de tierra. Con lluvia intensa recomendamos vehículo 4x4 o tracción doble." },
  { icon: "🐕", title: "Pet-friendly", desc: "Viajás con mascotas. Consultar disponibilidad al reservar." },
  { icon: "🛒", title: "Provisiones", desc: "Supermercado en Villa Paranacito a 5 km. Recomendamos traer lo básico para los primeros días." },
];

export default async function LocationPage() {
  const content = await contentApi.get("location").catch(() => null);

  return (
    <>
      {/* Header */}
      <section className="bg-amber-800 pt-20 pb-12 text-center text-white px-4">
        <h1 className="text-4xl font-bold">{content?.title || "¿Cómo llegar?"}</h1>
        <p className="mt-2 text-white/80">Villa Paranacito, Entre Ríos, Argentina</p>
      </section>

      <div className="section-container py-12 grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Mapa */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MapPin size={20} className="text-amber-700" /> Ubicación
          </h2>
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-80">
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

        {/* Info */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Car size={20} className="text-amber-700" /> Cómo llegar
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {content?.content || "Seguí la Ruta Nacional 12 hasta Villa Paranacito. Al llegar al pueblo, tomá el camino costero hacia el Arroyo Sagastume. El complejo está señalizado."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIPS.map((tip) => (
              <div key={tip.title} className="bg-amber-50 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2">
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
