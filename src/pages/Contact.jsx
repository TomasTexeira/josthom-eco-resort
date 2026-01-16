import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Contact() {
  const contactMethods = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "+54 9 11 1234-5678",
      link: "https://wa.me/5491112345678",
      description: "Respuesta inmediata",
      color: "bg-green-50 text-green-700"
    },
    {
      icon: Mail,
      title: "Email",
      value: "info@josthom.com",
      link: "mailto:info@josthom.com",
      description: "Te respondemos en 24hs",
      color: "bg-blue-50 text-blue-700"
    },
    {
      icon: Phone,
      title: "Teléfono",
      value: "+54 9 11 1234-5678",
      link: "tel:+5491112345678",
      description: "Lunes a viernes 9 a 18hs",
      color: "bg-amber-50 text-amber-700"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80"
            alt="Contacto"
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
            Hablemos
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-4">
            Contacto
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Estamos para ayudarte a planificar tu estadía perfecta
          </p>
        </motion.div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <motion.a
                key={index}
                href={method.link}
                target={method.link.startsWith('http') ? '_blank' : undefined}
                rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-stone-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group text-center"
              >
                <div className={`w-16 h-16 rounded-full ${method.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <method.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-medium text-stone-800 mb-2">
                  {method.title}
                </h3>
                <p className="text-lg text-stone-600 mb-2">
                  {method.value}
                </p>
                <p className="text-sm text-stone-400">
                  {method.description}
                </p>
              </motion.a>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-8 md:p-12 text-center text-white mb-16"
          >
            <MessageCircle className="w-12 h-12 mx-auto mb-6 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-light mb-4">
              La forma más rápida de contactarnos
            </h2>
            <p className="text-green-100 mb-8 max-w-lg mx-auto">
              Escribinos por WhatsApp y te respondemos al instante. 
              Podés consultar disponibilidad, precios y todo lo que necesites.
            </p>
            <a 
              href="https://wa.me/5491112345678?text=Hola!%20Me%20interesa%20conocer%20más%20sobre%20Josthom"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                size="lg" 
                className="bg-white text-green-700 hover:bg-green-50 px-10 py-6 text-lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Abrir WhatsApp
              </Button>
            </a>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12"
          >
            {/* Form */}
            <div className="bg-stone-50 rounded-3xl p-8 md:p-10">
              <h2 className="text-2xl font-light text-stone-800 mb-2">
                Envianos un mensaje
              </h2>
              <p className="text-stone-500 mb-8">
                Completá el formulario y te contactamos a la brevedad
              </p>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">Nombre</label>
                    <Input 
                      placeholder="Tu nombre" 
                      className="bg-white border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">Email</label>
                    <Input 
                      type="email" 
                      placeholder="tu@email.com" 
                      className="bg-white border-stone-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-stone-600 mb-2">Teléfono</label>
                  <Input 
                    placeholder="+54 9 11 XXXX-XXXX" 
                    className="bg-white border-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-sm text-stone-600 mb-2">Mensaje</label>
                  <Textarea 
                    placeholder="Contanos qué estás buscando, fechas tentativas, cantidad de personas..."
                    className="bg-white border-stone-200 min-h-[150px]"
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white py-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar mensaje
                </Button>
              </form>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-light text-stone-800 mb-6">
                ¿Tenés dudas?
              </h2>
              <p className="text-stone-600 mb-8 leading-relaxed">
                Estamos para ayudarte. Ya sea que quieras consultar disponibilidad, 
                conocer más sobre nuestras cabañas o simplemente saber más sobre 
                la experiencia Josthom, escribinos sin compromiso.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-800">Horario de atención</h3>
                    <p className="text-stone-500 text-sm">Lunes a viernes de 9 a 18hs</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-800">Ubicación</h3>
                    <p className="text-stone-500 text-sm">
                      Ruta Provincial 123, Km 180<br />
                      Buenos Aires, Argentina
                    </p>
                    <Link 
                      to={createPageUrl("Location")}
                      className="text-amber-700 text-sm hover:underline inline-block mt-1"
                    >
                      Ver cómo llegar →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}