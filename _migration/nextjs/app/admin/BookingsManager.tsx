"use client";
/**
 * Gestor de reservas — migrado desde src/components/admin/BookingsManager.jsx
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { bookingsApi, accommodationsApi, type Booking } from "@/lib/api-client";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelada",  color: "bg-red-100 text-red-800" },
  completed: { label: "Completada", color: "bg-blue-100 text-blue-800" },
};

interface Props { token: string; }

export default function BookingsManager({ token }: Props) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<string>("all");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", statusFilter, search],
    queryFn: () => bookingsApi.list(
      { status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined },
      token
    ),
    refetchInterval: 30_000,
  });

  const { data: accommodations = [] } = useQuery({
    queryKey: ["accommodations"],
    queryFn: () => accommodationsApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Booking> }) =>
      bookingsApi.update(id, data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Reserva actualizada");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.delete(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Reserva eliminada");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const nights = (b: Booking) => {
    const ci = new Date(b.check_in + "T12:00:00");
    const co = new Date(b.check_out + "T12:00:00");
    return Math.round((co.getTime() - ci.getTime()) / 86400000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-sm text-gray-500">{bookings.length} resultado{bookings.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="completed">Completadas</option>
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No se encontraron reservas.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
            const isOpen = expanded === b.id;

            return (
              <div key={b.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {/* Header de la reserva */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isOpen ? null : b.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{b.guest_name}</p>
                      <p className="text-xs text-gray-500">{b.accommodation_name}</p>
                    </div>
                    <div className="hidden sm:block text-sm text-gray-500">
                      {b.check_in} → {b.check_out}
                      <span className="text-gray-400 ml-1">({nights(b)}n)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm hidden sm:block">
                      ${b.total_price.toLocaleString("es-AR")}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Detalle expandido */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-xs text-gray-400">Email</p><p className="font-medium truncate">{b.guest_email}</p></div>
                      <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-medium">{b.guest_phone || "—"}</p></div>
                      <div><p className="text-xs text-gray-400">Huéspedes</p><p className="font-medium">{b.number_of_guests}</p></div>
                      <div><p className="text-xs text-gray-400">Origen</p><p className="font-medium capitalize">{b.source}</p></div>
                      <div><p className="text-xs text-gray-400">Total</p><p className="font-semibold">${b.total_price.toLocaleString("es-AR")}</p></div>
                      <div><p className="text-xs text-gray-400">Seña (25%)</p><p className="font-medium">${b.deposit_amount.toLocaleString("es-AR")}</p></div>
                      <div><p className="text-xs text-gray-400">Saldo (75%)</p><p className="font-medium">${b.balance_amount.toLocaleString("es-AR")}</p></div>
                    </div>
                    {b.special_requests && (
                      <div className="bg-white rounded-lg p-3 text-sm">
                        <p className="text-xs text-gray-400 mb-1">Pedidos especiales</p>
                        <p className="text-gray-700">{b.special_requests}</p>
                      </div>
                    )}
                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2">
                      {b.status === "pending" && (
                        <button
                          onClick={() => updateMutation.mutate({ id: b.id, data: { status: "confirmed" } })}
                          className="px-3 py-1.5 bg-green-700 text-white text-xs rounded-lg hover:bg-green-800"
                        >
                          Confirmar
                        </button>
                      )}
                      {b.status !== "cancelled" && b.status !== "completed" && (
                        <button
                          onClick={() => updateMutation.mutate({ id: b.id, data: { status: "cancelled" } })}
                          className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200"
                        >
                          Cancelar
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${b.guest_phone?.replace(/\D/g, "") || ""}?text=Hola%20${encodeURIComponent(b.guest_name)}!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200"
                      >
                        WhatsApp
                      </a>
                      <button
                        onClick={() => {
                          if (confirm("¿Eliminar esta reserva?")) deleteMutation.mutate(b.id);
                        }}
                        className="ml-auto p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
