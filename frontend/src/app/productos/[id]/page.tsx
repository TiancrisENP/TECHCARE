"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { api } from "@/lib/api";
import { Product, ProductVariant } from "@/types";
import { displayPrice, formatCop } from "@/lib/money";

export default function ProductoDetallePage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [variantId, setVariantId] = useState("");
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    api
      .get(`/products/${params.id}`)
      .then((res) => {
        setProduct(res.data);
        if (res.data.variants?.[0]) setVariantId(res.data.variants[0].id);
      })
      .catch(() => setError("No encontramos ese producto."));
  }, [params.id]);

  const variant: ProductVariant | undefined = useMemo(
    () => product?.variants?.find((v) => v.id === variantId),
    [product, variantId]
  );

  const pricing = variant
    ? displayPrice(variant)
    : product
    ? displayPrice(product)
    : null;

  const images = product?.images?.length
    ? product.images.map((i) => i.url)
    : product?.imageUrl
    ? [product.imageUrl]
    : [];
  const shownImage = variant?.imageUrl || images[imageIndex] || images[0];

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/productos" className="text-sm text-copper mb-6 inline-block">
          ← Catálogo
        </Link>

        {error && <p className="text-rust">{error}</p>}
        {!product && !error && <p className="text-steel">Cargando…</p>}

        {product && pricing && (
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="aspect-square bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden mb-3 p-6">
                {shownImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shownImage} alt={product.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="font-mono text-steel">{product.sku}</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((url, i) => (
                    <button
                      key={url + i}
                      type="button"
                      onClick={() => setImageIndex(i)}
                      className={`h-14 w-14 border rounded overflow-hidden ${i === imageIndex ? "border-copper" : "border-slate-200"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-contain bg-white" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="font-mono text-xs text-steel mb-2">{product.sku}</p>
              <h1 className="font-display text-4xl font-semibold text-graphite mb-4">{product.name}</h1>
              {product.description && (
                <p className="text-ink/75 leading-relaxed mb-6">{product.description}</p>
              )}

              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-mono uppercase tracking-widest text-steel mb-2">Color / modelo</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        className={`px-3 py-2 text-sm rounded-md border ${
                          variantId === v.id ? "border-copper bg-sky-50 text-graphite" : "border-slate-200"
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="font-display text-3xl font-semibold text-graphite">{formatCop(pricing.effective)}</p>
                {pricing.onSale && (
                  <p className="text-steel">
                    <span className="line-through mr-2">{formatCop(pricing.list)}</span>
                    <span className="text-rust text-sm">oferta</span>
                  </p>
                )}
              </div>
              <p className="text-sm text-steel">
                Stock: {variant ? variant.stock : product.stock}
                {variant && <span className="ml-2 font-mono text-xs">({variant.sku})</span>}
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
