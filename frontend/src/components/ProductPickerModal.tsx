"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Product, ProductVariant } from "@/types";
import { formatCop } from "@/lib/money";

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (product: Product, variant?: ProductVariant) => void;
}

export function ProductPickerModal({ open, onClose, onPick }: ProductPickerModalProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Product | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setPicked(null);
    setLoading(true);
    api
      .get("/products")
      .then((res) => setResults(res.data))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .get("/products", { params: q.trim() ? { q: q.trim() } : {} })
        .then((res) => setResults(res.data))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [q, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white border-2 border-graphite ticket-notch shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-200">
          <p className="font-display text-lg text-graphite">Buscar producto</p>
          <p className="text-xs text-steel mb-2">Nombre o SKU</p>
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPicked(null);
            }}
            placeholder="Ej: RTX, GPU-RTX5070…"
            className="w-full border-2 border-graphite px-3 py-2 text-sm ticket-notch"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {loading && <p className="px-4 py-6 text-sm text-steel">Buscando…</p>}
          {!loading && results.length === 0 && (
            <p className="px-4 py-6 text-sm text-steel">No hay productos con esa búsqueda.</p>
          )}
          {!picked &&
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (p.variants && p.variants.length > 0) {
                    setPicked(p);
                    return;
                  }
                  onPick(p);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50"
              >
                <p className="text-sm font-medium text-graphite">{p.name}</p>
                <p className="font-mono text-[11px] text-steel">
                  {p.sku} · rec. {formatCop(p.recommendedPrice ?? p.effectivePrice ?? p.price)} · mín.{" "}
                  {formatCop(p.floorPrice ?? p.minPrice ?? 0)} · {p.stock} disp.
                </p>
              </button>
            ))}
          {picked && (
            <div className="p-4">
              <button type="button" className="text-xs text-copper mb-3" onClick={() => setPicked(null)}>
                ← Volver
              </button>
              <p className="text-sm font-medium mb-2">{picked.name} — elige color o modelo</p>
              {picked.variants!.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    onPick(picked, v);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 mb-2 border border-slate-200 rounded-md hover:border-copper"
                >
                  <p className="text-sm">{v.name}</p>
                  <p className="font-mono text-[11px] text-steel">
                    {v.sku} · rec. {formatCop(v.recommendedPrice ?? v.effectivePrice)} · mín.{" "}
                    {formatCop(v.minPrice ?? picked.floorPrice ?? 0)} · {v.stock} disp.
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-200">
          <button type="button" onClick={onClose} className="text-sm text-steel">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
