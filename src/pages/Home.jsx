import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SEO from '@/components/shared/SEO';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import FeaturedAccommodations from '@/components/home/FeaturedAccommodations';
import ExperiencePreview from '@/components/home/ExperiencePreview';
import CTASection from '@/components/home/CTASection';

export default function Home() {
  const { data: accommodations } = useQuery({
    queryKey: ['accommodations'],
    queryFn: () => base44.entities.Accommodation.list('order'),
  });

  const { data: siteContent } = useQuery({
    queryKey: ['site-content'],
    queryFn: () => base44.entities.SiteContent.list(),
  });

  const getContent = (section) => siteContent?.find(c => c.section === section);

  return (
    <div>
      <SEO 
        title="Inicio"
        description="Josthom Eco Resort - Cabañas y casas en Villa Paranacito, Entre Ríos. A 10 minutos en lancha del Río Uruguay. Descanso, naturaleza y tranquilidad absoluta en un entorno de campo auténtico."
        keywords="josthom, eco resort, cabañas villa paranacito, alojamiento entre rios, rio uruguay, campo, naturaleza, arroyo sagastume, cabañas con muelle"
        url="/"
      />
      <HeroSection content={getContent('hero')} />
      <AboutSection content={getContent('about')} />
      <FeaturedAccommodations accommodations={accommodations} />
      <ExperiencePreview />
      <CTASection />
    </div>
  );
}