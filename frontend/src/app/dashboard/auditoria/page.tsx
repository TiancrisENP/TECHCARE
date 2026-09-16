"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuditLog } from "@/types";

function formatDetails(details?: Record<string, unknown>): string {
  if (!details) return "—";
  return Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export default function AuditoriaDashboardPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/audit").then((res) => setLogs(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-6">Auditoría</h1>
      <p className="text-steel text-sm mb-6">
        Registro de quién hizo qué, sobre qué entidad y cuándo. Es de solo lectura.
      </p>

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Entidad</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-steel text-center">Cargando...</td></tr>}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-steel text-center">Sin eventos registrados aún.</td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-steel/20 align-top">
                <td className="px-4 py-3 font-mono text-xs text-steel whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("es-CO")}
                </td>
                <td className="px-4 py-3">{log.user?.name ?? "Sistema"}</td>
                <td className="px-4 py-3 font-mono text-xs text-copper">{log.action}</td>
                <td className="px-4 py-3 text-steel">{log.entity}</td>
                <td className="px-4 py-3 text-xs text-steel">{formatDetails(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
