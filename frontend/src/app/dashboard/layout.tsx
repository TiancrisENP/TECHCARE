"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/types";

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Resumen", roles: ["ADMIN", "VENDEDOR", "TECNICO"] },
  { href: "/dashboard/productos", label: "Productos", roles: ["ADMIN", "VENDEDOR"] },
  { href: "/dashboard/inventario", label: "Inventario", roles: ["ADMIN", "VENDEDOR", "TECNICO"] },
  { href: "/dashboard/ventas", label: "Ventas", roles: ["ADMIN", "VENDEDOR"] },
  { href: "/dashboard/clientes", label: "Clientes", roles: ["ADMIN", "VENDEDOR", "TECNICO"] },
  { href: "/dashboard/servicios", label: "Servicios", roles: ["ADMIN", "TECNICO", "VENDEDOR"] },
  { href: "/dashboard/garantias", label: "Garantías", roles: ["ADMIN", "TECNICO"] },
  { href: "/dashboard/redes", label: "Redes y chat", roles: ["ADMIN"] },
  { href: "/dashboard/usuarios", label: "Usuarios", roles: ["ADMIN"] },
  { href: "/dashboard/auditoria", label: "Auditoría", roles: ["ADMIN"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role === "CLIENTE")) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role === "CLIENTE") {
    return <div className="p-10 font-mono text-sm text-steel">Cargando sesión…</div>;
  }

  const items = NAV.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen grid grid-cols-[220px,1fr] bg-aluminum">
      <aside className="bg-graphite text-aluminum flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            TECHCARE
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-widest text-copper-light mt-2">
            {user.role}
          </p>
          <p className="text-sm text-aluminum/70 mt-1 truncate">{user.name}</p>
        </div>
        <nav className="flex-1 py-3">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-5 py-2.5 text-sm border-l-2 ${
                  active
                    ? "border-copper-light bg-white/5 text-white"
                    : "border-transparent text-aluminum/65 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="px-5 py-4 text-left text-sm border-t border-white/10 text-aluminum/60 hover:text-white"
        >
          Cerrar sesión
        </button>
      </aside>
      <main className="p-8 md:p-10">{children}</main>
    </div>
  );
}
