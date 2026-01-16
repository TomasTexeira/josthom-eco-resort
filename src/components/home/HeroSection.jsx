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
          src={content?.image_url || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80"}
          alt="Josthom Campo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-8 w-full flex justify-center"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png"
              alt="Josthom Eco Resort"
              className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl h-auto object-contain brightness-0 invert px-6"
            />
          </motion.div>
          
          <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            {content?.subtitle || "Descanso, naturaleza y río en un entorno de tranquilidad absoluta"}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to={createPageUrl("Accommodations")}>
              <Button 
                size="lg" 
                className="bg-amber-700 hover:bg-amber-800 text-white px-10 py-6 text-base tracking-wide transition-all duration-300"
              >
                Reservar ahora
              </Button>
            </Link>
            <Link to={createPageUrl("Experience")}>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/40 text-white hover:bg-white/10 px-10 py-6 text-base tracking-wide backdrop-blur-sm"
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
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-8 h-8 text-white/60" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}