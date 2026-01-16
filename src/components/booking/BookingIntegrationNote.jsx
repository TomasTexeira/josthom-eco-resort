import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function BookingIntegrationNote() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 font-semibold mb-2">
        Integración con sistema externo
      </AlertTitle>
      <AlertDescription className="text-blue-800 text-sm space-y-3">
        <p>
          Actualmente el calendario muestra las reservas almacenadas en Base44. 
          Para integrar con tu sistema de reservas externo (Airbnb, Booking.com, 
          sistema propio, etc.), necesitás habilitar <strong>Backend Functions</strong>.
        </p>
        
        <div className="bg-white/50 rounded-lg p-3 space-y-2">
          <p className="font-medium text-blue-900">Con Backend Functions podrás:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Sincronizar reservas automáticamente con plataformas externas</li>
            <li>Actualizar disponibilidad en tiempo real vía webhooks</li>
            <li>Conectar con APIs de Airbnb, Booking.com, o tu sistema propio</li>
            <li>Enviar confirmaciones automáticas por email</li>
            <li>Procesar pagos con Stripe, MercadoPago, etc.</li>
          </ul>
        </div>

        <p className="text-xs">
          Ve a <strong>Dashboard → Settings → Backend Functions</strong> para habilitarlo.
        </p>
      </AlertDescription>
    </Alert>
  );
}