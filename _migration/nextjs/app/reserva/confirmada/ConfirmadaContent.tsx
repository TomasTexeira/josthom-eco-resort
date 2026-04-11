"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle, Phone, Home } from "lucide-react";
import Link from "next/link";

export default function ConfirmadaContent() {
  const params = useSearchParams();
  // booking_id disponible para uso futuro (ej: mostrar resumen)
  const _bookingId = params.get("booking_id");

  return (
    <div className="w-full max-w-md">
      {/* Card de éxito */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 text-center space-y-6">
        {/* Icono */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={40} className="text-green-600" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">¡Pago recibido!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Tu reserva en <strong className="text-gray-700">Josthom Eco Resort</strong> está
            confirmada. En breve recibirás un email con todos los detalles.
          </p>
        </div>

        {/* Info de contacto */}
        <div className="bg-green-50 rounded-xl p-5 text-left space-y-3 text-sm">
          <p className="font-semibold text-gray-800">¿Qué pasa ahora?</p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              Recibirás un email de confirmación con los detalles de tu estadía.
            </li>
            <li className="flex gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              El saldo restante (75%) se abona en efectivo o transferencia al retirarte.
            </li>
            <li className="flex gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              Check-in desde las 15 hs · Check-out hasta las 11 hs.
            </li>
          </ul>
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          <a
            href="https://wa.me/5491138323695?text=Hola!%20Acabo%20de%20confirmar%20mi%20reserva%20online"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl px-5 py-3 transition-colors text-sm"
          >
            <Phone size={16} /> Escribinos por WhatsApp
          </a>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium rounded-xl px-5 py-3 transition-colors text-sm"
          >
            <Home size={16} /> Volver al inicio
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Josthom Eco Resort · Villa Paranacito, Entre Ríos
      </p>
    </div>
  );
}
