"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PublicHeader } from "@/components/PublicHeader";

export default function RegistroPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "No pudimos crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-copper mb-2">nuevo usuario</p>
        <h1 className="font-display text-3xl font-semibold text-graphite mb-8">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-graphite">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 bg-steel-100/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-graphite">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 bg-steel-100/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-graphite">Contraseña (mín. 6)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 bg-steel-100/50"
            />
          </div>
          {error && <p className="text-rust text-sm">{error}</p>}
          <button disabled={loading} className="btn-shop mt-1 disabled:opacity-60">
            {loading ? "Creando…" : "Registrarme"}
          </button>
        </form>
      </main>
    </>
  );
}
