"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf, Sun, Wind } from "lucide-react";
import type { SiteContent } from "@/lib/api-client";

const FEATURES = [
  {
    icon: Leaf,
    label: "Naturaleza pura",
    desc:  "Entorno natural y agreste del litoral entrerriano.",
  },
  {
    icon: Sun,
    label: "Tranquilidad",
    desc:  "Desconexión total del ruido urbano.",
  },
  {
    icon: Wind,
    label: "Río Uruguay",
    desc:  "A 10 minutos en lancha.",
  },
];

const FALLBACK_IMAGE = "https://rsqsoyrmqbnxqqxsauxk.supabase.co/storage/v1/object/public/Fotos%20josthom/fotosjosthomcabanas/b319622e-a9f1-4b85-b4d8-2cdddcc18354.JPG";

interface Props { content: SiteContent | null; }

export default function AboutSection({ content }: Props) {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Imagen */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="relative h-[480px] rounded-2xl overflow-hidden shadow-xl"
          >
            <Image
              src={content?.image_url || FALLBACK_IMAGE}
              alt="Josthom Eco Resort — naturaleza"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Gradiente sutil en el borde derecho para blend con el texto */}
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/20 to-transparent" />
          </motion.div>

          {/* Texto */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-7"
          >
            <div>
              <p className="section-label">Nuestra esencia</p>
              <h2 className="section-title">
                {content?.title || "Un refugio donde el tiempo se detiene"}
              </h2>
            </div>

            <p className="text-gray-600 leading-relaxed text-base">
              {content?.content ||
                "Josthom Eco Resort se encuentra en un entorno natural y agreste, ideal para el descanso y la desconexión. Estamos ubicados a 12 km de la Ruta Provincial 46 y a 22 km del centro comercial de Villa Paranacito. Desde las cabañas se aprecia el Arroyo Sagastume, que bordea todo el predio, y nos encontramos a tan solo 10 minutos en lancha del Río Uruguay."}
            </p>

            {/* Features */}
            <div className="space-y-5 pt-1">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{label}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
