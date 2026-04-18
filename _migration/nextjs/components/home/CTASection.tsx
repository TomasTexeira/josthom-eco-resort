"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const BG = "https://rsqsoyrmqbnxqqxsauxk.supabase.co/storage/v1/object/public/Fotos%20josthom/fotosjosthomcabanas/a4955305-7459-405e-9cbb-d7b1ba61725e.JPG";

export default function CTASection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <Image
        src={BG}
        alt="Escapada al campo"
        fill
        className="object-cover"
        sizes="100vw"
      />
      {/* Overlay oscuro (sin tinte naranja, como en el base44) */}
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 section-container text-center text-white space-y-6"
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
          Tu escape al campo te espera
        </h2>
        <p className="text-white/75 text-lg max-w-xl mx-auto font-light">
          Reservá ahora y viví la experiencia Josthom. Naturaleza, tranquilidad y
          campo como nunca lo viviste.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/accommodations"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-200 text-sm shadow-lg"
          >
            Reservar ahora
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold border-2 border-white/60 text-white hover:bg-white/10 transition-colors duration-200 text-sm"
          >
            Contactarnos
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
