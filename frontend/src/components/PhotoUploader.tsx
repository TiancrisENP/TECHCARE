"use client";

import { api } from "@/lib/api";
import { useState } from "react";

export function PhotoUploader({
  urls,
  onChange,
  folder,
  label = "Fotografías",
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("folder", folder);
    Array.from(list).forEach((file) => body.append("files", file));
    try {
      const { data } = await api.post<{ urls: string[] }>("/uploads", body);
      onChange([...urls, ...data.urls]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "No se pudieron subir las fotos a Cloudinary.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-mono text-steel mb-1">{label}</label>
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm text-steel file:mr-3 file:border-2 file:border-graphite file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-mono"
      />
      <p className="text-[11px] text-steel mt-1">
        {busy ? "Subiendo a Cloudinary…" : "JPG/PNG/WEBP, máx. 5 MB. Se guarda la URL en PostgreSQL."}
      </p>
      {error && <p className="text-rust text-xs mt-1">{error}</p>}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {urls.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-16 w-16 object-cover rounded border border-slate-200" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((item) => item !== url))}
                className="absolute -top-1 -right-1 bg-white text-rust text-[10px] border border-rust rounded-full h-4 w-4"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
