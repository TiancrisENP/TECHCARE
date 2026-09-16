"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order, Product, User } from "@/types";

interface CartLine { productId: string; name: string; quantity: number }

export default function VentasDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [qty, setQty] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api.get("/orders"), api.get("/products"), api.get("/users/assignable")])
      .then(([o, p, u]) => {
        setOrders(o.data);
        setProducts(p.data);
        setCustomers(u.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function addToCart() {
    const product = products.find((p) => p.id === selectedProduct);
    const quantity = Number(qty);
    if (!product || !quantity || quantity <= 0) return;
    setCart((prev) => [...prev, { productId: product.id, name: product.name, quantity }]);
    setSelectedProduct("");
    setQty("1");
  }

  function removeLine(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitOrder() {
    if (cart.length === 0) return;
    if (!customerId) {
      setError("Selecciona el usuario al que se asignará la venta.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/orders", {
        customerId,
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        paymentMethod: "CASH",
      });
      setCart([]);
      setCustomerId("");
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor: Record<string, string> = {
    PAGADO: "text-solder border-solder",
    PENDIENTE: "text-copper border-copper",
    ENVIADO: "text-copper border-copper",
    ENTREGADO: "text-solder border-solder",
    CANCELADO: "text-rust border-rust",
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-6">Ventas</h1>

      <div className="border-2 border-graphite ticket-notch bg-white p-4 mb-8">
        <p className="font-mono text-xs text-steel uppercase mb-3">Venta rápida</p>
        <div className="mb-4">
          <label className="block text-xs font-mono text-steel mb-1">Usuario de la venta</label>
          <select
            required
            value={customerId}
            onChange={(e) => { setCustomerId(e.target.value); setError(""); }}
            className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
          >
            <option value="">Selecciona un usuario activo</option>
            {customers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.email} ({u.role})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-mono text-steel mb-1">Producto</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              <option value="">Selecciona un producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price.toLocaleString("es-CO")} ({p.stock} disp.)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-24 border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <button onClick={addToCart} className="border-2 border-graphite px-4 py-2 text-sm font-medium ticket-notch">
            + Agregar
          </button>
        </div>

        {cart.length > 0 && (
          <div className="mb-4">
            {cart.map((line, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-steel/20">
                <span>{line.name} × {line.quantity}</span>
                <button onClick={() => removeLine(i)} className="text-rust text-xs font-mono">quitar</button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-rust text-sm mb-2">{error}</p>}

        <button
          onClick={submitOrder}
          disabled={cart.length === 0 || submitting}
          className="bg-copper text-white px-5 py-2.5 text-sm font-medium ticket-notch disabled:opacity-50"
        >
          {submitting ? "Registrando..." : "Registrar venta"}
        </button>
      </div>

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Ítems</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-steel text-center">Cargando...</td></tr>}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-steel text-center">No hay ventas registradas.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-steel/20">
                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{o.customer?.name ?? "—"}</td>
                <td className="px-4 py-3 text-steel">{o.items.length} producto(s)</td>
                <td className="px-4 py-3 font-mono">${Number(o.total).toLocaleString("es-CO")}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-0.5 border ${statusColor[o.status] || "border-steel text-steel"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-steel text-xs">
                  {new Date(o.createdAt).toLocaleDateString("es-CO")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
