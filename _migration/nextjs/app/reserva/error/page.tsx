import { Suspense } from "react";
import ErrorContent from "./ErrorContent";

export const metadata = { title: "Error en el pago · Josthom Eco Resort" };

export default function ReservaErrorPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-gray-400">Cargando...</div>}>
        <ErrorContent />
      </Suspense>
    </main>
  );
}
