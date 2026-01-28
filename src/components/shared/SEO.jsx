import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  keywords, 
  image,
  type = 'website',
  url,
  structuredData
}) {
  const siteTitle = "Josthom Eco Resort - Villa Paranacito, Entre Ríos";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = "Eco-resort de campo en Villa Paranacito, Entre Ríos. 6 cabañas con muelle propio sobre el Arroyo Sagastume, a 10 minutos del Río Uruguay. Descanso, naturaleza y tranquilidad absoluta.";
  const defaultImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a5cf868f1a8d949987da4/5f47c83f9_heronovo.png";
  const siteUrl = "https://josthom.com";

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />
      {url && <meta property="og:url" content={`${siteUrl}${url}`} />}
      <meta property="og:site_name" content={siteTitle} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Spanish" />
      <meta name="author" content="Josthom Eco Resort" />
      <link rel="canonical" href={url ? `${siteUrl}${url}` : siteUrl} />
      
      {/* Structured Data (Schema.org) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}