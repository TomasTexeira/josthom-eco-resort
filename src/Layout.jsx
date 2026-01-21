import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

export default function Layout({ children, currentPageName }) {
  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col">
      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        }
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      </div>
      </HelmetProvider>
      );
      }