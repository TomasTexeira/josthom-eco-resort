import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://rsqsoyrmqbnxqqxsauxk.supabase.co/storage/v1/object/public/Fotos%20josthom/fotosjosthomcabanas/a4955305-7459-405e-9cbb-d7b1ba61725e.JPG"
          alt="Paisaje Josthom"
          className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-stone-900/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-4xl mx-auto text-center px-6">

        <h2 className="text-white mb-6 text-4xl font-normal md:text-5xl lg:text-6xl">Tu escape al campo te espera

        </h2>
        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
          Reserva ahora y vive la experiencia Josthom. Naturaleza, tranquilidad y la mejor carne de pastoreo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("Accommodations")}>
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white px-12 py-6 text-lg">

              Reservar ahora
            </Button>
          </Link>
          <Link to={createPageUrl("Contact")}>
            <Button
              variant="outline"
              size="lg" className="bg-slate-50 text-slate-900 px-12 py-6 text-lg font-medium rounded-lg inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-10 border-white/40 hover:bg-white/10 hover:text-white">


              Contactarnos
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>);

}