"use client";

import { useSearchParams } from "next/navigation";
import { Clock, Phone, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function PendienteContent() {
  const params = useSearchParams();
  const bookingId = params.get("booking_id");
  const isSandbox = params.get("sandbox") === "1";

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 text-center space-y-6">
        {/* Icono */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
            <Clock size={40} className="text-amber-500" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {isSandbox ? "Modo prueba activo" : "Pago en proceso"}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isSandbox
              ? "La cuenta de Mercado Pago todavía no está configurada. Tu reserva fue recibida y te contactaremos para coordinar el pago de la seña."
              : "Tu pago está siendo procesado. Puede demorar unos minutos en acreditarse. Recibirás un email cuando se confirme."}
          </p>
        </div>

        {/* Info adicional */}
        <div className="bg-amber-50 rounded-xl p-5 text-left space-y-2 text-sm text-amber-800">
          {isSandbox ? (
            <>
              <p className="font-semibold">Reserva recibida ✓</p>
              <p>Tu solicitud fue registrada. Coordiná el pago de la seña directamente con nosotros.</p>
            </>
          ) : (
            <>
              <p className="font-semibold">¿Qué pasa si el pago no se acredita?</p>
              <p>
                Tenés hasta <strong>24 horas</strong> para completar el pago antes de que la reserva
                se cancele automáticamente. Si ya pagaste, contactanos por WhatsApp.
              </p>
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          <a
            href="https://wa.me/5491138323695?text=Hola!%20Tengo%20una%20reserva%20pendiente%20de%20pago"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl px-5 py-3 transition-colors text-sm"
          >
            <Phone size={16} /> Contactar por WhatsApp
          </a>

          {!isSandbox && bookingId && (
            <Link
              href={`/reserva/pagar/${bookingId}`}
              className="flex items-center justify-center gap-2 w-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium rounded-xl px-5 py-3 transition-colors text-sm"
            >
              <RefreshCw size={16} /> Reintentar pago
            </Link>
          )}

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium rounded-xl px-5 py-3 transition-colors text-sm"
          >
            <Home size={16} /> Volver al inicio
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Josthom Eco Resort · Villa Paranacito, Entre Ríos
      </p>
    </div>
  );
}
