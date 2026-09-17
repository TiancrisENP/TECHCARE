"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PublicHeader } from "@/components/PublicHeader";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      if (!axiosErr.response) {
        setError("No hay conexión con el servidor. Verifica que el backend esté activo.");
      } else {
        setError(axiosErr.response.data?.message || "Email o contraseña incorrectos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-copper mb-2">acceso</p>
        <h1 className="font-display text-3xl font-semibold text-graphite mb-8">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col gap-4">
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
            <label className="text-sm font-medium text-graphite">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 bg-steel-100/50"
            />
          </div>
          {error && <p className="text-rust text-sm">{error}</p>}
          <button disabled={loading} className="btn-shop mt-1 disabled:opacity-60">
            {loading ? "Validando…" : "Entrar"}
          </button>
        </form>
        <p className="text-sm text-steel mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-copper font-medium">
            Crear una
          </Link>
        </p>
      </main>
    </>
  );
}
