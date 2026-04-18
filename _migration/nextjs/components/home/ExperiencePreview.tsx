"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const IMAGES = [
  {
    src: "https://rsqsoyrmqbnxqqxsauxk.supabase.co/storage/v1/object/public/Fotos%20josthom/fotosjosthomcabanas/a4955305-7459-405e-9cbb-d7b1ba61725e.JPG",
    alt: "Josthom paisaje",
    size: "large",
  },
  {
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80&fm=webp",
    alt: "Fauna nativa",
    size: "small",
  },
  {
    src: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&q=80&fm=webp",
    alt: "Atardecer",
    size: "small",
  },
];

const ITEMS = [
  "Pesca y deportes acuáticos",
  "Fauna y flora nativa del litoral",
  "Piscinas al aire libre",
  "WiFi Starlink en todas las cabañas",
];

export default function ExperiencePreview() {
  return (
    <section className="bg-charcoal-900 py-24">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Texto — izquierda */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="space-y-7 order-2 lg:order-1"
          >
            <div>
              <p className="section-label text-brand-500">La experiencia</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                Vivir el campo como debe ser
              </h2>
            </div>

            <p className="text-gray-400 leading-relaxed text-base">
              En Josthom creemos que la mejor experiencia es la más simple: despertarte con
              el canto de los pájaros, caminar entre los animales, disfrutar de un asado, y
              terminar el día contemplando las estrellas en silencio absoluto.
            </p>

            <ul className="space-y-3">
              {ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/experience"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-200 text-sm"
            >
              Descubrir la experiencia
            </Link>
          </motion.div>

          {/* Grid de imágenes — derecha */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="grid grid-cols-2 gap-3 order-1 lg:order-2 h-[420px]"
          >
            <div className="relative rounded-2xl overflow-hidden row-span-2">
              <Image
                src={IMAGES[0].src}
                alt={IMAGES[0].alt}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src={IMAGES[1].src}
                alt={IMAGES[1].alt}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src={IMAGES[2].src}
                alt={IMAGES[2].alt}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
