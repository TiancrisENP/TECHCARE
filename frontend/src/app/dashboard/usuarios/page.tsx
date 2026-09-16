"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User, Role } from "@/types";

const ROLES: Role[] = ["ADMIN", "VENDEDOR", "TECNICO", "CLIENTE"];

export default function UsuariosDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("CLIENTE");

  function load() {
    setLoading(true);
    api.get("/users").then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function changeRole(id: string, nextRole: Role) {
    await api.put(`/users/${id}/role`, { role: nextRole });
    load();
  }

  async function toggleActive(id: string) {
    await api.put(`/users/${id}/active`);
    load();
  }

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/users", { name, email, password, role, phone: phone || undefined });
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setRole("CLIENTE");
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-6">Usuarios</h1>

      <form onSubmit={createUser} className="border-2 border-graphite ticket-notch bg-white p-4 mb-8">
        <p className="font-mono text-xs text-steel uppercase mb-3">Crear usuario</p>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Nombre</label>
            <input
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Teléfono (opcional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-rust text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-copper text-white px-5 py-2.5 text-sm font-medium ticket-notch disabled:opacity-50"
        >
          {submitting ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      <div className="border-2 border-graphite ticket-notch bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-graphite text-left font-mono text-xs uppercase text-steel">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-steel text-center">Cargando...</td></tr>}
            {!loading && users.map((u) => (
              <tr key={u.id} className="border-b border-steel/20">
                <td className="px-4 py-3 font-medium text-graphite">{u.name}</td>
                <td className="px-4 py-3 text-steel">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value as Role)}
                    className="border-2 border-graphite px-2 py-1 font-mono text-xs ticket-notch bg-white"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-0.5 border ${u.active ? "border-solder text-solder" : "border-rust text-rust"}`}>
                    {u.active ? "activo" : "inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(u.id)}
                    className="text-xs font-mono border border-graphite px-2 py-1"
                  >
                    {u.active ? "Desactivar" : "Reactivar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
