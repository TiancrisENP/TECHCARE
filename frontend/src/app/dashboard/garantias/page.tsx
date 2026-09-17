"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Product, User, Warranty, WarrantyStatus } from "@/types";
import { PhotoUploader } from "@/components/PhotoUploader";

const STATUS_OPTIONS: WarrantyStatus[] = ["PENDIENTE", "EN_REVISION", "APROBADA", "RECHAZADA", "SOLUCIONADA"];

const statusColor: Record<WarrantyStatus, string> = {
  PENDIENTE: "text-copper border-copper",
  EN_REVISION: "text-copper border-copper",
  APROBADA: "text-solder border-solder",
  SOLUCIONADA: "text-solder border-solder",
  RECHAZADA: "text-rust border-rust",
};

export default function GarantiasDashboardPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [problem, setProblem] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  function load() {
    setLoading(true);
    Promise.all([
      api.get("/warranties"),
      api.get("/products"),
      api.get("/users/assignable"),
    ])
      .then(([w, p, u]) => {
        setWarranties(w.data);
        setProducts(p.data);
        setCustomers(u.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: WarrantyStatus) {
    await api.put(`/warranties/${id}/status`, { status });
    load();
  }

  async function createWarranty(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Selecciona el usuario de la garantía.");
      return;
    }
    if (!productId) {
      setError("Selecciona el producto en garantía.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/warranties", {
        customerId,
        productId,
        problem,
        purchaseDate,
        evidenceUrls: photoUrls,
      });
      setCustomerId("");
      setProductId("");
      setProblem("");
      setPurchaseDate("");
      setPhotoUrls([]);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo registrar la garantía.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-6">Garantías</h1>

      <form onSubmit={createWarranty} className="border-2 border-graphite ticket-notch bg-white p-4 mb-8">
        <p className="font-mono text-xs text-steel uppercase mb-3">Nueva garantía</p>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div>
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
            <label className="block text-xs font-mono text-steel mb-1">Producto</label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              <option value="">Selecciona un producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Fecha de compra</label>
            <input
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
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
          <div className="md:col-span-2">
            <PhotoUploader folder="techcare/garantias" urls={photoUrls} onChange={setPhotoUrls} label="Evidencias (fotografías)" />
          </div>
        </div>
        {error && <p className="text-rust text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-copper text-white px-5 py-2.5 text-sm font-medium ticket-notch disabled:opacity-50"
        >
          {submitting ? "Registrando..." : "Registrar garantía"}
        </button>
      </form>

      {loading && <p className="text-steel">Cargando...</p>}
      {!loading && warranties.length === 0 && <p className="text-steel">No hay garantías registradas.</p>}

      <div className="grid gap-4">
        {warranties.map((w) => (
          <div key={w.id} className="border-2 border-graphite ticket-notch bg-white p-4 flex items-center gap-6">
            <div className="font-mono text-xs text-copper w-24 shrink-0">#{w.id.slice(0, 6)}</div>
            <div className="flex-1">
              <p className="font-medium text-graphite">{w.product?.name ?? "Producto"}</p>
              <p className="text-steel text-sm">{w.problem}</p>
              <p className="text-steel text-xs mt-1">
                Comprado: {new Date(w.purchaseDate).toLocaleDateString("es-CO")}
                {w.customer?.name && <> · Cliente: {w.customer.name}</>}
              </p>
              {w.evidence && w.evidence.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {w.evidence.map((ev) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={ev.id} src={ev.imageUrl} alt="" className="h-12 w-12 object-cover rounded border" />
                  ))}
                </div>
              )}
            </div>
            <span className={`text-xs font-mono px-2 py-1 border shrink-0 ${statusColor[w.status]}`}>
              {w.status.replace("_", " ")}
            </span>
            <select
              value={w.status}
              onChange={(e) => updateStatus(w.id, e.target.value as WarrantyStatus)}
              className="border-2 border-graphite px-3 py-2 font-mono text-xs ticket-notch bg-white shrink-0"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
