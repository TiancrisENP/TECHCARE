"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SocialLink, SocialNetwork } from "@/components/SocialBubbles";

const NETWORKS: { id: SocialNetwork; label: string; hint: string }[] = [
  { id: "WHATSAPP", label: "WhatsApp", hint: "Número con indicativo o enlace wa.me" },
  { id: "INSTAGRAM", label: "Instagram", hint: "https://instagram.com/tu_cuenta" },
  { id: "FACEBOOK", label: "Facebook", hint: "https://facebook.com/tu_pagina" },
  { id: "TIKTOK", label: "TikTok", hint: "https://tiktok.com/@tu_cuenta" },
  { id: "TELEGRAM", label: "Telegram", hint: "https://t.me/tu_canal" },
  { id: "OTRO", label: "Otro", hint: "Cualquier URL (web, YouTube, etc.)" },
];

export default function RedesDashboardPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState<SocialNetwork>("WHATSAPP");
  const [label, setLabel] = useState("WhatsApp");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  function load() {
    setLoading(true);
    api.get("/social-links").then((res) => setLinks(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const trimmedIcon = iconUrl.trim();
      await api.post("/social-links", {
        network,
        label,
        url: url.trim(),
        ...(trimmedIcon && !trimmedIcon.includes("…") ? { iconUrl: trimmedIcon } : {}),
        sortOrder: links.length,
      });
      setUrl("");
      setIconUrl("");
      load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "No se pudo guardar el enlace.");
    }
  }

  async function remove(id: string) {
    await api.delete(`/social-links/${id}`);
    load();
  }

  const hint = NETWORKS.find((n) => n.id === network)?.hint;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-graphite mb-2">Redes y chat</h1>
      <p className="text-steel text-sm mb-6">
        Hasta 5 burbujas en la esquina inferior derecha del sitio (WhatsApp, Instagram, Facebook y otras).
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 mb-8 max-w-xl">
        <div className="grid gap-3 mb-4">
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Red</label>
            <select
              value={network}
              onChange={(e) => {
                const next = e.target.value as SocialNetwork;
                setNetwork(next);
                setLabel(NETWORKS.find((n) => n.id === next)?.label || "Chat");
              }}
              className="w-full border border-slate-200 rounded-md px-2 py-2 text-sm bg-white"
            >
              {NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Nombre visible</label>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Enlace o número</label>
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={hint}
              className="w-full border border-slate-200 rounded-md px-2 py-2 text-sm font-mono"
            />
            <p className="text-xs text-steel mt-1">{hint}</p>
          </div>
          <div>
            <label className="block text-xs font-mono text-steel mb-1">Icono de la burbuja (opcional)</label>
            <input
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://…/icono.png"
              className="w-full border border-slate-200 rounded-md px-2 py-2 text-sm font-mono"
            />
            <p className="text-xs text-steel mt-1">
              URL de una imagen cuadrada. Si la dejas vacía se usa el icono de la red.
            </p>
            {iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt="" className="mt-2 h-14 w-14 rounded-full object-cover ring-2 ring-white shadow" />
            )}
          </div>
        </div>
        {error && <p className="text-rust text-sm mb-3">{error}</p>}
        <button disabled={links.length >= 5} className="btn-shop disabled:opacity-50">
          {links.length >= 5 ? "Límite de 5 alcanzado" : "Agregar burbuja"}
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-w-xl">
        {loading && <p className="px-4 py-6 text-steel text-sm">Cargando…</p>}
        {!loading && links.length === 0 && (
          <p className="px-4 py-6 text-steel text-sm">Aún no hay burbujas. Agrega WhatsApp u otra red.</p>
        )}
        {links.map((link) => (
          <div key={link.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full overflow-hidden bg-steel-100 shrink-0">
                {link.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.iconUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] font-mono">{link.network.slice(0, 2)}</span>
                )}
              </span>
              <div>
                <p className="font-medium text-graphite text-sm">{link.label}</p>
                <p className="font-mono text-xs text-steel break-all">{link.url}</p>
              </div>
            </div>
            <button type="button" onClick={() => remove(link.id)} className="text-rust text-xs">
              Quitar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
