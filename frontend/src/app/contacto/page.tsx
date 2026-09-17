"use client";

import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { api } from "@/lib/api";
import { SocialLink } from "@/types";

export default function ContactoPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    api.get("/social-links/public").then((res) => setLinks(res.data)).catch(() => setLinks([]));
  }, []);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-4xl text-graphite mb-4">Contacto</h1>
        <p className="text-steel mb-8">
          Escríbenos por las redes configuradas en el taller. También puedes usar las burbujas de la esquina.
        </p>
        {links.length === 0 && <p className="text-steel text-sm">Aún no hay redes publicadas.</p>}
        <ul className="space-y-3">
          {links.map((l) => (
            <li key={l.id}>
              <a href={l.url} target="_blank" rel="noreferrer" className="block border-2 border-graphite ticket-notch px-4 py-3 hover:border-copper">
                <span className="font-mono text-xs text-steel">{l.network}</span>
                <p className="font-medium text-graphite">{l.label}</p>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
