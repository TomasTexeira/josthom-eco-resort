import { Suspense } from "react";
import ConfirmadaContent from "./ConfirmadaContent";

export const metadata = { title: "Reserva Confirmada · Josthom Eco Resort" };

export default function ReservaConfirmadaPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-gray-400">Cargando...</div>}>
        <ConfirmadaContent />
      </Suspense>
    </main>
  );
}
