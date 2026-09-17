"use client";

import { Fragment, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Product } from "@/types";

type MovementType = "ENTRADA" | "SALIDA" | "AJUSTE";

export default function InventarioDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<MovementType>("ENTRADA");
  const [reason, setReason] = useState("");
  const [cost, setCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api.get("/products?onlyActive=false").then((res) => setProducts(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openForm(id: string) {
    setOpenId(openId === id ? null : id);
    setQuantity("");
    setReason("");
    setCost("");
    setSupplier("");
    setType("ENTRADA");
    setError("");
  }

  async function submitMovement(id: string) {
    setError("");
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("Ingresa una cantidad válida.");
      return;
    }
    try {
      await api.post(`/products/${id}/stock`, {
        quantity: qty,
        type,
        reason,
        ...(type === "ENTRADA" && cost ? { cost: Number(cost) } : {}),
        ...(type === "ENTRADA" && supplier.trim() ? { supplier: supplier.trim() } : {}),
      });
      setOpenId(null);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo registrar el movimiento.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-6">Inventario</h1>

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Stock actual</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Movimiento</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-steel text-center">Cargando...</td></tr>
            )}
            {!loading && products.map((p) => {
              const low = p.stock <= p.minStock;
              const open = openId === p.id;
              return (
                <Fragment key={p.id}>
                  <tr className="border-b border-steel/20">
                    <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-graphite">{p.name}</td>
                    <td className={`px-4 py-3 font-mono ${low ? "text-rust font-semibold" : ""}`}>
                      {p.stock} {low && <span className="ml-1 text-[10px] border border-rust px-1">bajo</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-steel">{p.minStock}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openForm(p.id)}
                        className="text-xs font-mono border border-graphite px-2 py-1"
                      >
                        {open ? "Cerrar" : "Ajustar"}
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-steel-100 border-b border-steel/20">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="block text-xs font-mono text-steel mb-1">Tipo</label>
                            <select
                              value={type}
                              onChange={(e) => setType(e.target.value as MovementType)}
                              className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
                            >
                              <option value="ENTRADA">Entrada</option>
                              <option value="SALIDA">Salida</option>
                              <option value="AJUSTE">Ajuste (fija el total)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-mono text-steel mb-1">Cantidad</label>
                            <input
                              type="number"
                              min={1}
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              className="w-28 border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
                            />
                          </div>
                          <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-mono text-steel mb-1">Motivo (opcional)</label>
                            <input
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Ej: compra a proveedor, devolución..."
                              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
                            />
                          </div>
                          {type === "ENTRADA" && (
                            <>
                              <div>
                                <label className="block text-xs font-mono text-steel mb-1">Costo unitario</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={cost}
                                  onChange={(e) => setCost(e.target.value)}
                                  placeholder={String(p.cost ?? "")}
                                  className="w-32 border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-mono text-steel mb-1">Proveedor</label>
                                <input
                                  value={supplier}
                                  onChange={(e) => setSupplier(e.target.value)}
                                  placeholder={p.supplier || "Quién envía la mercancía"}
                                  className="w-48 border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
                                />
                              </div>
                            </>
                          )}
                          <button
                            onClick={() => submitMovement(p.id)}
                            className="bg-copper text-white px-4 py-2 text-sm font-medium ticket-notch"
                          >
                            Registrar
                          </button>
                        </div>
                        {error && <p className="text-rust text-xs mt-2">{error}</p>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
