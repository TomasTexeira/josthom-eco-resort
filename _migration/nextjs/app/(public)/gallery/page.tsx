import type { Metadata } from "next";
import GalleryClient from "./GalleryClient";
import { galleryApi, contentApi } from "@/lib/api-client";

export const revalidate = 600;
export const metadata: Metadata = { title: "Galería", description: "Fotografías de Josthom Eco Resort." };

export default async function GalleryPage() {
  const [images, hero] = await Promise.allSettled([
    galleryApi.list(),
    contentApi.get("gallery"),
  ]);

  return (
    <GalleryClient
      initialImages={images.status === "fulfilled" ? images.value : []}
      heroContent={hero.status === "fulfilled" ? hero.value : null}
    />
  );
}
