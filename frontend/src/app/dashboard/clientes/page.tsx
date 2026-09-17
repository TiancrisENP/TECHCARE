"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { CreateClienteForm } from "@/components/CreateClienteForm";

export default function ClientesDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get("/users/assignable")
      .then((res) => setUsers(res.data.filter((u: User) => u.role === "CLIENTE")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-graphite mb-2">Clientes</h1>
      <p className="text-steel text-sm mb-6">
        Alta de cliente para asociarlo a una orden de servicio o garantía.
      </p>

      <CreateClienteForm onCreated={() => load()} />

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-steel text-center">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-steel text-center">
                  No hay clientes activos.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-steel/20">
                <td className="px-4 py-3 font-medium text-graphite">{u.name}</td>
                <td className="px-4 py-3 text-steel">{u.email}</td>
                <td className="px-4 py-3 text-steel">{u.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
