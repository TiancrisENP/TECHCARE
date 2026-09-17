"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Order, Product, User } from "@/types";

export default function VentasDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState("1");
  const [serial, setSerial] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const customers = people.filter((p) => p.role === "CLIENTE");
  const staff = people.filter((p) => p.role !== "CLIENTE");
  const techs = people.filter((p) => p.role === "TECNICO" || p.role === "ADMIN");
  const product = products.find((p) => p.id === productId);
  const variants = product?.variants ?? [];
  const variant = variants.find((v) => v.id === variantId);

  const minPrice = useMemo(() => {
    if (variant) return variant.minPrice ?? product?.floorPrice ?? 0;
    return product?.floorPrice ?? product?.minPrice ?? 0;
  }, [variant, product]);

  const suggested = variant?.recommendedPrice ?? product?.recommendedPrice ?? product?.price ?? 0;

  function load() {
    setLoading(true);
    Promise.all([api.get("/orders"), api.get("/products"), api.get("/users/assignable")])
      .then(([o, p, u]) => {
        setOrders(o.data);
        setProducts(p.data);
        setPeople(u.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (user?.id && !sellerId) setSellerId(user.id);
  }, [user, sellerId]);

  useEffect(() => {
    setVariantId(variants.length === 1 ? variants[0].id : "");
    setUnitPrice(suggested ? String(suggested) : "");
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (suggested) setUnitPrice(String(suggested));
  }, [variantId, suggested]);

  async function submitOrder() {
    setError("");
    if (!customerId) return setError("Selecciona el cliente de la venta.");
    if (!sellerId) return setError("Selecciona quién registra la venta.");
    if (!productId) return setError("Selecciona un producto.");
    if (variants.length > 1 && !variantId) return setError("Selecciona color o modelo.");
    if (!serial.trim() || serial.trim().length < 3) return setError("Indica el número de serial del equipo.");
    const price = Number(unitPrice);
    if (!price || price <= 0) return setError("Indica el precio de venta.");
    if (price + 1e-6 < minPrice) {
      return setError(`El precio no puede ser menor al mínimo ($${minPrice.toLocaleString("es-CO")}).`);
    }

    setSubmitting(true);
    try {
      await api.post("/orders", {
        customerId,
        sellerId,
        technicianId: technicianId || null,
        paymentMethod,
        items: [{
          productId,
          variantId: variantId || undefined,
          quantity: Number(qty) || 1,
          unitPrice: price,
          serialNumber: serial.trim(),
        }],
      });
      setProductId("");
      setVariantId("");
      setSerial("");
      setQty("1");
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
        <p className="font-mono text-xs text-steel uppercase mb-3">Registrar venta</p>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Cliente</label>
            <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white">
              <option value="">Selecciona un cliente</option>
              {customers.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Vendedor / técnico que registra</label>
            <select required value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white">
              <option value="">Selecciona staff</option>
              {staff.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Técnico asociado (opcional)</label>
            <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white">
              <option value="">Ninguno</option>
              {techs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Pago</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "CARD" | "TRANSFER")} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white">
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Producto</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white">
              <option value="">Selecciona un producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.stock} disp.)</option>
              ))}
            </select>
          </div>
          {variants.length > 0 && (
            <div>
              <label className="block text-xs font-mono text-steel mb-1">Color / modelo</label>
              <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white">
                <option value="">{variants.length > 1 ? "Selecciona variación" : variants[0].name}</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} — {v.stock} disp.</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Serial del equipo</label>
            <input value={serial} onChange={(e) => setSerial(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch font-mono" />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Cantidad</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">
              Precio de venta (mín. ${minPrice.toLocaleString("es-CO")})
            </label>
            <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          </div>
        </div>

        {error && <p className="text-rust text-sm mb-2">{error}</p>}
        <button onClick={submitOrder} disabled={submitting} className="bg-copper text-white px-5 py-2.5 text-sm font-medium ticket-notch disabled:opacity-50">
          {submitting ? "Registrando..." : "Registrar venta"}
        </button>
      </div>

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Ítems</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
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
                <td className="px-4 py-3 text-steel">{o.seller?.name ?? "—"}</td>
                <td className="px-4 py-3 text-steel">{o.items.length} producto(s)</td>
                <td className="px-4 py-3 font-mono">${Number(o.total).toLocaleString("es-CO")}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-0.5 border ${statusColor[o.status] || "border-steel text-steel"}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
