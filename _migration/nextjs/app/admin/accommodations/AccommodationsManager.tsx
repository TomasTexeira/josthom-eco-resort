"use client";
/**
 * Gestión de alojamientos — migrado desde src/components/admin/AccommodationsManager.jsx
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { accommodationsApi, type Accommodation } from "@/lib/api-client";
import Image from "next/image";
import toast from "react-hot-toast";

interface Props { token: string; }

const EMPTY: Partial<Accommodation> = {
  name: "", type: "cabaña", capacity: 2, bedrooms: 1, bathrooms: 1,
  description: "", short_description: "", main_image: "", booking_url: "",
  is_featured: false, order: 0, amenities: [], gallery_images: [],
};

export default function AccommodationsManager({ token }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Partial<Accommodation>>(EMPTY);
  const [isNew, setIsNew]         = useState(true);
  const qc = useQueryClient();

  const { data: accommodations = [], isLoading } = useQuery({
    queryKey: ["accommodations"],
    queryFn: () => accommodationsApi.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Accommodation>) =>
      isNew
        ? accommodationsApi.create(data, token)
        : accommodationsApi.update(data.id!, data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accommodations"] });
      toast.success(isNew ? "Alojamiento creado" : "Alojamiento actualizado");
      setModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accommodationsApi.delete(id, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accommodations"] }); toast.success("Eliminado"); },
    onError: (err: any) => toast.error(err.message),
  });

  const openNew  = () => { setEditing(EMPTY); setIsNew(true);  setModalOpen(true); };
  const openEdit = (a: Accommodation) => { setEditing({ ...a }); setIsNew(false); setModalOpen(true); };

  const handleChange = (field: keyof Accommodation, value: any) =>
    setEditing(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alojamientos</h1>
          <p className="text-sm text-gray-500">{accommodations.length} cabañas/casas</p>
        </div>
        <button onClick={openNew} className="btn-primary gap-2 flex items-center">
          <Plus size={16} /> Nueva cabaña
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : accommodations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">No hay alojamientos todavía.</p>
          <button onClick={openNew} className="btn-primary gap-2 inline-flex">
            <Plus size={16} /> Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accommodations.map(acc => (
            <div key={acc.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden group">
              <div className="relative h-40">
                {acc.main_image
                  ? <Image src={acc.main_image} alt={acc.name} fill className="object-cover" />
                  : <div className="w-full h-full bg-green-50 flex items-center justify-center text-green-400 text-sm">Sin imagen</div>
                }
                {acc.is_featured && (
                  <span className="absolute top-2 left-2 bg-amber-400 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={10} /> Destacado
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{acc.type} · {acc.capacity} huéspedes · {acc.bedrooms} dorm.</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(acc)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => { if (confirm("¿Eliminar este alojamiento?")) deleteMutation.mutate(acc.id); }}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{isNew ? "Nueva cabaña" : "Editar cabaña"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {([
                ["name",              "Nombre *",                       "text"],
                ["type",              "Tipo",                           "select:cabaña,casa"],
                ["capacity",          "Capacidad (personas)",           "number"],
                ["bedrooms",          "Dormitorios",                    "number"],
                ["bathrooms",         "Baños",                          "number"],
                ["price_per_night",   "Precio por noche (ARS) *",      "number"],
                ["main_image",        "URL imagen principal",           "text"],
                ["short_description", "Descripción corta",              "text"],
                ["description",       "Descripción completa",           "textarea"],
                ["booking_url",       "URL reserva externa (opcional)", "text"],
                ["order",             "Orden de display",               "number"],
              ] as [keyof Accommodation, string, string][]).map(([field, label, type]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  {type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={(editing[field] as string) || ""}
                      onChange={e => handleChange(field, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                    />
                  ) : type.startsWith("select:") ? (
                    <select
                      value={(editing[field] as string) || ""}
                      onChange={e => handleChange(field, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      {type.split(":")[1].split(",").map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={(editing[field] as string | number) ?? ""}
                      onChange={e => handleChange(field, type === "number" ? Number(e.target.value) : e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  )}
                </div>
              ))}

              {/* Amenities — separadas por coma */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Comodidades <span className="font-normal text-gray-400">(separadas por coma)</span>
                </label>
                <input
                  type="text"
                  value={(editing.amenities || []).join(", ")}
                  onChange={e => handleChange("amenities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="WiFi, Aire acondicionado, Parrilla, ..."
                />
              </div>

              {/* Gallery images — una URL por línea */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fotos adicionales <span className="font-normal text-gray-400">(una URL por línea)</span>
                </label>
                <textarea
                  rows={4}
                  value={(editing.gallery_images || []).join("\n")}
                  onChange={e => handleChange("gallery_images", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none font-mono text-xs"
                  placeholder={"https://nas.josthom.com/fotos/cabana1/foto1.jpg\nhttps://nas.josthom.com/fotos/cabana1/foto2.jpg"}
                />
                {(editing.gallery_images || []).length > 0 && (
                  <p className="text-xs text-green-600 mt-1">{(editing.gallery_images || []).length} foto(s) cargada(s)</p>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editing.is_featured}
                  onChange={e => handleChange("is_featured", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Marcar como destacado</span>
              </label>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate(editing)}
                disabled={saveMutation.isPending || !editing.name}
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
