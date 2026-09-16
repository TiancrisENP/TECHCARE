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
      .catch(() => setError("No encontramos ninguna reparación con ese código."))
      .finally(() => setLoading(false));
  }, [params.tracking]);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="font-mono text-xs text-copper mb-2">{params.tracking}</p>

        {loading && <p className="text-steel">Buscando tu equipo...</p>}

        {error && (
          <div className="border-2 border-rust ticket-notch p-6 bg-white">
            <p className="text-rust font-medium">{error}</p>
          </div>
        )}

        {service && (
          <>
            <h1 className="font-display text-3xl text-graphite mb-1">
              {service.deviceName}
            </h1>
            <p className="text-steel mb-8">
              Problema reportado: {service.problem}
              {service.serialNumber && <> · Serial: {service.serialNumber}</>}
            </p>

            <ServiceTimeline status={service.status} />

            {service.quotedAmount && (
              <div className="mt-6 border-2 border-graphite ticket-notch p-4 flex justify-between items-center bg-white">
                <span className="font-medium text-graphite">Cotización</span>
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
