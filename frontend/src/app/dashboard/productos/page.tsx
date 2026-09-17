"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Product } from "@/types";
import { displayPrice, formatCop } from "@/lib/money";

interface VariantDraft {
  id?: string;
  name: string;
  sku: string;
  price: string;
  salePrice: string;
  minPrice: string;
  stock: string;
}

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  price: "",
  salePrice: "",
  minPrice: "",
  cost: "",
  supplier: "",
  stock: "0",
  imagesText: "",
};

export default function ProductosDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  function load() {
    setLoading(true);
    api
      .get("/products?onlyActive=false")
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setVariants([]);
    setError("");
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      salePrice: p.salePrice != null ? String(p.salePrice) : "",
      minPrice: p.minPrice != null ? String(p.minPrice) : "",
      cost: p.cost != null ? String(p.cost) : "",
      supplier: p.supplier || "",
      stock: String(p.stock),
      imagesText: (p.images || []).map((i) => i.url).join("\n") || p.imageUrl || "",
    });
    setVariants(
      (p.variants || []).map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: String(v.price),
        salePrice: v.salePrice != null ? String(v.salePrice) : "",
        minPrice: v.minPrice != null ? String(v.minPrice) : "",
        stock: String(v.stock),
      }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function payload() {
    const images = form.imagesText
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      minPrice: Number(form.minPrice),
      cost: Number(form.cost),
      supplier: form.supplier.trim(),
      stock: Number(form.stock) || 0,
      images,
      imageUrl: images[0],
      variants: variants
        .filter((v) => v.name.trim())
        .map((v) => ({
          id: v.id,
          name: v.name.trim(),
          sku: v.sku.trim() || `${form.sku}-${v.name.trim().replace(/\s+/g, "-").toUpperCase()}`,
          price: Number(v.price) || Number(form.price),
          salePrice: v.salePrice ? Number(v.salePrice) : null,
          minPrice: v.minPrice ? Number(v.minPrice) : Number(form.minPrice) || null,
          stock: Number(v.stock) || 0,
        })),
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const body = payload();
      if (editingId) {
        await api.put(`/products/${editingId}`, body);
      } else {
        await api.post("/products", body);
      }
      resetForm();
      load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "No se pudo guardar el producto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-graphite mb-2">Productos</h1>
        <p className="font-mono text-xs text-steel mb-6">costo · proveedor · precio recomendado y mínimo</p>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-4">
          {editingId ? "Editar producto" : "Nuevo producto"}
        </p>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-mono text-steel mb-1">ID producto (SKU)</label>
            <input
              required
              minLength={2}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Nombre</label>
            <input
              required
              minLength={2}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-steel mb-1">Descripción</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Precio recomendado</label>
            <input
              required
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Precio mínimo de venta</label>
            <input
              required
              type="number"
              min={0}
              value={form.minPrice}
              onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Precio oferta (opcional)</label>
            <input
              type="number"
              min={1}
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Costo (lo que pagaste al proveedor)</label>
            <input
              required
              type="number"
              min={0}
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Proveedor</label>
            <input
              required
              minLength={2}
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="Ej: Mayorista Bogotá"
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Stock (si no hay variaciones)</label>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-steel mb-1">Imágenes (una URL por línea)</label>
            <textarea
              rows={3}
              value={form.imagesText}
              onChange={(e) => setForm({ ...form, imagesText: e.target.value })}
              placeholder="https://…"
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-graphite">Variaciones de color o modelo</p>
            <button
              type="button"
              onClick={() =>
                setVariants((prev) => [
                  ...prev,
                  { name: "", sku: "", price: form.price, salePrice: "", minPrice: form.minPrice, stock: "0" },
                ])
              }
              className="text-sm text-copper font-medium"
            >
              + Agregar variación
            </button>
          </div>
          <p className="text-xs text-steel mb-3">
            Cada color o modelo puede tener su propio precio, oferta y stock. En el catálogo el precio cambia al elegir la variación.
          </p>
          {variants.map((v, i) => (
            <div key={v.id || i} className="grid md:grid-cols-6 gap-2 mb-2">
              <input
                placeholder="Color / modelo"
                value={v.name}
                onChange={(e) =>
                  setVariants((prev) => prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))
                }
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                placeholder="SKU variación"
                value={v.sku}
                onChange={(e) =>
                  setVariants((prev) => prev.map((row, idx) => (idx === i ? { ...row, sku: e.target.value } : row)))
                }
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
              />
              <input
                type="number"
                min={1}
                placeholder="Precio"
                value={v.price}
                onChange={(e) =>
                  setVariants((prev) => prev.map((row, idx) => (idx === i ? { ...row, price: e.target.value } : row)))
                }
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
              />
              <input
                type="number"
                min={0}
                placeholder="Mínimo"
                value={v.minPrice}
                onChange={(e) =>
                  setVariants((prev) => prev.map((row, idx) => (idx === i ? { ...row, minPrice: e.target.value } : row)))
                }
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
              />
              <input
                type="number"
                min={1}
                placeholder="Oferta"
                value={v.salePrice}
                onChange={(e) =>
                  setVariants((prev) => prev.map((row, idx) => (idx === i ? { ...row, salePrice: e.target.value } : row)))
                }
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) =>
                    setVariants((prev) => prev.map((row, idx) => (idx === i ? { ...row, stock: e.target.value } : row)))
                  }
                  className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-rust text-xs"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-rust text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-shop disabled:opacity-50">
            {submitting ? "Guardando…" : editingId ? "Actualizar producto" : "Publicar producto"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-ghost">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-steel">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Costo / proveedor</th>
              <th className="px-4 py-3">Variaciones</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-steel text-center">
                  Cargando...
                </td>
              </tr>
            )}
            {products.map((p) => {
              const { list, effective, onSale } = displayPrice(p);
              return (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-graphite">{p.name}</p>
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="mt-1 h-10 w-10 object-contain bg-white rounded border border-slate-100" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {onSale ? (
                      <>
                        <span className="text-rust">{formatCop(effective)}</span>{" "}
                        <span className="line-through text-steel">{formatCop(list)}</span>
                      </>
                    ) : (
                      formatCop(list)
                    )}
                    {p.minPrice != null && (
                      <p className="text-steel">mín. {formatCop(Number(p.minPrice))}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.cost != null ? formatCop(Number(p.cost)) : "—"}
                    {p.supplier ? <p className="text-steel font-sans">{p.supplier}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-steel text-xs">{p.variants?.length || 0}</td>
                  <td className="px-4 py-3 font-mono">{p.stock}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => startEdit(p)} className="text-copper text-sm">
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
