import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/Home';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', page: 'Home' },
    { name: 'Alojamientos', page: 'Accommodations' },
    { name: 'Galería', page: 'Gallery' },
    { name: 'La Experiencia', page: 'Experience' },
    { name: 'Ubicación', page: 'Location' },
    { name: 'Contacto', page: 'Contact' },
  ];

  const bgClass = isScrolled || !isHome 
    ? 'bg-white/95 backdrop-blur-md shadow-sm' 
    : 'bg-transparent';
  
  const textClass = isScrolled || !isHome
    ? 'text-stone-800'
    : 'text-white';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`flex items-center ${isHome && !isScrolled ? 'h-24 justify-center' : 'h-28 justify-between'}`}>
            {/* Logo - solo visible cuando hay scroll o no es Home */}
            {(isScrolled || !isHome) && (
              <Link to={createPageUrl("Home")} className="flex items-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5107e3a19_LogoJosthomVect.png"
                  alt="Josthom Eco Resort"
                  className="h-20 md:h-24 object-contain transition-all duration-300 brightness-0"
                />
              </Link>
            )}

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`text-sm tracking-wide hover:opacity-70 transition-opacity ${textClass}`}
                >
                  {link.name}
                </Link>
              ))}
              <Link to={createPageUrl("Accommodations")}>
                <Button 
                  size="sm"
                  className="bg-amber-700 hover:bg-amber-800 text-white ml-4"
                >
                  Reservar
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 ${textClass}`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-20 lg:hidden"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xl text-stone-800 hover:text-amber-700 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <Link to={createPageUrl("Accommodations")} onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="bg-amber-700 hover:bg-amber-800 text-white mt-4 px-8">
                  Reservar ahora
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}