"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { api } from "@/lib/api";
import { Product } from "@/types";

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/products/${params.id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setError("No encontramos este producto."));
  }, [params.id]);

  const rec = product?.recommendedPrice ?? product?.price ?? 0;
  const img = product?.images?.[0]?.url || product?.imageUrl;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/productos" className="font-mono text-xs text-steel">← Catálogo</Link>
        {error && <p className="text-rust mt-6">{error}</p>}
        {product && (
          <div className="grid md:grid-cols-2 gap-10 mt-6">
            <div className="border-2 border-graphite ticket-notch bg-white h-80 flex items-center justify-center overflow-hidden">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-mono text-xs text-steel">SIN IMAGEN</span>
              )}
            </div>
            <div>
              <p className="font-mono text-xs text-steel">{product.sku}</p>
              <h1 className="font-display text-4xl text-graphite mt-1">{product.name}</h1>
              {product.brand && <p className="text-steel mt-2">{product.brand}</p>}
              <p className="font-mono text-2xl text-copper mt-6">${rec.toLocaleString("es-CO")}</p>
              {product.salePrice && product.salePrice < product.price && (
                <p className="text-steel text-sm line-through">${product.price.toLocaleString("es-CO")}</p>
              )}
              <p className="text-sm text-steel mt-4">{product.description}</p>
              <p className="font-mono text-xs mt-4">Stock: {product.stock}</p>
              {product.variants && product.variants.length > 0 && (
                <div className="mt-6">
                  <p className="font-mono text-xs text-steel uppercase mb-2">Variaciones</p>
                  <ul className="space-y-2">
                    {product.variants.map((v) => (
                      <li key={v.id} className="border border-graphite px-3 py-2 text-sm flex justify-between">
                        <span>{v.name}</span>
                        <span className="font-mono">
                          ${(v.recommendedPrice ?? v.price).toLocaleString("es-CO")} · {v.stock} uds
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
