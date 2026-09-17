"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";

export default function ReparacionesIndexPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) router.push(`/reparaciones/${code.trim().toUpperCase()}`);
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-copper mb-2">formato TRK-XXXXX</p>
        <h1 className="font-display text-4xl font-semibold text-graphite mb-4">
          Seguimiento de reparación
        </h1>
        <p className="text-ink/70 mb-8 max-w-md">
          Ingresa el código de la orden de servicio para ver el estado del equipo.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TRK-92831"
            className="flex-1 bg-white border border-slate-200 rounded-md px-4 py-3 font-mono"
          />
          <button type="submit" className="btn-shop">
            Consultar
          </button>
        </form>
      </main>
    </>
  );
}
