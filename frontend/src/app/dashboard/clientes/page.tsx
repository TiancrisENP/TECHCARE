"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";

export default function ClientesDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/assignable")
      .then((res) => setUsers(res.data.filter((u: User) => u.role === "CLIENTE")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-6">Clientes</h1>
      <p className="text-steel text-sm mb-6">
        Usuarios con rol CLIENTE activos. El admin crea cuentas nuevas en Usuarios.
      </p>
      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={2} className="px-4 py-6 text-steel text-center">Cargando...</td></tr>}
            {!loading && users.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-6 text-steel text-center">No hay clientes activos.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-steel/20">
                <td className="px-4 py-3 font-medium text-graphite">{u.name}</td>
                <td className="px-4 py-3 text-steel">{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
