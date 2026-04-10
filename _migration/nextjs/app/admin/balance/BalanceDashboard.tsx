"use client";
/**
 * Dashboard de balance — migrado desde src/components/admin/BalanceDashboard.jsx
 */
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Clock, DollarSign, Percent } from "lucide-react";
import { bookingsApi, type Booking } from "@/lib/api-client";

interface Props { token: string; }

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function BalanceDashboard({ token }: Props) {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings-balance", token],
    queryFn: () => bookingsApi.list({}, token),
    staleTime: 60_000,
  });

  const active = bookings.filter(b => b.status !== "cancelled");

  const totalIncome = active.reduce((s, b) => s + b.total_price, 0);
  const totalDeposits = active.reduce((s, b) => s + b.deposit_amount, 0);
  const totalBalances = active.reduce((s, b) => s + b.balance_amount, 0);

  // Pagos confirmados = bookings confirmados/completados
  const paid = bookings.filter(b => b.status === "confirmed" || b.status === "completed");
  const paidDeposits = paid.reduce((s, b) => s + b.deposit_amount, 0);
  const paidBalances = paid.reduce((s, b) => s + b.balance_amount, 0);

  const pendingDeposits = bookings.filter(b => b.status === "pending");
  const pendingBalances = bookings.filter(b => b.status === "confirmed");

  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
  const pct = totalIncome > 0 ? Math.round(((paidDeposits + paidBalances) / totalIncome) * 100) : 0;

  if (isLoading) return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Balance</h1>
        <p className="text-sm text-gray-500">{active.length} reservas activas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={TrendingUp} label="Ingresos totales"     value={fmt(totalIncome)}   sub={`${active.length} reservas`}   color="bg-green-600" />
        <KPICard icon={Clock}      label="Pendiente de cobro"   value={fmt(totalDeposits - paidDeposits + totalBalances - paidBalances)} sub="señas + saldos"  color="bg-amber-500" />
        <KPICard icon={DollarSign} label="Total cobrado"        value={fmt(paidDeposits + paidBalances)} sub="confirmadas+completadas" color="bg-blue-500" />
        <KPICard icon={Percent}    label="Progreso de cobro"    value={`${pct}%`}          sub="del total esperado"             color="bg-purple-500" />
      </div>

      {/* Barras de progreso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Señas */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Señas (25%)</h3>
            <span className="text-sm text-gray-500">{fmt(paidDeposits)} / {fmt(totalDeposits)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${totalDeposits > 0 ? (paidDeposits / totalDeposits) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">Pendiente: {fmt(totalDeposits - paidDeposits)}</p>
        </div>
        {/* Saldos */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Saldos (75%)</h3>
            <span className="text-sm text-gray-500">{fmt(paidBalances)} / {fmt(totalBalances)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all"
              style={{ width: `${totalBalances > 0 ? (paidBalances / totalBalances) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">Pendiente: {fmt(totalBalances - paidBalances)}</p>
        </div>
      </div>

      {/* Señas pendientes */}
      {pendingDeposits.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-amber-50">
            <h3 className="font-semibold text-amber-800">Señas pendientes ({pendingDeposits.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingDeposits.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{b.guest_name}</p>
                  <p className="text-xs text-gray-400">{b.accommodation_name} · {b.check_in} → {b.check_out}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-700">{fmt(b.deposit_amount)}</p>
                  <p className="text-xs text-gray-400">seña 25%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saldos pendientes */}
      {pendingBalances.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-blue-50">
            <h3 className="font-semibold text-blue-800">Saldos por cobrar ({pendingBalances.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingBalances.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{b.guest_name}</p>
                  <p className="text-xs text-gray-400">{b.accommodation_name} · check-in {b.check_in}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-700">{fmt(b.balance_amount)}</p>
                  <p className="text-xs text-gray-400">saldo 75%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
