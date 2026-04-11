"use client";
/**
 * Gestión de galería — migrado desde src/components/admin/GalleryManager.jsx
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, Star } from "lucide-react";
import { galleryApi, type GalleryImage } from "@/lib/api-client";
import Image from "next/image";
import toast from "react-hot-toast";

interface Props { token: string; }

const CATEGORIES = ["general", "cabañas", "piscina", "entorno", "instalaciones", "actividades"];

const EMPTY: Partial<GalleryImage> = {
  image_url: "", title: "", category: "general", order: 0, is_featured: false,
};

export default function GalleryManager({ token }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Partial<GalleryImage>>(EMPTY);
  const [isNew, setIsNew]         = useState(true);
  const [filterCat, setFilterCat] = useState("all");
  const qc = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => galleryApi.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<GalleryImage>) =>
      isNew
        ? galleryApi.create(data, token)
        : galleryApi.update(data.id!, data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success(isNew ? "Imagen agregada" : "Imagen actualizada");
      setModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => galleryApi.delete(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Imagen eliminada");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openNew  = () => { setEditing(EMPTY); setIsNew(true);  setModalOpen(true); };
  const openEdit = (img: GalleryImage) => { setEditing({ ...img }); setIsNew(false); setModalOpen(true); };

  const handleChange = (field: keyof GalleryImage, value: any) =>
    setEditing(prev => ({ ...prev, [field]: value }));

  const filtered = filterCat === "all" ? images : images.filter(i => i.category === filterCat);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galería</h1>
          <p className="text-sm text-gray-500">{images.length} imágenes</p>
        </div>
        <button onClick={openNew} className="btn-primary gap-2 flex items-center">
          <Plus size={16} /> Agregar imagen
        </button>
      </div>

      {/* Filtro por categoría */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterCat === "all" ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Todas
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${filterCat === cat ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">No hay imágenes{filterCat !== "all" ? ` en "${filterCat}"` : " todavía"}.</p>
          <button onClick={openNew} className="btn-primary gap-2 inline-flex">
            <Plus size={16} /> Agregar la primera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(img => (
            <div
              key={img.id}
              className="group relative rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
              onClick={() => openEdit(img)}
            >
              <div className="relative h-40">
                {img.image_url ? (
                  <Image src={img.image_url} alt={img.title || ""} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                )}
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                <button
                  onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar esta imagen?")) deleteMutation.mutate(img.id); }}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {img.is_featured && (
                  <span className="bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star size={8} /> Destacada
                  </span>
                )}
                <span className="bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full capitalize">
                  {img.category}
                </span>
              </div>
              {img.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{img.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{isNew ? "Agregar imagen" : "Editar imagen"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL de la imagen *</label>
                <input
                  type="text"
                  value={editing.image_url || ""}
                  onChange={e => handleChange("image_url", e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              {/* Preview */}
              {editing.image_url && (
                <div className="relative h-40 rounded-lg overflow-hidden bg-gray-100">
                  <Image src={editing.image_url} alt="preview" fill className="object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título (opcional)</label>
                <input
                  type="text"
                  value={editing.title || ""}
                  onChange={e => handleChange("title", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                <select
                  value={editing.category || "general"}
                  onChange={e => handleChange("category", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
                <input
                  type="number"
                  value={editing.order ?? 0}
                  onChange={e => handleChange("order", Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editing.is_featured}
                  onChange={e => handleChange("is_featured", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Destacar en la home</span>
              </label>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate(editing)}
                disabled={saveMutation.isPending || !editing.image_url}
                className="flex-1 btn-primary py-2 disabled:opacity-40"
              >
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
