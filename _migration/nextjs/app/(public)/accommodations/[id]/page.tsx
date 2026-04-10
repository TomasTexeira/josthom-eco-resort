/**
 * Página de detalle de alojamiento.
 * Genera páginas estáticas en build time (generateStaticParams).
 */
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { accommodationsApi } from "@/lib/api-client";
import AccommodationDetailClient from "./AccommodationDetailClient";

export const revalidate = 3600; // 1 hora

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const accommodations = await accommodationsApi.list();
    return accommodations.map((a) => ({ id: a.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const acc = await accommodationsApi.get(id);
    return {
      title: acc.name,
      description: acc.short_description || acc.description?.slice(0, 160),
      openGraph: {
        images: acc.main_image ? [acc.main_image] : [],
      },
    };
  } catch {
    return { title: "Alojamiento" };
  }
}

export default async function AccommodationDetailPage({ params }: Props) {
  const { id } = await params;

  let accommodation;
  try {
    accommodation = await accommodationsApi.get(id);
  } catch {
    notFound();
  }

  return <AccommodationDetailClient accommodation={accommodation} />;
}
