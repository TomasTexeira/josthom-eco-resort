import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Car, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SEO from '@/components/shared/SEO';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Location() {
  // Default coordinates (can be updated from SiteContent entity)
  const coordinates = [-34.6037, -58.3816]; // Buenos Aires area - replace with actual

  const directions = [
    {
      icon: MapPin,
      title: "Desde Buenos Aires (163 km)",
      description: "Tomar Panamericana hasta Campana, luego Ruta 9 hacia Zárate. Continuar por Ruta 12 hasta Villa Paranacito. Desde allí, tomar Ruta Provincial 46 y a 12 km encontrarás el acceso a Josthom."
    },
    {
      icon: Car,
      title: "Acceso al complejo",
      description: "En días de lluvias intensas, el acceso puede ser únicamente en vehículos 4x4. Te recomendamos consultar las condiciones del camino antes de viajar."
    },
    {
      icon: MessageCircle,
      title: "¿Necesitás ayuda?",
      description: "Si tenés dudas sobre cómo llegar, escribinos por WhatsApp y te guiamos paso a paso."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Ubicación"
        description="Cómo llegar a Josthom Eco Resort. A 163 km de Buenos Aires, 22 km de Villa Paranacito, Entre Ríos. Sobre el Arroyo Sagastume, a 10 minutos del Río Uruguay. Indicaciones y mapa."
        keywords="ubicacion josthom, como llegar villa paranacito, mapa entre rios, ruta al rio uruguay, arroyo sagastume"
        url="/location"
      />
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80"
            alt="Ubicación"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-6"
        >
          <p className="text-amber-200 tracking-[0.3em] uppercase text-sm mb-4">
            Dónde Estamos
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-4">
            Ubicación
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            A 163 km de Buenos Aires, en un entorno natural y agreste
          </p>
        </motion.div>
      </section>

      {/* Map Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden shadow-lg h-[400px] lg:h-[500px]"
            >
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3320.2194004029134!2d-58.61643122355344!3d-33.67738270917114!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bad9211ecd62b3%3A0x2446c1b49fe9b34c!2sJosthom!5e0!3m2!1ses-419!2sar!4v1769440763073!5m2!1ses-419!2sar" 
                width="100%" 
                height="100%" 
                style={{border: 0}} 
                allowFullScreen={true}
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-start gap-4 mb-8 p-6 bg-amber-50 rounded-2xl">
                <MapPin className="w-6 h-6 text-amber-700 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-800 mb-2">Dirección</h3>
                  <p className="text-stone-600">
                    A 12 km de Ruta Provincial 46<br />
                    A 22 km de Villa Paranacito, Entre Ríos<br />
                    A 163 km de Panamericana y General Paz
                  </p>
                  <p className="text-stone-600 mt-3 font-medium">
                    A 10 minutos en lancha del Río Uruguay
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-light text-stone-800 mb-6">
                Cómo llegar
              </h2>

              <div className="space-y-6">
                {directions.map((dir, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <dir.icon className="w-5 h-5 text-stone-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-800 mb-1">{dir.title}</h3>
                      <p className="text-stone-600 text-sm leading-relaxed">{dir.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-stone-200">
                <p className="text-stone-600 mb-4">¿Necesitás ayuda para llegar?</p>
                <a href="https://wa.me/541138323695">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 md:py-20 bg-stone-50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-light text-stone-800 mb-4">
              Información importante
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Arroyo Sagastume", desc: "El Arroyo Sagastume bordea el predio y se puede apreciar desde las cabañas. Ideal para disfrutar de la naturaleza y el paisaje fluvial." },
              { title: "Río Uruguay", desc: "A solo 10 minutos en lancha del Río Uruguay. Punto estratégico para quienes disfrutan del río y la vida al aire libre." },
              { title: "Villa Paranacito", desc: "A 22 km encontrarás el centro comercial con supermercados, farmacia y todos los servicios que puedas necesitar." },
              { title: "Pet Friendly", desc: "Somos pet friendly. Tu mascota es bienvenida para disfrutar junto a vos de la naturaleza y el descanso." },
            ].map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl"
              >
                <h3 className="font-medium text-stone-800 mb-2">{tip.title}</h3>
                <p className="text-stone-600 text-sm">{tip.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}