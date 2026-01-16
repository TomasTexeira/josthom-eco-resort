import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ExperiencePreview() {
  const experiences = [
    {
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
      title: "Río Uruguay",
      desc: "A 10 minutos en lancha"
    },
    {
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
      title: "Arroyo Sagastume",
      desc: "Vista desde las cabañas"
    },
    {
      image: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80",
      title: "Descanso total",
      desc: "Tranquilidad absoluta"
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-stone-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-amber-400 tracking-[0.2em] uppercase text-sm mb-4 font-medium">
              La Experiencia
            </p>
            <h2 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
              Vivir el campo como debe ser
            </h2>
            <p className="text-stone-400 text-lg leading-relaxed mb-8">
              En Josthom creemos que el verdadero descanso está en la naturaleza: despertarte con el canto de los pájaros, 
              contemplar el Arroyo Sagastume desde tu deck, navegar por el Río Uruguay, 
              y terminar el día disfrutando de la piscina y el hidromasaje en silencio absoluto.
            </p>
            <Link to={createPageUrl("Experience")}>
              <Button 
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Descubrir la experiencia
              </Button>
            </Link>
          </motion.div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 gap-4">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl overflow-hidden ${index === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}
              >
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-medium">{exp.title}</h3>
                  <p className="text-white/70 text-sm">{exp.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}