"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Users, CreditCard, Loader2 } from "lucide-react";
import { bookingsApi, type Accommodation } from "@/lib/api-client";
import toast from "react-hot-toast";

const schema = z.object({
  guest_name:       z.string().min(2, "Ingresá tu nombre completo"),
  guest_email:      z.string().email("Email inválido"),
  guest_phone:      z.string().min(8, "Ingresá tu teléfono"),
  special_requests: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Selection {
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  depositAmount: number;
}

interface Props {
  accommodation: Accommodation;
  selection: Selection | null;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-shadow";

export default function BookingForm({ accommodation, selection }: Props) {
  const [redirecting, setRedirecting] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const nights = selection
    ? Math.round((selection.checkOut.getTime() - selection.checkIn.getTime()) / 86400000)
    : 0;

  const onSubmit = async (data: FormData) => {
    if (!selection) {
      toast.error("Seleccioná las fechas en el calendario primero");
      return;
    }

    try {
      const booking = await bookingsApi.create({
        accommodation_id:   accommodation.id,
        accommodation_name: accommodation.name,
        ...data,
        number_of_guests: selection.guests,
        check_in:  selection.checkIn.toISOString().split("T")[0],
        check_out: selection.checkOut.toISOString().split("T")[0],
      });

      const paymentUrl = booking.payments?.[0]?.payment_url;

      if (paymentUrl) {
        setRedirecting(true);
        toast.success("Reserva creada. Redirigiendo al pago...");
        await new Promise(r => setTimeout(r, 800));
        window.location.href = paymentUrl;
      } else {
        toast.error("No se pudo obtener el link de pago. Contactanos por WhatsApp.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al crear la reserva. Intentá de nuevo.");
    }
  };

  // Redirigiendo a MP
  if (redirecting) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center space-y-4">
        <Loader2 size={40} className="animate-spin text-brand-600 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">Redirigiendo a Mercado Pago...</h3>
        <p className="text-sm text-gray-500">Estás siendo redirigido para pagar la seña de forma segura.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
      <h2 className="font-display text-lg font-bold text-gray-900">Reservar {accommodation.name}</h2>

      {/* Resumen de selección */}
      {selection ? (
        <div className="bg-brand-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} className="text-brand-600" />
            <span>
              {format(selection.checkIn, "d MMM", { locale: es })} →{" "}
              {format(selection.checkOut, "d MMM yyyy", { locale: es })}
              <span className="text-gray-400 ml-1">({nights} noche{nights !== 1 ? "s" : ""})</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={14} className="text-brand-600" />
            <span>{selection.guests} huésped{selection.guests !== 1 ? "es" : ""}</span>
          </div>
          <div className="border-t border-brand-100 pt-2 mt-1 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>${selection.totalPrice.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between text-xs text-brand-700 font-medium">
            <span>Seña a pagar ahora (25%)</span>
            <span>${selection.depositAmount.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Saldo al retirarse</span>
            <span>${(selection.totalPrice - selection.depositAmount).toLocaleString("es-AR")}</span>
          </div>
        </div>
      ) : (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-sm text-brand-700">
          ← Seleccioná las fechas en el calendario para continuar
        </div>
      )}

      {/* Campos */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Nombre completo *
          </label>
          <input {...register("guest_name")} className={inputClass} placeholder="Juan García" />
          {errors.guest_name && <p className="text-xs text-red-500 mt-1">{errors.guest_name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Email *
          </label>
          <input {...register("guest_email")} type="email" className={inputClass} placeholder="juan@email.com" />
          {errors.guest_email && <p className="text-xs text-red-500 mt-1">{errors.guest_email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            WhatsApp / Teléfono *
          </label>
          <input {...register("guest_phone")} className={inputClass} placeholder="+54 9 11 ..." />
          {errors.guest_phone && <p className="text-xs text-red-500 mt-1">{errors.guest_phone.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Pedidos especiales (opcional)
          </label>
          <textarea
            {...register("special_requests")}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Alergias, necesidades especiales, etc."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selection}
          className="btn-primary w-full disabled:opacity-40 gap-2 py-3"
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" /> Procesando...</>
          ) : (
            <><CreditCard size={16} /> Reservar y pagar seña</>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Al confirmar, serás redirigido a Mercado Pago para abonar la seña (25%).
          El saldo restante se paga en efectivo o transferencia al retirarte.
        </p>
      </form>
    </div>
  );
}
