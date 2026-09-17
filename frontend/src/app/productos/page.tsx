"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { api } from "@/lib/api";
import { Product } from "@/types";

function cover(p: Product) {
  return p.images?.[0]?.url || p.imageUrl;
}

function priceLabel(p: Product) {
  const rec = p.recommendedPrice ?? p.effectivePrice ?? p.price;
  const hasSale = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
  return { rec, list: p.price, hasSale };
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="font-mono text-xs text-steel uppercase mb-2">Catálogo</p>
        <h1 className="font-display text-4xl text-graphite mb-8">Productos</h1>
        {loading && <p className="text-steel">Cargando catálogo...</p>}
        {!loading && products.length === 0 && (
          <p className="text-steel">Aún no hay productos publicados.</p>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const { rec, list, hasSale } = priceLabel(p);
            const img = cover(p);
            return (
              <Link
                key={p.id}
                href={`/productos/${p.id}`}
                className="border-2 border-graphite ticket-notch bg-white overflow-hidden hover:border-copper"
              >
                <div className="h-44 bg-steel-100 flex items-center justify-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-mono text-xs text-steel">SIN IMAGEN</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10px] text-steel">{p.sku}</p>
                  <h2 className="font-display text-xl text-graphite mt-1">{p.name}</h2>
                  <p className="text-steel text-sm mt-1">{p.brand}</p>
                  <div className="mt-3 font-mono">
                    {hasSale && (
                      <span className="text-steel line-through mr-2 text-xs">
                        ${list.toLocaleString("es-CO")}
                      </span>
                    )}
                    <span className="text-copper font-semibold">
                      ${rec.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <p className="text-xs text-steel mt-2">{p.stock} disponibles</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
