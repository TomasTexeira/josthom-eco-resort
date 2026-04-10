import { Suspense } from "react";
import PendienteContent from "./PendienteContent";

export const metadata = { title: "Pago Pendiente · Josthom Eco Resort" };

export default function ReservaPendientePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-gray-400">Cargando...</div>}>
        <PendienteContent />
      </Suspense>
    </main>
  );
}
