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
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80"
          alt="Paisaje Josthom"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-4xl mx-auto text-center px-6"
      >
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6">
          Tu escape al campo te espera
        </h2>
        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
          Reserva ahora y vive la experiencia Josthom. Naturaleza, tranquilidad y la mejor carne de pastoreo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("Accommodations")}>
            <Button 
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white px-12 py-6 text-lg"
            >
              Reservar ahora
            </Button>
          </Link>
          <Link to={createPageUrl("Contact")}>
            <Button 
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10 px-12 py-6 text-lg"
            >
              Contactarnos
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}