import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sun, Wind } from 'lucide-react';

export default function AboutSection({ content }) {
  const features = [
    { icon: Leaf, title: "Naturaleza pura", desc: "Entorno natural y agreste" },
    { icon: Sun, title: "Tranquilidad", desc: "Desconexión total del ruido urbano" },
    { icon: Wind, title: "Río Uruguay", desc: "A 10 minutos en lancha" }
  ];

  return (
    <section className="py-24 md:py-32 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden">
              <img
                src={content?.image_url || "https://rsqsoyrmqbnxqqxsauxk.supabase.co/storage/v1/object/public/Fotos%20josthom/fotosjosthomcabanas/b319622e-a9f1-4b85-b4d8-2cdddcc18354.JPG"}
                alt="Campo Josthom"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-amber-100 rounded-2xl -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-amber-700 tracking-[0.2em] uppercase text-sm mb-4 font-medium">
              Nuestra Esencia
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-stone-800 mb-6 leading-tight">
              {content?.title || "Un refugio donde el tiempo se detiene"}
            </h2>
            <p className="text-lg text-stone-600 leading-relaxed mb-8">
              {content?.content || "Josthom Eco Resort se encuentra en un entorno natural y agreste, ideal para el descanso y la desconexión. Estamos ubicados a 12 km de la Ruta Provincial 46 y a 22 km del centro comercial de Villa Paranacito. Desde las cabañas se aprecia el Arroyo Sagastume, que bordea todo el predio, y nos encontramos a tan solo 10 minutos en lancha del Río Uruguay."}
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-800 mb-1">{feature.title}</h3>
                    <p className="text-stone-500 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}