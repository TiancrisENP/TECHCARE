"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { api } from "@/lib/api";
import { Product } from "@/types";
import { displayPrice, formatCop } from "@/lib/money";

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get("/products", { params: q ? { q } : undefined })
        .then((res) => setProducts(res.data))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-copper mb-2">catálogo</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <h1 className="font-display text-4xl font-semibold text-graphite">Equipos y componentes</h1>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o SKU"
            className="md:w-72 border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
          />
        </div>

        {loading && <p className="text-steel">Cargando inventario…</p>}
        {!loading && products.length === 0 && (
          <p className="text-steel">No hay productos publicados todavía.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const { list, effective, onSale } = displayPrice(p);
            const cover = p.images?.[0]?.url || p.imageUrl;
            const fromVariants = (p.variants || []).length > 0;
            return (
              <Link
                key={p.id}
                href={`/productos/${p.id}`}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-copper/40 transition-colors"
              >
                <div className="aspect-square bg-white p-4 flex items-center justify-center">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={p.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="font-mono text-xs text-steel">{p.sku}</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10px] text-steel mb-1">{p.sku}</p>
                  <h2 className="font-medium text-graphite mb-2">{p.name}</h2>
                  <p className="font-display text-lg font-semibold text-graphite">
                    {fromVariants && <span className="text-xs font-normal text-steel mr-1">desde</span>}
                    {formatCop(fromVariants ? Math.min(...(p.variants || []).map((v) => v.effectivePrice)) : effective)}
                  </p>
                  {onSale && !fromVariants && (
                    <p className="text-xs text-steel line-through">{formatCop(list)}</p>
                  )}
                  {fromVariants && (
                    <p className="text-xs text-steel mt-1">{p.variants!.length} variaciones</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
