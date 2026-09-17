"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ServiceOrder, ServiceStatus, User } from "@/types";
import { CreateClienteForm } from "@/components/CreateClienteForm";
import { PhotoUploader } from "@/components/PhotoUploader";

const STATUS_OPTIONS: ServiceStatus[] = [
  "RECIBIDO",
  "DIAGNOSTICO",
  "COTIZACION",
  "ESPERANDO_APROBACION",
  "EN_REPARACION",
  "LISTO",
  "ENTREGADO",
  "CANCELADO",
];

const emptyReception = {
  customerId: "",
  deviceName: "",
  brand: "",
  model: "",
  serialNumber: "",
  accessories: "",
  physicalCondition: "",
  problem: "",
  notes: "",
};

export default function ServiciosDashboardPage() {
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyReception);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [createdCode, setCreatedCode] = useState("");

  function load() {
    Promise.all([api.get("/services"), api.get("/users/assignable")]).then(([s, u]) => {
      setServices(s.data);
      setCustomers(u.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: ServiceStatus) {
    await api.put(`/services/${id}/status`, { status });
    load();
  }

  async function downloadPdf(service: ServiceOrder, type: "orden" | "factura" | "entrega" | "diagnostico") {
    const res = await api.get(`/services/${service.id}/pdf`, { params: { type }, responseType: "blob" });
    const href = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${type}-${service.trackingCode}.pdf`;
    link.click();
    URL.revokeObjectURL(href);
  }

  async function createService(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId) {
      setError("Selecciona el cliente dueño del equipo.");
      return;
    }
    setSubmitting(true);
    setError("");
    setCreatedCode("");
    try {
      const { data } = await api.post<ServiceOrder>("/services", {
        ...form,
        brand: form.brand || undefined,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        accessories: form.accessories || undefined,
        physicalCondition: form.physicalCondition || undefined,
        notes: form.notes || undefined,
        photoUrls,
      });
      setForm(emptyReception);
      setPhotoUrls([]);
      setCreatedCode(data.trackingCode);
      load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "No se pudo crear el servicio.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-graphite mb-2">Recepción de equipos</h1>
      <p className="font-mono text-xs text-steel mb-6">orden de servicio · fotos · PDF</p>

      {createdCode && (
        <div className="mb-6 border-2 border-solder bg-white p-4 ticket-notch">
          <p className="text-sm text-graphite">Orden creada. Código de seguimiento:</p>
          <p className="font-mono text-2xl text-copper mt-1">{createdCode}</p>
          <p className="text-xs text-steel mt-1">El cliente puede consultar en /reparaciones/{createdCode}</p>
        </div>
      )}

      {showNewCliente && (
        <CreateClienteForm
          title="Registrar cliente atendido"
          onCreated={(user) => {
            setCustomers((prev) => (prev.some((c) => c.id === user.id) ? prev : [...prev, user]));
            setForm((f) => ({ ...f, customerId: user.id }));
            setShowNewCliente(false);
          }}
        />
      )}

      <form onSubmit={createService} className="border-2 border-graphite ticket-notch bg-white p-4 mb-8">
        <p className="font-mono text-xs text-steel uppercase mb-3">Nueva orden de servicio</p>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono text-steel">Cliente</label>
              <button type="button" onClick={() => setShowNewCliente((open) => !open)} className="text-xs text-copper font-medium">
                {showNewCliente ? "Cerrar formulario" : "El cliente no está registrado"}
              </button>
            </div>
            <select
              required
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              <option value="">Selecciona un cliente activo</option>
              {customers
                .filter((u) => u.role === "CLIENTE")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Equipo</label>
            <input
              required
              minLength={2}
              value={form.deviceName}
              onChange={(e) => setForm({ ...form, deviceName: e.target.value })}
              placeholder="Ej. Portátil, All-in-one, PC de escritorio"
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Marca</label>
            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Lenovo, HP, Dell…"
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Modelo</label>
            <input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="ThinkPad T14"
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Serial</label>
            <input
              required
              minLength={3}
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-steel mb-1">Accesorios entregados</label>
            <input
              value={form.accessories}
              onChange={(e) => setForm({ ...form, accessories: e.target.value })}
              placeholder="Cargador, maletín, mouse…"
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-steel mb-1">Estado físico</label>
            <textarea
              value={form.physicalCondition}
              onChange={(e) => setForm({ ...form, physicalCondition: e.target.value })}
              rows={2}
              placeholder="Rayones, golpe en esquina, pantalla ok…"
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-steel mb-1">Problema reportado</label>
            <textarea
              required
              minLength={5}
              value={form.problem}
              onChange={(e) => setForm({ ...form, problem: e.target.value })}
              rows={3}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-steel mb-1">Observaciones</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div className="md:col-span-2">
            <PhotoUploader folder="techcare/servicios" urls={photoUrls} onChange={setPhotoUrls} label="Fotos de recepción" />
          </div>
        </div>
        {error && <p className="text-rust text-sm mb-3">{error}</p>}
        <button type="submit" disabled={submitting} className="bg-copper text-white px-5 py-2.5 text-sm font-medium ticket-notch disabled:opacity-50">
          {submitting ? "Registrando..." : "Registrar recepción"}
        </button>
      </form>

      <div className="grid gap-4">
        {services.map((s) => (
          <div key={s.id} className="border-2 border-graphite ticket-notch bg-white p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="font-mono text-sm text-copper w-32 shrink-0">{s.trackingCode}</div>
              <div className="flex-1 min-w-[180px]">
                <p className="font-medium text-graphite">
                  {s.deviceName}
                  {s.brand ? ` · ${s.brand}` : ""}
                  {s.model ? ` ${s.model}` : ""}
                </p>
                <p className="text-steel text-sm">{s.problem}</p>
                {s.serialNumber && <p className="font-mono text-[11px] text-steel">S/N {s.serialNumber}</p>}
                {s.customer?.name && <p className="text-steel text-xs mt-1">Cliente: {s.customer.name}</p>}
              </div>
              <select
                value={s.status}
                onChange={(e) => updateStatus(s.id, e.target.value as ServiceStatus)}
                className="border-2 border-graphite px-3 py-2 font-mono text-xs ticket-notch bg-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            {s.photos && s.photos.length > 0 && (
              <div className="flex gap-2 mt-3">
                {s.photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={photo.imageUrl} src={photo.imageUrl} alt="" className="h-12 w-12 object-cover rounded border" />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <button type="button" onClick={() => downloadPdf(s, "orden")} className="text-xs font-mono border border-graphite px-2 py-1">
                PDF orden
              </button>
              <button type="button" onClick={() => downloadPdf(s, "diagnostico")} className="text-xs font-mono border border-graphite px-2 py-1">
                PDF diagnóstico
              </button>
              <button type="button" onClick={() => downloadPdf(s, "factura")} className="text-xs font-mono border border-graphite px-2 py-1">
                PDF factura
              </button>
              <button type="button" onClick={() => downloadPdf(s, "entrega")} className="text-xs font-mono border border-graphite px-2 py-1">
                PDF entrega
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && <p className="text-steel">No hay servicios registrados.</p>}
      </div>
    </div>
  );
}
