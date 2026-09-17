"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";
import { api } from "@/lib/api";
import { SalesByMonth, TopProduct } from "@/types";

interface DashboardStats {
  salesThisMonth: number;
  orders: number;
  services: number;
  warranties: number;
  lowStock: number;
}

function StatStamp({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`bg-white border p-5 rounded-lg ${accent || "border-slate-200"}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">{label}</p>
      <p className={`font-display text-3xl font-semibold ${accent ? accent.replace("border-", "text-") : "text-graphite"}`}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4">{title}</p>
      <div className="h-64">{children}</div>
    </div>
  );
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<SalesByMonth[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    api.get("/dashboard").then((res) => setStats(res.data)).catch(() => setStats(null));
    api.get("/dashboard/sales-by-month").then((res) => setSales(res.data)).catch(() => setSales([]));
    api.get("/dashboard/top-products").then((res) => setTopProducts(res.data)).catch(() => setTopProducts([]));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-graphite mb-2">Resumen operativo</h1>
      <p className="font-mono text-xs text-steel mb-8">ventas · stock · órdenes de servicio</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatStamp label="Ventas este mes" value={`$${(stats?.salesThisMonth ?? 0).toLocaleString("es-CO")}`} />
        <StatStamp label="Pedidos" value={String(stats?.orders ?? 0)} />
        <StatStamp label="Servicios activos" value={String(stats?.services ?? 0)} />
        <StatStamp
          label="Stock bajo"
          value={String(stats?.lowStock ?? 0)}
          accent={stats && stats.lowStock > 0 ? "border-rust" : "border-solder"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Ventas por mes (últimos 6 meses)">
          {sales.length === 0 ? (
            <p className="text-steel text-sm">Aún no hay ventas suficientes para graficar.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#7C8B93" opacity={0.2} />
                <XAxis dataKey="month" stroke="#7C8B93" fontSize={12} />
                <YAxis stroke="#7C8B93" fontSize={12} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString("es-CO")}`} />
                <Line type="monotone" dataKey="total" stroke="#0284C7" strokeWidth={2} dot={{ fill: "#0284C7" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Productos más vendidos">
          {topProducts.length === 0 ? (
            <p className="text-steel text-sm">Aún no hay ventas suficientes para graficar.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#7C8B93" opacity={0.2} />
                <XAxis type="number" stroke="#7C8B93" fontSize={12} />
                <YAxis type="category" dataKey="product" stroke="#7C8B93" fontSize={11} width={120} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
