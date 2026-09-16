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
      <main className="mx-auto max-w-2xl px-6 py-20">
        <p className="font-mono text-xs text-copper mb-2">FORMATO: TRK-XXXXX</p>
        <h1 className="font-display text-4xl text-graphite mb-4">
          Sigue el estado de tu equipo
        </h1>
        <p className="text-steel mb-8 max-w-md">
          Ingresa el código que te dimos al recibir tu equipo para ver en qué
          paso va la reparación.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TRK-92831"
            className="flex-1 border-2 border-graphite px-4 py-3 font-mono ticket-notch bg-white"
          />
          <button
            type="submit"
            className="bg-copper text-white px-6 py-3 font-medium ticket-notch"
          >
            Consultar
          </button>
        </form>
      </main>
    </>
  );
}
