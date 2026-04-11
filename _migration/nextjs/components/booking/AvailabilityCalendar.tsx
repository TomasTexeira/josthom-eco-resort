"use client";
/**
 * Calendario de disponibilidad — migrado desde AvailabilityCalendar.jsx
 * Reglas de negocio:
 *   - Mínimo 2 noches (MIN_NIGHTS)
 *   - 1 día de bloqueo post check-out para limpieza (incluido en blocked_dates del backend)
 *   - 15% descuento lunes a jueves, calculado por noche en el backend
 *   - Reservas a +60 días: aviso de posible ajuste de precio
 */
import { useState, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { es } from "date-fns/locale";
import { addDays, differenceInDays, differenceInCalendarDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api-client";
import { AlertTriangle } from "lucide-react";

const MIN_NIGHTS = 2;
const PRICE_LOCK_DAYS = 60; // días de anticipación máxima para mantener precio

interface Props {
  accommodationId: string;
  onSelectDates?: (selection: {
    checkIn: Date;
    checkOut: Date;
    guests: number;
    totalPrice: number;
    depositAmount: number;
  }) => void;
}

const GUEST_OPTIONS = [1, 2, 3, 4, 5];

export default function AvailabilityCalendar({ accommodationId, onSelectDates }: Props) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [minNightsError, setMinNightsError] = useState(false);
  const [priceData, setPriceData] = useState<{
    nights: number;
    total_price: number;
    deposit_amount: number;
    weekday_discount_amount: number;
  } | null>(null);

  // Cargar fechas bloqueadas (el backend ya incluye el día de limpieza post check-out)
  const { data: unavailable } = useQuery({
    queryKey: ["unavailable-dates", accommodationId],
    queryFn: () => bookingsApi.unavailableDates(accommodationId),
    staleTime: 30_000,
  });

  // Noches seleccionadas actualmente
  const selectedNights = range?.from && range?.to
    ? differenceInDays(range.to, range.from)
    : 0;

  // ¿La reserva es a más de 60 días?
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFarBooking = range?.from
    ? differenceInCalendarDays(range.from, today) > PRICE_LOCK_DAYS
    : false;

  // Calcular precio — solo si cumple mínimo de noches
  const fetchPrice = useQuery({
    queryKey: ["price", accommodationId, range?.from, range?.to, guests],
    queryFn: () => {
      if (!range?.from || !range?.to) return null;
      return bookingsApi.calculatePrice({
        accommodation_id: accommodationId,
        check_in: range.from.toISOString().split("T")[0],
        check_out: range.to.toISOString().split("T")[0],
        number_of_guests: guests,
      });
    },
    enabled: !!range?.from && !!range?.to && selectedNights >= MIN_NIGHTS,
  });

  useEffect(() => {
    if (fetchPrice.data) {
      setPriceData(fetchPrice.data);
      setMinNightsError(false);
    }
  }, [fetchPrice.data]);

  // Validar mínimo de noches al seleccionar rango
  useEffect(() => {
    if (range?.from && range?.to) {
      const nights = differenceInDays(range.to, range.from);
      if (nights < MIN_NIGHTS) {
        setMinNightsError(true);
        setPriceData(null);
        setRange({ from: range.from, to: undefined });
      } else {
        setMinNightsError(false);
      }
    }
  }, [range?.from, range?.to]);

  // Fechas bloqueadas (Date objects)
  const blockedDates =
    unavailable?.blocked_dates.map((d) => new Date(d + "T12:00:00")) || [];

  // Cuando hay check-in sin check-out, deshabilitar día inmediato (mínimo 2 noches)
  const minCheckOutDate = range?.from && !range?.to
    ? addDays(range.from, MIN_NIGHTS)
    : null;

  const disabledDates = [
    { before: addDays(today, 1) },
    ...(minCheckOutDate
      ? [{ after: range!.from!, before: minCheckOutDate }]
      : []),
    ...blockedDates,
  ];

  const handleConfirm = () => {
    if (!range?.from || !range?.to || !priceData || !onSelectDates) return;
    if (selectedNights < MIN_NIGHTS) return;
    onSelectDates({
      checkIn: range.from,
      checkOut: range.to,
      guests,
      totalPrice: priceData.total_price,
      depositAmount: priceData.deposit_amount,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Selector de huéspedes */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Huéspedes</span>
        <div className="flex gap-1">
          {GUEST_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setGuests(n)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                guests === n
                  ? "bg-amber-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Calendario con estilos personalizados */}
      <style>{`
        .josthom-calendar {
          --rdp-cell-size: 44px;
          --rdp-accent-color: #b45309;
          --rdp-background-color: #fef3c7;
          width: 100%;
          margin: 0;
        }
        .josthom-calendar .rdp-months {
          width: 100%;
        }
        .josthom-calendar .rdp-month {
          width: 100%;
        }
        .josthom-calendar .rdp-table {
          width: 100%;
          max-width: 100%;
          border-collapse: separate;
          border-spacing: 2px;
        }
        .josthom-calendar .rdp-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px 12px;
        }
        .josthom-calendar .rdp-caption_label {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }
        .josthom-calendar .rdp-nav {
          display: flex;
          gap: 4px;
        }
        .josthom-calendar .rdp-nav_button {
          color: #15803d;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .josthom-calendar .rdp-nav_button:hover {
          background: #f0fdf4;
        }
        .josthom-calendar .rdp-head_cell {
          font-size: 0.7rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          text-align: center;
          padding-bottom: 8px;
        }
        .josthom-calendar .rdp-cell {
          text-align: center;
          padding: 1px;
        }
        .josthom-calendar .rdp-day {
          width: var(--rdp-cell-size);
          height: var(--rdp-cell-size);
          border-radius: 8px;
          font-size: 0.875rem;
          transition: background 0.1s, color 0.1s;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .josthom-calendar .rdp-day:not([disabled]):not(.rdp-day_selected):not(.rdp-day_range_middle):hover {
          background: #f0fdf4;
          color: #15803d;
        }
        .josthom-calendar .rdp-day_today:not(.rdp-day_selected) {
          font-weight: 700;
          color: #15803d;
          border: 2px solid #bbf7d0;
        }
        .josthom-calendar .rdp-day_range_start,
        .josthom-calendar .rdp-day_range_end {
          background: #b45309 !important;
          color: white !important;
          font-weight: 600;
        }
        .josthom-calendar .rdp-day_range_middle {
          background: #fef3c7 !important;
          color: #92400e !important;
          border-radius: 0 !important;
        }
        .josthom-calendar .rdp-day_selected:not(.rdp-day_range_middle) {
          background: #b45309 !important;
          color: white !important;
          font-weight: 600;
        }
        .josthom-calendar .rdp-day_disabled {
          color: #d1d5db !important;
          text-decoration: line-through;
          opacity: 0.45;
          cursor: not-allowed;
        }
        .josthom-calendar .rdp-day_outside {
          opacity: 0.3;
        }
      `}</style>

      <DayPicker
        className="josthom-calendar"
        mode="range"
        selected={range}
        onSelect={setRange}
        locale={es}
        disabled={disabledDates}
        numberOfMonths={1}
        showOutsideDays
      />

      {/* Error mínimo de noches */}
      {minNightsError && (
        <p className="text-xs text-red-600 text-center bg-red-50 rounded-lg py-2 px-3">
          La estadía mínima es de {MIN_NIGHTS} noches. Elegí otra fecha de salida.
        </p>
      )}

      {/* Info */}
      <p className="text-xs text-gray-400 text-center">
        💰 15% de descuento lunes a jueves · mínimo {MIN_NIGHTS} noches
      </p>

      {/* Resumen de precio */}
      {priceData && range?.from && range?.to && selectedNights >= MIN_NIGHTS && (
        <div className="bg-amber-50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{priceData.nights} noches</span>
            <span className="font-semibold">${priceData.total_price.toLocaleString("es-AR")}</span>
          </div>
          {priceData.weekday_discount_amount > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Descuento lun-jue</span>
              <span>-${priceData.weekday_discount_amount.toLocaleString("es-AR")}</span>
            </div>
          )}
          <div className="border-t border-green-200 pt-2 mt-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Seña (25%)</span>
              <span>${priceData.deposit_amount.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Aviso de ajuste de precio para reservas a más de 60 días */}
          {isFarBooking && (
            <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-1">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-800 leading-snug">
                Esta reserva es a más de {PRICE_LOCK_DAYS} días.
                El precio final del saldo (75%) puede ajustarse según la tarifa vigente al momento del check-in.
                La seña abonada se mantiene.
              </p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            className="w-full mt-1 py-2.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 font-medium transition-colors text-sm"
          >
            Reservar ahora
          </button>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex gap-4 text-xs text-gray-400 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          Seleccionado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" />
          No disponible
        </span>
      </div>
    </div>
  );
}
