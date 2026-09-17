"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PublicHeader } from "@/components/PublicHeader";
import { ServiceTimeline } from "@/components/ServiceTimeline";
import { ServiceOrder } from "@/types";

export default function ReparacionDetallePage({ params }: { params: { tracking: string } }) {
  const [service, setService] = useState<ServiceOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/services/track/${params.tracking}`)
      .then((res) => setService(res.data))
      .catch(() => setError("No hay una orden de servicio con ese código."))
      .finally(() => setLoading(false));
  }, [params.tracking]);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <p className="font-mono text-xs uppercase tracking-widest text-copper mb-2">{params.tracking}</p>

        {loading && <p className="text-steel">Consultando orden…</p>}

        {error && (
          <div className="border border-rust/30 bg-white rounded-lg p-6">
            <p className="text-rust font-medium">{error}</p>
          </div>
        )}

        {service && (
          <>
            <h1 className="font-display text-3xl font-semibold text-graphite mb-2">
              {service.deviceName}
            </h1>
            <p className="text-ink/70 mb-8">
              Falla reportada: {service.problem}
              {service.serialNumber && <> · S/N {service.serialNumber}</>}
            </p>

            <ServiceTimeline status={service.status} />

            {service.photos && service.photos.length > 0 && (
              <div className="flex gap-2 mt-6">
                {service.photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={photo.imageUrl} src={photo.imageUrl} alt="" className="h-20 w-20 object-cover rounded border" />
                ))}
              </div>
            )}

            {service.quotedAmount && (
              <div className="mt-6 bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm text-steel">Cotización</span>
                <span className="font-mono text-lg text-copper">
                  ${service.quotedAmount.toLocaleString("es-CO")}
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
