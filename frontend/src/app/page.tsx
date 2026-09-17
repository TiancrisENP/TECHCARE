import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-20 grid md:grid-cols-[1.2fr,0.8fr] gap-12 items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-copper mb-4">
              SKU · serial · tracking
            </p>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] font-semibold text-graphite mb-5">
              Inventario real.
              <span className="block text-copper">Servicio con trazabilidad.</span>
            </h1>
            <p className="text-lg text-ink/70 max-w-md mb-8 leading-relaxed">
              Controla stock de equipos y componentes, registra reparaciones y
              sigue cada orden con un código único — del ingreso al taller hasta la entrega.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/productos" className="btn-shop">
                Ver inventario
              </Link>
              <Link href="/reparaciones" className="btn-ghost">
                Consultar reparación
              </Link>
            </div>
          </div>

          <aside className="bg-graphite text-aluminum p-6 rounded-lg shadow-lamp font-mono text-sm">
            <p className="text-copper-light text-xs uppercase tracking-widest mb-4">OS · 000145</p>
            <p className="text-steel mb-1">Equipo</p>
            <p className="font-display text-xl text-white mb-4">ASUS TUF Gaming F15</p>
            <div className="perf-divider text-slate-600 mb-4" />
            <p className="text-steel mb-1">Estado</p>
            <p className="text-solder font-medium">EN_REPARACION</p>
            <p className="text-steel mt-4 mb-1">Técnico</p>
            <p>Cristian</p>
          </aside>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 grid md:grid-cols-3 gap-4">
          {[
            {
              k: "01",
              title: "Stock exacto",
              body: "Cada SKU muestra unidades en anaquel. Si llega a mínimo, el panel lo marca.",
            },
            {
              k: "02",
              title: "Órdenes de servicio",
              body: "Recibido, diagnóstico, cotización, reparación, listo. Cada cambio queda registrado.",
            },
            {
              k: "03",
              title: "Garantías",
              body: "Vincula el equipo, el cliente y el estado de la revisión sin perder el historial.",
            },
          ].map((f) => (
            <article key={f.k} className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="font-mono text-xs text-copper mb-3">{f.k}</p>
              <h3 className="font-display text-xl font-semibold text-graphite mb-2">{f.title}</h3>
              <p className="text-ink/70 text-sm leading-relaxed">{f.body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
