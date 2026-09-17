"use client";

import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { api } from "@/lib/api";
import { SocialLink } from "@/components/SocialBubbles";

export default function ContactoPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    api.get("/social-links/public").then((res) => setLinks(res.data)).catch(() => setLinks([]));
  }, []);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-copper mb-2">contacto</p>
        <h1 className="font-display text-4xl font-semibold text-graphite mb-4">Canales oficiales</h1>
        <p className="text-ink/70 mb-8">
          Escríbenos por el chat o síguenos en las redes. Las burbujas de la esquina también te llevan ahí.
        </p>
        {links.length === 0 && (
          <p className="text-steel text-sm">El administrador aún no configuró los enlaces de contacto.</p>
        )}
        <ul className="space-y-3">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-copper/40"
              >
                <span className="font-medium text-graphite">{link.label}</span>
                <span className="block font-mono text-xs text-steel mt-1 break-all">{link.url}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
