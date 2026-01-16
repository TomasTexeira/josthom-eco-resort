import React from 'react';
import { motion } from 'framer-motion';
import { Waves, TreePine, CircleDot, Bird, Palmtree, Wifi } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Experience() {
  const experiences = [
    {
      icon: Waves,
      title: "Río Uruguay",
      description: "A solo 10 minutos en lancha del Río Uruguay, tenés acceso directo a uno de los ríos más hermosos de la región. Cada cabaña cuenta con muelle propio para amarrar tu embarcación. Navegá, pescá o simplemente disfrutá del paisaje fluvial."
    },
    {
      icon: TreePine,
      title: "Arroyo Sagastume",
      description: "El Arroyo Sagastume bordea todo nuestro predio y se aprecia desde las cabañas. Con 200 metros de costa, sus aguas tranquilas y la vegetación de ribera crean un ambiente de paz absoluta. Ideal para la pesca desde la costa."
    },
    {
      icon: CircleDot,
      title: "Instalaciones Deportivas",
      description: "Contamos con cancha de fútbol, cancha de beach vóley y gimnasio totalmente equipado con vista a la laguna interna. Mantenete activo mientras disfrutás del entorno natural."
    },
    {
      icon: Bird,
      title: "Fauna del Predio",
      description: "Nuestro amplio campo rural alberga vacas, caballos, ñandú, pavos reales, gallinas y conejos. El predio cuenta con sector de granja y espacios abiertos donde la naturaleza se vive de cerca."
    },
    {
      icon: Palmtree,
      title: "Piscinas e Hidromasaje",
      description: "Disfrutá del uso libre de nuestras piscinas y el hidromasaje con vista a la laguna interna. El lugar perfecto para relajarte después de un día al aire libre. (Horario: 8 a 20 hs)"
    },
    {
      icon: Wifi,
      title: "Conectividad Starlink",
      description: "Mantenete conectado con Wifi de alta calidad mediante tecnología Starlink en todas las cabañas y espacios comunes. Equilibrio perfecto entre naturaleza y conectividad."
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
              Arroyo Sagastume y a solo 10 minutos en lancha del Río Uruguay.
            </p>
            <p className="text-lg text-stone-600 leading-relaxed">
              Nuestro complejo cuenta con 6 cabañas iguales, todas con muelle propio y equipadas 
              para tu máximo confort. Ofrecemos instalaciones deportivas, gimnasio, kayaks, bote 
              lagunero, y un entorno único donde conviven animales de granja en un predio de campo 
              auténtico con 200 metros de costa sobre el arroyo.
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