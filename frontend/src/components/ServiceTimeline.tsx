import { ServiceStatus } from "@/types";

const STEPS: { key: ServiceStatus; label: string }[] = [
  { key: "RECIBIDO", label: "Equipo recibido" },
  { key: "DIAGNOSTICO", label: "Diagnóstico" },
  { key: "COTIZACION", label: "Cotización" },
  { key: "ESPERANDO_APROBACION", label: "Esperando aprobación" },
  { key: "EN_REPARACION", label: "En reparación" },
  { key: "LISTO", label: "Listo para entrega" },
  { key: "ENTREGADO", label: "Entregado" },
];

export function ServiceTimeline({ status }: { status: ServiceStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const isCancelled = status === "CANCELADO";

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      {isCancelled ? (
        <p className="font-display text-xl text-rust">Orden cancelada</p>
      ) : (
        <ol>
          {STEPS.map((step, i) => {
            const done = i <= currentIndex;
            const isLast = i === STEPS.length - 1;
            const current = i === currentIndex;
            return (
              <li key={step.key}>
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-mono ${
                      done ? "bg-solder text-white" : "bg-steel-100 text-steel"
                    }`}
                  >
                    {done ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`${current ? "font-semibold text-graphite" : done ? "text-ink" : "text-steel"}`}>
                    {step.label}
                  </span>
                  {current && (
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-copper border border-copper/40 px-2 py-0.5 rounded">
                      actual
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`perf-divider-v ml-4 h-5 ${done ? "text-solder" : "text-steel/40"}`}
                    style={{ marginLeft: "13px" }}
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
