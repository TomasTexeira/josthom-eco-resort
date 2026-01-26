import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ExperiencePreview({ content }) {
  const experiences = [
  {
    image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80",
    title: "Animales libres",
    desc: "Caballos en el campo"
  },
  {
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=80",
    title: "Vida de campo",
    desc: "Vacas y naturaleza"
  },
  {
    
    title: "Atardeceres únicos",
    desc: "Horizontes infinitos"
  }];


  return (
    <section className="py-24 md:py-32 bg-stone-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}>

            <p className="text-amber-400 tracking-[0.2em] uppercase text-sm mb-4 font-medium">
              La Experiencia
            </p>
            <h2 className="mb-6 text-4xl font-normal leading-tight md:text-5xl">Vivir el campo como debe ser

            </h2>
            <p className="text-stone-400 text-lg leading-relaxed mb-8">
              En Josthom creemos que la mejor experiencia es la más simple: despertarte con el canto de los pájaros, 
              caminar entre los animales, disfrutar de un asado, 
              y terminar el día contemplando las estrellas en silencio absoluto.
            </p>
            <Link to={createPageUrl("Experience")}>
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white">

                Descubrir la experiencia
              </Button>
            </Link>
          </motion.div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 gap-4">
            {experiences.map((exp, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl overflow-hidden ${index === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}>

                {exp.image?.endsWith('.mp4') ? (
                  <video
                    src={content?.image_url}
                    alt={exp.title}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-medium">{exp.title}</h3>
                  <p className="text-white/70 text-sm">{exp.desc}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>);

}