"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function PublicHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="leading-none">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper block mb-1">
            inventario · servicio
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-graphite">
            TECHCARE
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-ink/75">
          <Link href="/productos" className="hover:text-copper">
            Catálogo
          </Link>
          <Link href="/reparaciones" className="hover:text-copper">
            Seguimiento
          </Link>
          <Link href="/contacto" className="hover:text-copper">
            Contacto
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              {user.role !== "CLIENTE" && (
                <Link href="/dashboard" className="font-medium text-copper">
                  Panel
                </Link>
              )}
              <button onClick={logout} className="text-steel hover:text-ink">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink/80 hover:text-ink">
                Ingresar
              </Link>
              <Link href="/registro" className="btn-shop text-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
