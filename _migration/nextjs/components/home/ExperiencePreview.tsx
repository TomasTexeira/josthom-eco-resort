import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const IMAGES = [
  { src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&q=80&fm=webp", alt: "Río Uruguay", size: "large" },
  { src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80&fm=webp", alt: "Fauna nativa", size: "small" },
  { src: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&q=80&fm=webp", alt: "Atardecer", size: "small" },
];

export default function ExperiencePreview() {
  return (
    <section className="section-container py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Texto */}
        <div className="space-y-6 order-2 lg:order-1">
          <div>
            <p className="text-green-700 text-sm font-semibold uppercase tracking-widest mb-2">Experiencias</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Más que un lugar, una experiencia
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-lg">
            Pescá en el Arroyo Sagastume, kayak en el Río Uruguay, caminá entre carpinchos o simplemente descansá escuchando los pájaros. Cada día es diferente.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            {["Pesca y deportes acuáticos", "Fauna y flora nativa", "Piscinas al aire libre", "WiFi Starlink"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/experience" className="btn-outline inline-flex gap-2">
            Descubrir más <ArrowRight size={16} />
          </Link>
        </div>

        {/* Grid de imágenes */}
        <div className="grid grid-cols-2 gap-3 order-1 lg:order-2 h-80">
          <div className="relative rounded-xl overflow-hidden row-span-2">
            <Image src={IMAGES[0].src} alt={IMAGES[0].alt} fill className="object-cover" />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image src={IMAGES[1].src} alt={IMAGES[1].alt} fill className="object-cover" />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image src={IMAGES[2].src} alt={IMAGES[2].alt} fill className="object-cover" />
          </div>
        </div>

      </div>
    </section>
  );
}
