import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="border-b-2 border-graphite bg-graphite text-aluminum">
          <div className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-[1.3fr,1fr] gap-12 items-end">
            <div>
              <p className="font-mono text-xs text-copper-light mb-4">SKU 00001 — 00842</p>
              <h1 className="font-display text-5xl md:text-6xl leading-[0.95] mb-6">
                Componentes, equipos y el taller que los respalda.
              </h1>
              <p className="text-steel max-w-md mb-8">
                Compra lo que necesitas y, si algo falla, sigue tu reparación
                o tu garantía con el mismo código, paso a paso.
              </p>
              <div className="flex gap-4">
                <Link href="/productos" className="bg-copper text-white px-6 py-3 font-medium ticket-notch">
                  Ver productos
                </Link>
                <Link href="/reparaciones" className="border-2 border-aluminum px-6 py-3 font-medium ticket-notch">
                  Seguir reparación
                </Link>
              </div>
            </div>
            <div className="border-2 border-copper-light ticket-notch p-6 font-mono text-sm">
              <p className="text-copper-light mb-4">SERVICE #000145</p>
              <div className="perf-divider text-copper-light mb-4" />
              <p className="text-steel">Equipo</p>
              <p className="mb-2">ASUS TUF Gaming F15</p>
              <p className="text-steel">Estado</p>
              <p className="text-solder">EN REPARACIÓN</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-3 gap-8">
          {[
            { title: "Productos con inventario real", body: "Cada referencia muestra stock exacto, no promesas vacías." },
            { title: "Servicio técnico rastreable", body: "De recibido a entregado, con cada cambio de estado a la vista." },
            { title: "Garantías sin vueltas", body: "Reporta una falla, sube evidencia y sigue su revisión." },
          ].map((f) => (
            <div key={f.title} className="border-t-2 border-graphite pt-4">
              <h3 className="font-display text-xl text-graphite mb-2">{f.title}</h3>
              <p className="text-steel text-sm">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
