"use client";
/**
 * Gestión de contenido del sitio — migrado desde src/components/admin/ContentManager.jsx
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { contentApi, type SiteContent } from "@/lib/api-client";
import toast from "react-hot-toast";

interface Props { token: string; }

// Agrupación de claves para mostrar en secciones
const SECTIONS: { label: string; keys: string[] }[] = [
  {
    label: "Hero / Portada",
    keys: ["hero_title", "hero_subtitle", "hero_cta_text"],
  },
  {
    label: "Sobre nosotros",
    keys: ["about_title", "about_description", "about_image"],
  },
  {
    label: "Contacto",
    keys: ["contact_phone", "contact_whatsapp", "contact_email", "contact_address"],
  },
  {
    label: "Redes sociales",
    keys: ["instagram_url", "facebook_url"],
  },
  {
    label: "SEO y metadatos",
    keys: ["meta_title", "meta_description"],
  },
];

function fieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function isMultiline(key: string): boolean {
  return key.includes("description") || key.includes("subtitle") || key.includes("address");
}

export default function ContentManager({ token }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ "Hero / Portada": true });
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["site-content"],
    queryFn: () => contentApi.list(),
  });

  // Build a map for quick lookup
  const contentMap: Record<string, SiteContent> = {};
  items.forEach(item => { contentMap[item.section] = item; });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      contentApi.upsert(key, { value }, token),
    onSuccess: (_data, { key }) => {
      qc.invalidateQueries({ queryKey: ["site-content"] });
      setDirty(prev => { const next = { ...prev }; delete next[key]; return next; });
      toast.success("Guardado");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const saveAll = async () => {
    const keys = Object.keys(dirty);
    if (keys.length === 0) { toast("No hay cambios pendientes"); return; }
    for (const key of keys) {
      await updateMutation.mutateAsync({ key, value: dirty[key] });
    }
  };

  const getValue = (key: string) =>
    dirty[key] !== undefined ? dirty[key] : (contentMap[key]?.value || "");

  const handleChange = (key: string, value: string) => {
    setDirty(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (label: string) =>
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));

  const hasDirty = Object.keys(dirty).length > 0;

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contenido del sitio</h1>
          <p className="text-sm text-gray-500">
            {hasDirty
              ? `${Object.keys(dirty).length} cambio(s) sin guardar`
              : "Todo guardado"}
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={!hasDirty || updateMutation.isPending}
          className="btn-primary gap-2 flex items-center disabled:opacity-40"
        >
          <Save size={16} />
          {updateMutation.isPending ? "Guardando..." : "Guardar todos"}
        </button>
      </div>

      {/* Secciones */}
      {SECTIONS.map(section => {
        const isOpen = !!openSections[section.label];
        const sectionDirty = section.keys.some(k => dirty[k] !== undefined);
        return (
          <div key={section.label} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection(section.label)}
            >
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">{section.label}</h2>
                {sectionDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Cambios sin guardar" />
                )}
              </div>
              {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                {section.keys.map(key => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-600">{fieldLabel(key)}</label>
                      {dirty[key] !== undefined && (
                        <span className="text-[10px] text-amber-600 font-medium">● sin guardar</span>
                      )}
                    </div>
                    {isMultiline(key) ? (
                      <textarea
                        rows={3}
                        value={getValue(key)}
                        onChange={e => handleChange(key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={getValue(key)}
                        onChange={e => handleChange(key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    )}
                  </div>
                ))}
                {/* Guardar solo esta sección */}
                {sectionDirty && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={async () => {
                        for (const key of section.keys) {
                          if (dirty[key] !== undefined) {
                            await updateMutation.mutateAsync({ key, value: dirty[key] });
                          }
                        }
                      }}
                      disabled={updateMutation.isPending}
                      className="text-xs px-4 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-40 flex items-center gap-1"
                    >
                      <Save size={12} /> Guardar sección
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Contenido personalizado (claves no agrupadas) */}
      {(() => {
        const knownKeys = SECTIONS.flatMap(s => s.keys);
        const otherItems = items.filter(item => !knownKeys.includes(item.section));
        if (otherItems.length === 0) return null;
        return (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50"
              onClick={() => toggleSection("Otros")}
            >
              <h2 className="font-semibold text-gray-900">Otros ({otherItems.length})</h2>
              {openSections["Otros"] ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {openSections["Otros"] && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                {otherItems.map(item => (
                  <div key={item.section}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fieldLabel(item.section)}</label>
                    <input
                      type="text"
                      value={getValue(item.section)}
                      onChange={e => handleChange(item.section, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
