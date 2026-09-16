"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Product } from "@/types";

export default function ProductosDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-graphite">Productos</h1>
        <button className="bg-copper text-white px-4 py-2 font-medium ticket-notch text-sm">
          + Nuevo producto
        </button>
      </div>

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-steel text-center">Cargando...</td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-steel text-center">
                  No hay productos registrados todavía.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const low = p.stock <= p.minStock;
              return (
                <tr key={p.id} className="border-b border-steel/20">
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-graphite">{p.name}</td>
                  <td className="px-4 py-3 font-mono">${p.price.toLocaleString("es-CO")}</td>
                  <td className={`px-4 py-3 font-mono ${low ? "text-rust font-semibold" : ""}`}>
                    {p.stock}
                  </td>
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
