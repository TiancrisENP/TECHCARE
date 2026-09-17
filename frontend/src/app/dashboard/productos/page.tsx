"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Product } from "@/types";

interface VariantDraft {
  name: string;
  sku: string;
  price: string;
  minPrice: string;
  stock: string;
}

const emptyVariant = (): VariantDraft => ({ name: "", sku: "", price: "", minPrice: "", stock: "0" });

export default function ProductosDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("0");
  const [images, setImages] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  function load() {
    setLoading(true);
    api.get("/products?onlyActive=false").then((res) => setProducts(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const imageList = images.split("\n").map((s) => s.trim()).filter(Boolean);
      await api.post("/products", {
        name,
        sku,
        brand: brand || undefined,
        description: description || undefined,
        supplier,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        minPrice: Number(minPrice),
        cost: Number(cost),
        stock: Number(stock),
        images: imageList,
        variants: variants
          .filter((v) => v.name && v.sku)
          .map((v) => ({
            name: v.name,
            sku: v.sku,
            price: Number(v.price),
            minPrice: v.minPrice ? Number(v.minPrice) : null,
            stock: Number(v.stock) || 0,
          })),
      });
      setOpen(false);
      setName(""); setSku(""); setBrand(""); setDescription(""); setSupplier("");
      setPrice(""); setSalePrice(""); setMinPrice(""); setCost(""); setStock("0"); setImages("");
      setVariants([]);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo crear el producto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-graphite">Productos</h1>
        <button onClick={() => setOpen(!open)} className="bg-copper text-white px-4 py-2 font-medium ticket-notch text-sm">
          {open ? "Cerrar" : "+ Nuevo producto"}
        </button>
      </div>

      {open && (
        <form onSubmit={create} className="border-2 border-graphite ticket-notch bg-white p-4 mb-8 grid md:grid-cols-2 gap-3">
          <input required placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          <input required placeholder="SKU / ID" value={sku} onChange={(e) => setSku(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch font-mono" />
          <input placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          <input required placeholder="Proveedor" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          <input required type="number" placeholder="Precio recomendado" value={price} onChange={(e) => setPrice(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          <input type="number" placeholder="Precio oferta (opcional)" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          <input required type="number" placeholder="Precio mínimo" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          <input required type="number" placeholder="Costo" value={cost} onChange={(e) => setCost(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          <input type="number" placeholder="Stock (si no hay variaciones)" value={stock} onChange={(e) => setStock(e.target.value)} className="border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
          <textarea placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} className="md:col-span-2 border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" rows={2} />
          <textarea placeholder="URLs de imágenes, una por línea" value={images} onChange={(e) => setImages(e.target.value)} className="md:col-span-2 border-2 border-graphite px-2 py-1.5 text-sm ticket-notch font-mono" rows={2} />
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <p className="font-mono text-xs text-steel uppercase">Variaciones (color / RAM)</p>
              <button type="button" onClick={() => setVariants((v) => [...v, emptyVariant()])} className="text-xs font-mono border px-2 py-1">+ Variación</button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 mb-2">
                <input placeholder="Nombre" value={v.name} onChange={(e) => setVariants((all) => all.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="border-2 border-graphite px-2 py-1 text-xs ticket-notch" />
                <input placeholder="SKU" value={v.sku} onChange={(e) => setVariants((all) => all.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))} className="border-2 border-graphite px-2 py-1 text-xs ticket-notch" />
                <input type="number" placeholder="Precio" value={v.price} onChange={(e) => setVariants((all) => all.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="border-2 border-graphite px-2 py-1 text-xs ticket-notch" />
                <input type="number" placeholder="Mínimo" value={v.minPrice} onChange={(e) => setVariants((all) => all.map((x, j) => j === i ? { ...x, minPrice: e.target.value } : x))} className="border-2 border-graphite px-2 py-1 text-xs ticket-notch" />
                <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => setVariants((all) => all.map((x, j) => j === i ? { ...x, stock: e.target.value } : x))} className="border-2 border-graphite px-2 py-1 text-xs ticket-notch" />
              </div>
            ))}
          </div>
          {error && <p className="text-rust text-sm md:col-span-2">{error}</p>}
          <button disabled={submitting} className="bg-copper text-white px-5 py-2 text-sm ticket-notch md:col-span-2 disabled:opacity-50">
            {submitting ? "Guardando..." : "Guardar producto"}
          </button>
        </form>
      )}

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-steel text-center">Cargando...</td></tr>}
            {!loading && products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-steel text-center">No hay productos registrados todavía.</td></tr>
            )}
            {products.map((p) => {
              const low = p.stock <= p.minStock;
              return (
                <tr key={p.id} className="border-b border-steel/20">
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-graphite">{p.name}</td>
                  <td className="px-4 py-3 font-mono">${(p.recommendedPrice ?? p.price).toLocaleString("es-CO")}</td>
                  <td className="px-4 py-3 font-mono text-steel">${(p.floorPrice ?? p.minPrice ?? 0).toLocaleString("es-CO")}</td>
                  <td className={`px-4 py-3 font-mono ${low ? "text-rust font-semibold" : ""}`}>{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono px-2 py-0.5 border ${p.active ? "border-solder text-solder" : "border-steel text-steel"}`}>
                      {p.active ? "activo" : "inactivo"}
                    </span>
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
