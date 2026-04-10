"use client";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import type { SiteContent } from "@/lib/api-client";

const FALLBACK_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5f47c83f9_heronovo.png";

interface Props {
  content: SiteContent | null;
}

export default function HeroSection({ content }: Props) {
  const bg = content?.image_url || FALLBACK_IMAGE;
  const subtitle = content?.subtitle || "Naturaleza, tranquilidad y el Río Uruguay en Villa Paranacito";

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Fondo */}
      <Image
        src={bg}
        alt="Josthom Eco Resort"
        fill
        priority
        className="object-cover scale-105"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/45" />

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto space-y-6"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight drop-shadow-lg">
          JOSTHOM
        </h1>
        <p className="text-lg md:text-xl text-white/85 leading-relaxed max-w-xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/accommodations" className="btn-primary text-base px-8 py-3">
            Reservar ahora
          </Link>
          <Link
            href="#about"
            className="inline-flex items-center justify-center px-8 py-3 border-2 border-white/70 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
          >
            Conocer más
          </Link>
        </div>
      </motion.div>

      {/* Chevron animado */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
      >
        <ChevronDown size={32} />
      </motion.div>
    </section>
  );
}
