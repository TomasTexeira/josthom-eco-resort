"use client";

import { useSearchParams } from "next/navigation";
import { XCircle, Phone, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorContent() {
  const params = useSearchParams();
  const bookingId = params.get("booking_id");

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center space-y-6">
        {/* Icono */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle size={40} className="text-red-500" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">El pago no se completó</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Hubo un problema al procesar tu pago. Tu reserva sigue guardada y podés
            intentar pagar de nuevo.
          </p>
        </div>

        {/* Opciones de pago */}
        <div className="bg-red-50 rounded-xl p-5 text-left space-y-2 text-sm text-red-800">
          <p className="font-semibold">¿Qué puedo hacer?</p>
          <ul className="space-y-1.5 text-red-700">
            <li>• Verificar que tu tarjeta tenga fondos suficientes.</li>
            <li>• Intentar con otra tarjeta o medio de pago.</li>
            <li>• Contactarnos por WhatsApp para coordinar un pago alternativo.</li>
          </ul>
          <p className="text-xs text-red-500 pt-1">
            Tenés <strong>24 horas</strong> para completar el pago antes de que la reserva
            se cancele automáticamente.
          </p>
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          {bookingId && (
            <Link
              href={`/reserva/pagar/${bookingId}`}
              className="flex items-center justify-center gap-2 w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl px-5 py-3 transition-colors text-sm"
            >
              <RefreshCw size={16} /> Reintentar pago
            </Link>
          )}

          <a
            href="https://wa.me/5491138323695?text=Hola!%20Tuve%20un%20error%20al%20pagar%20mi%20reserva"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-green-200 bg-green-50 hover:bg-green-100 text-green-800 font-medium rounded-xl px-5 py-3 transition-colors text-sm"
          >
            <Phone size={16} /> Contactar por WhatsApp
          </a>

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
