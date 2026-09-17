"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SocialLink } from "@/types";

const FALLBACK: Record<string, string> = {
  WHATSAPP: "WA",
  INSTAGRAM: "IG",
  FACEBOOK: "FB",
  TIKTOK: "TT",
  TELEGRAM: "TG",
  OTRO: "•",
};

export function SocialBubbles() {
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    api
      .get("/social-links/public")
      .then((res) => setLinks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLinks([]));
  }, []);

  if (links.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-2">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          title={link.label}
          className="w-12 h-12 bg-graphite text-aluminum border-2 border-copper flex items-center justify-center ticket-notch shadow-lg overflow-hidden"
        >
          {link.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.iconUrl} alt={link.label} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-[10px]">{FALLBACK[link.network] || "•"}</span>
          )}
        </a>
      ))}
    </div>
  );
}
