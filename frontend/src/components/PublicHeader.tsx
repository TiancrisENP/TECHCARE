"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function PublicHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b-2 border-graphite">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight text-graphite">
          TECHCARE
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-graphite">
          <Link href="/productos">Productos</Link>
          <Link href="/reparaciones">Seguir reparación</Link>
          <Link href="/contacto">Contacto</Link>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              {user.role !== "CLIENTE" && (
                <Link href="/dashboard" className="text-copper font-medium">
                  Panel
                </Link>
              )}
              <button onClick={logout} className="text-graphite/70 hover:text-graphite">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-graphite">
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="bg-copper text-aluminum px-4 py-2 ticket-notch font-medium"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
