"use client";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import type { SiteContent } from "@/lib/api-client";

const FALLBACK_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5f47c83f9_heronovo.png";
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png";

interface Props {
  content: SiteContent | null;
}

export default function HeroSection({ content }: Props) {
  const bg = content?.image_url || FALLBACK_IMAGE;
  const subtitle = content?.subtitle || "Descanso, naturaleza y río en un entorno de tranquilidad absoluta";

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo */}
      <Image
        src={bg}
        alt="Josthom Eco Resort"
        fill
        priority
        className="object-cover scale-[1.03]"
        sizes="100vw"
      />
      {/* Overlay oscuro suave */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50" />

      {/* Contenido centrado */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 text-center text-white px-4 max-w-2xl mx-auto space-y-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex justify-center mb-2"
        >
          <Image
            src={LOGO_URL}
            alt="Josthom Eco Resort"
            width={220}
            height={80}
            className="h-20 w-auto object-contain brightness-0 invert drop-shadow-lg"
            priority
          />
        </motion.div>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-white/90 leading-relaxed font-light tracking-wide"
        >
          {subtitle}
        </motion.p>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
        >
          <Link
            href="/accommodations"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-all duration-200 text-sm shadow-lg"
          >
            Reservar ahora
          </Link>
          <Link
            href="#about"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold border-2 border-white/70 text-white hover:bg-white/10 transition-all duration-200 text-sm backdrop-blur-sm"
          >
            Conocer más
          </Link>
        </motion.div>
      </motion.div>

      {/* Chevron animado */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
      >
        <ChevronDown size={30} />
      </motion.div>
    </section>
  );
}
