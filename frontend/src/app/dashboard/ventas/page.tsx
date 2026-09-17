"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Order, Product, ProductVariant, User } from "@/types";
import { formatCop } from "@/lib/money";
import { useAuth } from "@/context/AuthContext";
import { ProductPickerModal } from "@/components/ProductPickerModal";

type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

interface CartLine {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  recommended: number;
  minPrice: number;
  serialNumber: string;
}

const PAYMENTS: { id: PaymentMethod; label: string }[] = [
  { id: "CASH", label: "Efectivo" },
  { id: "CARD", label: "Tarjeta" },
  { id: "TRANSFER", label: "Transferencia" },
];

function linePricing(product: Product, variant?: ProductVariant) {
  const recommended = variant
    ? variant.recommendedPrice ?? variant.effectivePrice
    : product.recommendedPrice ?? product.effectivePrice ?? product.price;
  const minPrice = variant
    ? variant.minPrice ?? product.floorPrice ?? product.minPrice ?? 0
    : product.floorPrice ?? product.minPrice ?? 0;
  return { recommended, minPrice };
}

export default function VentasDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftProduct, setDraftProduct] = useState<Product | null>(null);
  const [draftVariant, setDraftVariant] = useState<ProductVariant | undefined>();
  const [customerId, setCustomerId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [qty, setQty] = useState("1");
  const [serial, setSerial] = useState("");
  const [soldPrice, setSoldPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const customers = people;
  const staff = people.filter((p) => p.role !== "CLIENTE");
  const technicians = people.filter((p) => p.role === "TECNICO" || p.role === "ADMIN");

  function load() {
    setLoading(true);
    Promise.all([api.get("/orders"), api.get("/users/assignable")])
      .then(([o, u]) => {
        setOrders(o.data);
        setPeople(u.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (user) setSellerId((prev) => prev || user.id);
  }, [user]);

  const draftPricing = useMemo(
    () => (draftProduct ? linePricing(draftProduct, draftVariant) : null),
    [draftProduct, draftVariant]
  );

  function onPick(product: Product, variant?: ProductVariant) {
    const { recommended } = linePricing(product, variant);
    setDraftProduct(product);
    setDraftVariant(variant);
    setSoldPrice(String(recommended));
    setQty("1");
    setSerial("");
    setError("");
  }

  function addToCart() {
    if (!draftProduct || !draftPricing) {
      setError("Busca y selecciona un producto.");
      return;
    }
    const quantity = Number(qty);
    const unitPrice = Number(soldPrice);
    const serialNumber = serial.trim();
    if (!quantity || quantity <= 0) {
      setError("Indica una cantidad válida.");
      return;
    }
    if (!serialNumber) {
      setError("El número de serial es obligatorio.");
      return;
    }
    if (!unitPrice || unitPrice < draftPricing.minPrice) {
      setError(`El precio de venta no puede ser menor a ${formatCop(draftPricing.minPrice)}.`);
      return;
    }
    const label = draftVariant ? `${draftProduct.name} · ${draftVariant.name}` : draftProduct.name;
    setCart((prev) => [
      ...prev,
      {
        productId: draftProduct.id,
        variantId: draftVariant?.id,
        name: label,
        sku: draftVariant?.sku || draftProduct.sku,
        quantity,
        unitPrice,
        recommended: draftPricing.recommended,
        minPrice: draftPricing.minPrice,
        serialNumber,
      },
    ]);
    setDraftProduct(null);
    setDraftVariant(undefined);
    setSoldPrice("");
    setQty("1");
    setSerial("");
    setError("");
  }

  function removeLine(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitOrder() {
    if (cart.length === 0) return;
    if (!customerId) {
      setError("Selecciona el cliente de la venta.");
      return;
    }
    if (!sellerId) {
      setError("Selecciona el vendedor o técnico que registra la venta.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/orders", {
        customerId,
        sellerId,
        technicianId: technicianId || undefined,
        paymentMethod,
        items: cart.map((c) => ({
          productId: c.productId,
          variantId: c.variantId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          serialNumber: c.serialNumber,
        })),
      });
      setCart([]);
      setCustomerId("");
      setTechnicianId("");
      setPaymentMethod("CASH");
      load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "No se pudo registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  }

  const cartTotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const statusColor: Record<string, string> = {
    PAGADO: "text-solder border-solder",
    PENDIENTE: "text-copper border-copper",
    ENVIADO: "text-copper border-copper",
    ENTREGADO: "text-solder border-solder",
    CANCELADO: "text-rust border-rust",
  };

  const paymentLabel: Record<string, string> = {
    CASH: "Efectivo",
    CARD: "Tarjeta",
    TRANSFER: "Transferencia",
    MOCK: "Otro",
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-6">Ventas</h1>

      <div className="border-2 border-graphite ticket-notch bg-white p-4 mb-8">
        <p className="font-mono text-xs text-steel uppercase mb-3">Venta rápida</p>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Cliente</label>
            <select
              required
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setError("");
              }}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              <option value="">Selecciona un cliente</option>
              {customers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Vendedor / técnico que vende</label>
            <select
              required
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              <option value="">Selecciona quién registra la venta</option>
              {staff.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Técnico de apoyo (opcional)</label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              <option value="">Ninguno</option>
              {technicians.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Forma de pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              {PAYMENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-steel/20 pt-4 mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="border-2 border-graphite px-4 py-2 text-sm font-medium ticket-notch"
            >
              Buscar producto por nombre o SKU
            </button>
            {draftProduct && (
              <p className="text-sm text-graphite">
                {draftProduct.name}
                {draftVariant ? ` · ${draftVariant.name}` : ""}{" "}
                <span className="font-mono text-xs text-steel">
                  ({draftVariant?.sku || draftProduct.sku})
                </span>
              </p>
            )}
          </div>

          {draftProduct && draftPricing && (
            <div className="grid md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-mono text-steel mb-1">Serial</label>
                <input
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="S/N del equipo"
                  className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-steel mb-1">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-steel mb-1">Precio de venta</label>
                <input
                  type="number"
                  min={draftPricing.minPrice}
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch font-mono"
                />
                <p className="text-[11px] text-steel mt-1">
                  Recomendado {formatCop(draftPricing.recommended)} · mínimo {formatCop(draftPricing.minPrice)}
                </p>
              </div>
              <div className="flex items-end">
                <button onClick={addToCart} className="w-full border-2 border-graphite px-4 py-2 text-sm font-medium ticket-notch">
                  + Agregar
                </button>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="mb-4">
            {cart.map((line, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-steel/20 gap-3">
                <div>
                  <p>
                    {line.name} × {line.quantity}
                  </p>
                  <p className="font-mono text-[11px] text-steel">
                    S/N {line.serialNumber} · vendido {formatCop(line.unitPrice)} · rec. {formatCop(line.recommended)} ·
                    mín. {formatCop(line.minPrice)}
                  </p>
                </div>
                <button onClick={() => removeLine(i)} className="text-rust text-xs font-mono">
                  quitar
                </button>
              </div>
            ))}
            <p className="text-right font-mono text-sm mt-2">Total {formatCop(cartTotal)}</p>
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

      <ProductPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onPick} />

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Ítems</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-steel text-center">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-steel text-center">
                  No hay ventas registradas.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-steel/20">
                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{o.customer?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs">
                  {o.seller?.name ?? "—"}
                  {o.technician ? <span className="block text-steel">Téc. {o.technician.name}</span> : null}
                </td>
                <td className="px-4 py-3 text-xs">{paymentLabel[o.paymentMethod] || o.paymentMethod}</td>
                <td className="px-4 py-3 text-steel text-xs">
                  {o.items.map((item) => (
                    <p key={item.id}>
                      {item.product?.name ?? "Producto"} {item.serialNumber ? `· ${item.serialNumber}` : ""}
                    </p>
                  ))}
                </td>
                <td className="px-4 py-3 font-mono">{formatCop(Number(o.total))}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-0.5 border ${statusColor[o.status] || "border-steel text-steel"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-steel text-xs">{new Date(o.createdAt).toLocaleDateString("es-CO")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
