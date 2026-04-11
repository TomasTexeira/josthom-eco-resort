import Link from "next/link";
import Image from "next/image";

const BG = "https://rsqsoyrmqbnxqqxsauxk.supabase.co/storage/v1/object/public/Fotos%20josthom/fotosjosthomcabanas/a4955305-7459-405e-9cbb-d7b1ba61725e.JPG";

export default function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <Image src={BG} alt="Escapada al campo" fill className="object-cover" />
      <div className="absolute inset-0 bg-amber-900/70" />
      <div className="relative z-10 section-container text-center text-white space-y-6">
        <h2 className="text-4xl md:text-5xl font-bold">
          Tu escape al campo te espera
        </h2>
        <p className="text-white/80 text-lg max-w-xl mx-auto">
          Reservá tu cabaña y viví la tranquilidad del litoral entrerriano.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/accommodations" className="btn-primary text-base px-8 py-3">
            Reservar ahora
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 border-2 border-white/60 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
          >
            Contactarnos
          </Link>
        </div>
      </div>
    </section>
  );
}
