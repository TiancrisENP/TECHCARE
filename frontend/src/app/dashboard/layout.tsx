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
  { href: "/dashboard/servicios", label: "Servicios técnicos", roles: ["ADMIN", "TECNICO"] },
  { href: "/dashboard/garantias", label: "Garantías", roles: ["ADMIN", "TECNICO"] },
  { href: "/dashboard/redes", label: "Redes", roles: ["ADMIN"] },
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
    return <div className="p-10 text-steel">Verificando acceso...</div>;
  }

  const items = NAV.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen grid grid-cols-[220px,1fr] bg-steel-100">
      <aside className="bg-graphite text-aluminum flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/" className="font-display text-xl hover:text-copper-light">
            TECHCARE
          </Link>
          <p className="font-mono text-xs text-copper-light mt-1">{user.role}</p>
        </div>
        <nav className="flex-1 py-4">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-6 py-2.5 text-sm border-l-4 ${
                  active
                    ? "border-copper bg-white/5 text-white font-medium"
                    : "border-transparent text-aluminum/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10">
          <Link href="/" className="block px-6 py-3 text-sm text-copper-light hover:text-white">
            ← Página principal
          </Link>
          <button onClick={logout} className="w-full px-6 py-4 text-sm text-left border-t border-white/10 text-aluminum/70 hover:text-white">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
