import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Car, Clock, Phone, Navigation } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
      icon: Car,
      title: "Desde Buenos Aires",
      description: "Tomá la Ruta 2 hacia Mar del Plata. A la altura del km 180, girá a la derecha por el camino de tierra señalizado. Josthom está a 5 km del desvío."
    },
    {
      icon: Clock,
      title: "Tiempo estimado",
      description: "Aproximadamente 2 horas y 30 minutos desde Capital Federal, dependiendo del tráfico."
    },
    {
      icon: Navigation,
      title: "GPS",
      description: "Podés usar Google Maps o Waze buscando 'Josthom Eco-Resort'. Te llevará directo a nuestra tranquera principal."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
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
            Un rincón de tranquilidad a solo horas de la ciudad
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
              <MapContainer
                center={coordinates}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coordinates}>
                  <Popup>
                    <div className="text-center">
                      <strong>Josthom Eco-Resort</strong>
                      <br />
                      Tu escape al campo
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
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
                    Ruta Provincial 123, Km 180<br />
                    Partido de Chascomús, Buenos Aires<br />
                    Argentina
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
                <a href="tel:+5491112345678">
                  <Button className="bg-amber-700 hover:bg-amber-800 text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    Llamanos
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
              Tips para tu viaje
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Mejor momento", desc: "Salí temprano para evitar el tráfico y llegar con luz del día para disfrutar tu primer atardecer." },
              { title: "Qué traer", desc: "Ropa cómoda, protector solar, repelente y ganas de desconectarte. Nosotros nos encargamos del resto." },
              { title: "Camino de tierra", desc: "Los últimos 5 km son de tierra. El camino está en buen estado, pero te recomendamos ir despacio." },
              { title: "Sin señal", desc: "La señal de celular es débil. Avisá a tus contactos que vas a estar desconectado. ¡Es parte de la experiencia!" },
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