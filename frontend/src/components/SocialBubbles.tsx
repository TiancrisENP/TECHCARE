"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

export type SocialNetwork = "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "TELEGRAM" | "OTRO";

export interface SocialLink {
  id: string;
  network: SocialNetwork;
  label: string;
  url: string;
  iconUrl?: string | null;
  sortOrder: number;
  active?: boolean;
}

function Icon({ network }: { network: SocialNetwork }) {
  const common = "h-[22px] w-[22px] fill-current";
  if (network === "WHATSAPP") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.25 14.16c-.23.64-1.12 1.18-1.84 1.33-.49.11-1.12.2-3.26-.7-2.74-1.15-4.5-3.98-4.64-4.16-.13-.18-1.1-1.46-1.1-2.79s.7-1.97.95-2.24c.23-.26.51-.33.68-.33h.49c.16 0 .37-.06.57.43.23.54.77 1.88.84 2.02.07.13.11.29.02.47-.09.18-.13.29-.26.45-.13.16-.28.35-.4.47-.13.13-.26.26-.11.51.16.26.7 1.15 1.5 1.86 1.03.92 1.9 1.21 2.17 1.34.26.13.42.11.57-.07.16-.18.68-.79.86-1.06.18-.26.37-.22.62-.13.26.09 1.63.77 1.91.91.28.13.46.2.53.31.07.13.07.73-.16 1.37z" />
      </svg>
    );
  }
  if (network === "INSTAGRAM") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.8A4.2 4.2 0 1 1 7.8 12 4.2 4.2 0 0 1 12 7.8zm0 2A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.6 6.3a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z" />
      </svg>
    );
  }
  if (network === "FACEBOOK") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M14.7 8.3h2.8V4.8h-2.8c-2.9 0-4.8 1.8-4.8 4.9V12H7.3v3.3h2.6V22h3.4v-6.7h2.8l.6-3.3h-3.4V10c0-.9.4-1.7 1.4-1.7z" />
      </svg>
    );
  }
  if (network === "TELEGRAM") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M21.5 4.3 2.8 11.4c-1 .4-1 1.8.1 2.2l4.7 1.5 1.8 5.5c.3.9 1.4 1.1 2 .4l2.6-2.6 4.7 3.4c.8.6 1.9.1 2.1-.8l3.3-16c.3-1.1-.8-2-1.8-1.7zM9.6 14.2l8.9-5.6-6.9 6.5-.3 2.6-1.7-3.5z" />
      </svg>
    );
  }
  if (network === "TIKTOK") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M14.2 3c.5 2.8 2.2 4.8 5 5.2v3c-1.7 0-3.3-.5-4.7-1.4v6.5A6.1 6.1 0 1 1 8.3 10v3a3.1 3.1 0 1 0 2.2 3V3h3.7z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} aria-hidden>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm1.1-6.5c-.2.4-.6.7-1.1 1.1-.4.3-.5.5-.5.9V13h-2v-.7c0-.9.4-1.5 1.1-2 .5-.4.8-.6.8-1.1a1.1 1.1 0 0 0-2.2 0H8.2a3.1 3.1 0 0 1 6.2.4c0 .9-.5 1.5-1.3 2.1z" />
    </svg>
  );
}

const bubbleClass: Record<SocialNetwork, string> = {
  WHATSAPP: "bg-[#25D366] text-white",
  INSTAGRAM: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white",
  FACEBOOK: "bg-[#1877F2] text-white",
  TIKTOK: "bg-[#111111] text-white",
  TELEGRAM: "bg-[#229ED9] text-white",
  OTRO: "bg-copper text-white",
};

export function SocialBubbles() {
  const pathname = usePathname();
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    api
      .get("/social-links/public")
      .then((res) => setLinks(res.data.slice(0, 5)))
      .catch(() => setLinks([]));
  }, []);

  if (pathname.startsWith("/dashboard") || links.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.label}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_20px_rgba(15,23,42,0.28)] ring-4 ring-white hover:scale-110 transition-transform ${
            link.iconUrl ? "bg-white overflow-hidden" : bubbleClass[link.network]
          }`}
        >
          <span className="sr-only">{link.label}</span>
          {link.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.iconUrl} alt={link.label} className="h-full w-full object-cover" />
          ) : (
            <Icon network={link.network} />
          )}
        </a>
      ))}
    </div>
  );
}
