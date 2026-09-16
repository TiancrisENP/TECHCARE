import { ServiceStatus } from "@/types";

const STEPS: { key: ServiceStatus; label: string }[] = [
  { key: "RECIBIDO", label: "Equipo recibido" },
  { key: "DIAGNOSTICO", label: "Diagnóstico" },
  { key: "COTIZACION", label: "Cotización enviada" },
  { key: "ESPERANDO_APROBACION", label: "Esperando tu aprobación" },
  { key: "EN_REPARACION", label: "En reparación" },
  { key: "LISTO", label: "Listo para recoger" },
  { key: "ENTREGADO", label: "Entregado" },
];

export function ServiceTimeline({ status }: { status: ServiceStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const isCancelled = status === "CANCELADO";

  return (
    <div className="border-2 border-graphite ticket-notch bg-white p-6">
      {isCancelled ? (
        <p className="font-display text-xl text-rust">Servicio cancelado</p>
      ) : (
        <ol>
          {STEPS.map((step, i) => {
            const done = i <= currentIndex;
            const isLast = i === STEPS.length - 1;
            return (
              <li key={step.key}>
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 font-mono text-xs ${
                      done
                        ? "bg-solder border-solder text-white"
                        : "border-steel text-steel"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`font-medium ${
                      done ? "text-graphite" : "text-steel"
                    } ${i === currentIndex ? "font-display text-lg" : ""}`}
                  >
                    {step.label}
                  </span>
                  {i === currentIndex && (
                    <span className="ml-auto font-mono text-xs uppercase text-copper border border-copper px-2 py-0.5">
                      estado actual
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`perf-divider-v ml-4 h-6 ${
                      done ? "text-solder" : "text-steel/40"
                    }`}
                    style={{ marginLeft: "15px" }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
