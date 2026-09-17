"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";

interface CreateClienteFormProps {
  onCreated?: (user: User) => void;
  title?: string;
}

export function CreateClienteForm({ onCreated, title = "Nuevo cliente" }: CreateClienteFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post<User>("/users/clientes", {
        name,
        email,
        password,
        phone: phone || undefined,
      });
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setSuccess(`Cliente creado: ${data.name} (${data.email})`);
      onCreated?.(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "No se pudo crear el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-4 mb-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-1">{title}</p>
      <p className="text-steel text-sm mb-4">
        El cliente usará este email y contraseña para consultar su cuenta.
      </p>
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
      </div>
      {error && <p className="text-rust text-sm mb-3">{error}</p>}
      {success && <p className="text-solder text-sm mb-3">{success}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-copper text-white px-5 py-2.5 text-sm font-medium ticket-notch disabled:opacity-50"
      >
        {submitting ? "Creando..." : "Crear cliente"}
      </button>
    </form>
  );
}
