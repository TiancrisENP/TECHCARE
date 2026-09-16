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
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-sm px-6 py-20">
        <h1 className="font-display text-3xl text-graphite mb-8">Ingresar</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-graphite">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-graphite px-3 py-2 mt-1 ticket-notch"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-graphite">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-graphite px-3 py-2 mt-1 ticket-notch"
            />
          </div>
          {error && <p className="text-rust text-sm">{error}</p>}
          <button
            disabled={loading}
            className="bg-copper text-white py-3 font-medium ticket-notch disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="text-sm text-steel mt-6">
          ¿No tienes cuenta? <Link href="/registro" className="text-copper">Crear una</Link>
        </p>
      </main>
    </>
  );
}
