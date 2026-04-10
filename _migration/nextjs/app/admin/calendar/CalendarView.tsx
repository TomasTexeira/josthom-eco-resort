"use client";
/**
 * Vista de calendario mensual — migrada desde src/components/admin/CalendarView.jsx
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bookingsApi, accommodationsApi, type Booking } from "@/lib/api-client";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-400",
  confirmed: "bg-green-500",
  cancelled: "bg-red-400",
  completed: "bg-blue-400",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada", completed: "Completada",
};

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface Props { token: string; }

export default function CalendarView({ token }: Props) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [accFilter, setAccFilter] = useState("all");
  const [selected, setSelected] = useState<Booking | null>(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings-calendar", token],
    queryFn: () => bookingsApi.list({}, token),
    staleTime: 30_000,
  });
  const { data: accommodations = [] } = useQuery({
    queryKey: ["accommodations"],
    queryFn: () => accommodationsApi.list(),
  });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Filtrar por alojamiento
  const filtered = accFilter === "all" ? bookings : bookings.filter(b => b.accommodation_id === accFilter);

  // Construir grilla del mes
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  // Bookings que tienen algún día en una celda
  const bookingsForDay = (day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filtered.filter(b => {
      const ci = b.check_in.slice(0, 10);
      const co = b.check_out.slice(0, 10);
      return ci <= date && date < co;
    });
  };

  const confirmed = filtered.filter(b => b.status === "confirmed").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500">{filtered.length} reservas · {confirmed} confirmadas</p>
        </div>
        <select
          value={accFilter}
          onChange={e => setAccFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="all">Todos los alojamientos</option>
          {accommodations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Navegación mes */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <h2 className="text-lg font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayBookings = day ? bookingsForDay(day) : [];
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <div
                key={i}
                className={`min-h-[80px] p-1.5 border-r border-b border-gray-50 ${!day ? "bg-gray-50/50" : ""}`}
              >
                {day && (
                  <>
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-green-700 text-white" : "text-gray-600"}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 2).map(b => (
                        <button
                          key={b.id}
                          onClick={() => setSelected(b)}
                          className={`w-full text-left text-white text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${STATUS_COLORS[b.status]}`}
                          title={b.guest_name}
                        >
                          {b.guest_name.split(" ")[0]}
                        </button>
                      ))}
                      {dayBookings.length > 2 && (
                        <span className="text-[10px] text-gray-400 pl-1">+{dayBookings.length - 2} más</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[key]}`} /> {label}
          </span>
        ))}
      </div>

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 text-lg">{selected.guest_name}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-400">Alojamiento</dt><dd className="font-medium">{selected.accommodation_name}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Check-in</dt><dd className="font-medium">{selected.check_in}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Check-out</dt><dd className="font-medium">{selected.check_out}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Huéspedes</dt><dd className="font-medium">{selected.number_of_guests}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Total</dt><dd className="font-bold text-gray-900">${selected.total_price.toLocaleString("es-AR")}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Estado</dt>
                <dd><span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span></dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
