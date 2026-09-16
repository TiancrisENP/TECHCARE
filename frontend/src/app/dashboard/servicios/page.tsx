"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ServiceOrder, ServiceStatus, User } from "@/types";

const STATUS_OPTIONS: ServiceStatus[] = [
  "RECIBIDO", "DIAGNOSTICO", "COTIZACION", "ESPERANDO_APROBACION",
  "EN_REPARACION", "LISTO", "ENTREGADO", "CANCELADO",
];

export default function ServiciosDashboardPage() {
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [problem, setProblem] = useState("");

  function load() {
    Promise.all([api.get("/services"), api.get("/users/assignable")]).then(([s, u]) => {
      setServices(s.data);
      setCustomers(u.data);
    });
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: ServiceStatus) {
    await api.put(`/services/${id}/status`, { status });
    load();
  }

  async function createService(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Selecciona el usuario dueño del equipo.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/services", {
        customerId,
        deviceName,
        serialNumber: serialNumber || undefined,
        problem,
      });
      setCustomerId("");
      setDeviceName("");
      setSerialNumber("");
      setProblem("");
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo crear el servicio.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-6">Servicios técnicos</h1>

      <form onSubmit={createService} className="border-2 border-graphite ticket-notch bg-white p-4 mb-8">
        <p className="font-mono text-xs text-steel uppercase mb-3">Nuevo servicio</p>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-steel mb-1">Usuario / cliente</label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              <option value="">Selecciona un usuario activo</option>
              {customers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Equipo</label>
            <input
              required
              minLength={2}
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Ej. Lenovo ThinkPad T14"
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Número de serie (opcional)</label>
            <input
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-steel mb-1">Problema</label>
            <textarea
              required
              minLength={5}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={3}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
        </div>
        {error && <p className="text-rust text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-copper text-white px-5 py-2.5 text-sm font-medium ticket-notch disabled:opacity-50"
        >
          {submitting ? "Registrando..." : "Registrar servicio"}
        </button>
      </form>

      <div className="grid gap-4">
        {services.map((s) => (
          <div key={s.id} className="border-2 border-graphite ticket-notch bg-white p-4 flex items-center gap-6">
            <div className="font-mono text-xs text-copper w-28 shrink-0">{s.trackingCode}</div>
            <div className="flex-1">
              <p className="font-medium text-graphite">{s.deviceName}</p>
              <p className="text-steel text-sm">{s.problem}</p>
              {s.customer?.name && (
                <p className="text-steel text-xs mt-1">Cliente: {s.customer.name}</p>
              )}
            </div>
            <select
              value={s.status}
              onChange={(e) => updateStatus(s.id, e.target.value as ServiceStatus)}
              className="border-2 border-graphite px-3 py-2 font-mono text-xs ticket-notch bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        ))}
        {services.length === 0 && <p className="text-steel">No hay servicios registrados.</p>}
      </div>
    </div>
  );
}
