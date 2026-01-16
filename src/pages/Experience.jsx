import React from 'react';
import { motion } from 'framer-motion';
import { Waves, TreePine, Sunrise, Bird, Palmtree, Moon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Experience() {
  const experiences = [
    {
      icon: Waves,
      title: "Río Uruguay",
      description: "A solo 10 minutos en lancha del Río Uruguay, tenés acceso directo a uno de los ríos más hermosos de la región. Navegá, pescá o simplemente disfrutá del paisaje fluvial."
    },
    {
      icon: TreePine,
      title: "Arroyo Sagastume",
      description: "El Arroyo Sagastume bordea nuestro predio y se puede apreciar desde las cabañas. Sus aguas tranquilas y la vegetación de ribera crean un ambiente de paz absoluta."
    },
    {
      icon: Sunrise,
      title: "Atardeceres Infinitos",
      description: "Sin edificios ni luces artificiales, cada atardecer es un espectáculo único. Los colores del cielo se extienden hasta donde alcanza la vista, pintando el agua de tonos naranjas, rosas y dorados."
    },
    {
      icon: Bird,
      title: "Fauna Silvestre",
      description: "Carpinchos, liebres y cientos de especies de aves habitan la zona. Aquí la vida silvestre convive en armonía con el entorno, creando un ecosistema único."
    },
    {
      icon: Palmtree,
      title: "Piscinas e Hidromasaje",
      description: "Disfrutá del uso libre de nuestras piscinas y el hidromasaje con vista a la laguna interna. El lugar perfecto para relajarte después de un día al aire libre."
    },
    {
      icon: Moon,
      title: "Noches Estrelladas",
      description: "Lejos de la contaminación lumínica, nuestros cielos nocturnos revelan miles de estrellas. Ideal para quienes buscan reconectarse con el universo y la inmensidad del cosmos."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1920&q=80"
            alt="La Experiencia Josthom"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-6 max-w-4xl"
        >
          <p className="text-amber-200 tracking-[0.3em] uppercase text-sm mb-4">
            Nuestra Esencia
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6">
            La Experiencia Josthom
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Más que un lugar para hospedarse, Josthom es una invitación a descansar 
            en contacto con la naturaleza, el río y la tranquilidad absoluta
          </p>
        </motion.div>
      </section>

      {/* Philosophy */}
      <section className="py-20 md:py-28 bg-stone-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-stone-800 mb-8">
              Nuestra Filosofía
            </h2>
            <p className="text-lg text-stone-600 leading-relaxed mb-6">
              En Josthom creemos que el verdadero descanso está en la desconexión. Encontrarás 
              un entorno natural y agreste donde el tiempo parece detenerse, rodeado por el 
              Arroyo Sagastume y a minutos del Río Uruguay.
            </p>
            <p className="text-lg text-stone-600 leading-relaxed">
              Nuestro complejo se destaca por su tranquilidad y su contacto directo con la naturaleza. 
              Cada experiencia que ofrecemos está diseñada para celebrar el descanso, la paz 
              y la reconexión con lo esencial.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-amber-700 tracking-[0.2em] uppercase text-sm mb-4 font-medium">
              Qué Vas a Vivir
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-stone-800">
              Momentos que no olvidarás
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-stone-50 rounded-2xl p-8 hover:bg-stone-100 transition-colors duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                  <exp.icon className="w-7 h-7 text-amber-700" />
                </div>
                <h3 className="text-xl font-medium text-stone-800 mb-4">
                  {exp.title}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {exp.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-2xl md:text-3xl font-light leading-relaxed mb-8 italic">
              "La naturaleza no se explica, se vive. Y cuando la vivís, te cambia para siempre."
            </p>
            <p className="text-amber-400 tracking-wide">— Josthom Eco Resort</p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-stone-800 mb-6">
              ¿Listo para vivir la experiencia?
            </h2>
            <p className="text-lg text-stone-600 mb-10">
              Reserva tu estadía y dejá que el campo te transforme
            </p>
            <Link to={createPageUrl("Accommodations")}>
              <Button 
                size="lg"
                className="bg-amber-700 hover:bg-amber-800 text-white px-12 py-6 text-lg"
              >
                Ver alojamientos
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}