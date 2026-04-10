/**
 * /reserva/pagar/[booking_id]
 * Server component que crea/recrea la preferencia de MP y redirige al usuario.
 * Útil para el botón "Reintentar pago" de las páginas de error/pendiente.
 */
import { redirect } from "next/navigation";

type Params = Promise<{ booking_id: string }>;

export default async function PagarPage({ params }: { params: Params }) {
  // Espera a la promesa antes de usar booking_id
  const { booking_id } = await params;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(
      `${apiUrl}/api/payments/create-preference/${booking_id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      // Redirige si la API falla
      return redirect(`/reserva/error?booking_id=${booking_id}`);
    }

    const data = await res.json();
    if (data.payment_url) {
      return redirect(data.payment_url);
    }
  } catch {
    // En caso de error, redirige a la página de error
    return redirect(`/reserva/error?booking_id=${booking_id}`);
  }

  // Redirige por defecto a la página de error
  return redirect(`/reserva/error?booking_id=${booking_id}`);
}
