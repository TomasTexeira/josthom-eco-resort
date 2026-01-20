import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HeroSection({ content }) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={content?.image_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/e3f62c4c0_liftapp1.jpg"}
          alt="Josthom Campo"
          className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
      </div>

      
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl">

              <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-8 w-full flex justify-center" // Se restauran las clases de centrado
          >
                <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png"
              alt="Josthom Eco Resort" className="rounded h-50 max-h-58 md:max-h-64 object-contain brightness-0 invert" />


              </motion.div>
              
              <p className="text-white/80 mb-10 mx-auto text-xl font-medium leading-relaxed md:text-2xl max-w-2xl">
                {content?.subtitle || "Descanso, naturaleza y río en un entorno de tranquilidad absoluta"}
              </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">

            <Link to={createPageUrl("Accommodations")}>
             <Button
  size="lg"
  className="bg-amber-700 text-white px-10 shadow hover:bg-amber-800 transition-all duration-300"
>
  Reservar ahora
</Button>
            </Link>
            <Link to={createPageUrl("Experience")}>
             <Button
  variant="outline"
  size="lg"
  className="px-10 shadow-sm bg-slate-50 text-slate-900 hover:bg-white/10 backdrop-blur-sm"
>
  Conocer más
</Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2">

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>

            <ChevronDown className="w-8 h-8 text-white/60" />
          </motion.div>
        </motion.div>
      </div>
    </section>);

}