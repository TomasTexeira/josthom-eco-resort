"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf, Wind, Waves } from "lucide-react";
import type { SiteContent } from "@/lib/api-client";

const FEATURES = [
  { icon: Leaf,  label: "Naturaleza",    desc: "Rodeado de flora y fauna nativa del litoral argentino." },
  { icon: Wind,  label: "Tranquilidad",  desc: "Sin ruidos de ciudad. Solo el río, los pájaros y el viento." },
  { icon: Waves, label: "Río Uruguay",   desc: "A orillas del Arroyo Sagastume, a minutos del Río Uruguay." },
];

const FALLBACK_IMAGE = "https://rsqsoyrmqbnxqqxsauxk.supabase.co/storage/v1/object/public/Fotos%20josthom/fotosjosthomcabanas/b319622e-a9f1-4b85-b4d8-2cdddcc18354.JPG";

interface Props { content: SiteContent | null; }

export default function AboutSection({ content }: Props) {
  return (
    <section id="about" className="section-container py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Imagen */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative h-96 rounded-2xl overflow-hidden shadow-xl"
        >
          <Image
            src={content?.image_url || FALLBACK_IMAGE}
            alt="Sobre Josthom"
            fill
            className="object-cover"
          />
          {/* Decoración geométrica */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-100 rounded-2xl -z-10" />
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            <p className="text-amber-700 text-sm font-semibold uppercase tracking-widest mb-2">Sobre nosotros</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {content?.title || "Un rincón único en Entre Ríos"}
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-lg">
            {content?.content || "Josthom Eco Resort es un complejo de 6 cabañas a orillas del Arroyo Sagastume, en Villa Paranacito. Un lugar para desconectarse y reconectarse con la naturaleza, la familia y uno mismo."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="space-y-1">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Icon size={20} className="text-amber-700" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
