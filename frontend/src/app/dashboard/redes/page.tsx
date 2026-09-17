"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SocialLink, SocialNetwork } from "@/types";

const NETWORKS: SocialNetwork[] = ["WHATSAPP", "INSTAGRAM", "FACEBOOK", "TIKTOK", "TELEGRAM", "OTRO"];

export default function RedesDashboardPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState<SocialNetwork>("WHATSAPP");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  function load() {
    api.get("/social-links").then((res) => setLinks(res.data)).catch(() => setLinks([]));
  }

  useEffect(() => { load(); }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/social-links", { network, label, url, iconUrl: iconUrl || undefined });
      setLabel("");
      setUrl("");
      setIconUrl("");
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo guardar el enlace.");
    }
  }

  async function toggle(link: SocialLink) {
    await api.put(`/social-links/${link.id}`, { active: !link.active });
    load();
  }

  async function remove(id: string) {
    await api.delete(`/social-links/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite mb-2">Redes y chat</h1>
      <p className="text-steel text-sm mb-6">Hasta 5 burbujas visibles en la tienda pública.</p>

      <form onSubmit={create} className="border-2 border-graphite ticket-notch bg-white p-4 mb-8 grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-mono text-steel mb-1">Red</label>
          <select value={network} onChange={(e) => setNetwork(e.target.value as SocialNetwork)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch bg-white">
            {NETWORKS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono text-steel mb-1">Etiqueta</label>
          <input required minLength={2} value={label} onChange={(e) => setLabel(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-mono text-steel mb-1">URL o número de WhatsApp</label>
          <input required value={url} onChange={(e) => setUrl(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-mono text-steel mb-1">Icono (URL, opcional)</label>
          <input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} className="w-full border-2 border-graphite px-2 py-1.5 text-sm ticket-notch" />
        </div>
        {error && <p className="text-rust text-sm md:col-span-2">{error}</p>}
        <button className="bg-copper text-white px-5 py-2 text-sm ticket-notch md:col-span-2">Agregar burbuja</button>
      </form>

      <div className="grid gap-3">
        {links.map((l) => (
          <div key={l.id} className="border-2 border-graphite ticket-notch bg-white p-4 flex items-center gap-4">
            <div className="font-mono text-xs text-copper w-24">{l.network}</div>
            <div className="flex-1">
              <p className="font-medium">{l.label}</p>
              <p className="text-xs text-steel break-all">{l.url}</p>
            </div>
            <button onClick={() => toggle(l)} className="text-xs font-mono border px-2 py-1">{l.active ? "Ocultar" : "Mostrar"}</button>
            <button onClick={() => remove(l.id)} className="text-xs font-mono text-rust">Quitar</button>
          </div>
        ))}
        {links.length === 0 && <p className="text-steel">No hay redes configuradas.</p>}
      </div>
    </div>
  );
}
