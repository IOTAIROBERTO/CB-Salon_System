import Encabezado from '@/components/Encabezado'
import { BENEFICIOS, NOMBRE_CLUB, NOMBRE_NIVEL, REGLAS_CLUB as R, descuentosProducto, montoCanje, pesos } from '@/salon'

// Las reglas salen de utils/lealtad.ts de CB Control. La tarjeta con puntos de cada clienta llega con el inicio de
// sesión por teléfono (fase 3); por ahora la pantalla explica el programa.
export default function MiClub() {
  const niveles = [
    { nivel: NOMBRE_NIVEL.marfil, desde: 0, x: 1 },
    { nivel: NOMBRE_NIVEL.dorado, desde: R.dorado, x: R.multiplicadorDorado },
    { nivel: NOMBRE_NIVEL.onix, desde: R.onix, x: R.multiplicadorOnix }
  ]
  return (
    <>
      <Encabezado titulo={NOMBRE_CLUB} bajada="Tu fidelidad tiene premio" />
      <main className="space-y-4 p-4">
        <div className="rounded-2xl bg-marca-negro p-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-marca-dorado">Tu tarjeta</p>
          <p className="mt-2 font-display text-2xl">Muy pronto aquí</p>
          <p className="mt-1 text-sm text-marca-champan">Entrarás con tu teléfono para ver tus puntos, tu nivel y tu saldo a favor.</p>
        </div>

        <section className="tarjeta">
          <h2 className="titulo text-xl">Cómo juntas puntos</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Al activar tu tarjeta: <b>{R.bienvenida} puntos</b> de bienvenida.</li>
            <li>1 punto por cada <b>{pesos(R.pesosPorPuntoServicio)}</b> en servicios y por cada <b>{pesos(R.pesosPorPuntoProducto)}</b> en productos.</li>
            <li>Agendar en línea: <b>{R.reservaEnLinea}</b> · visita en tu mes de cumpleaños: <b>{R.cumpleanos}</b> · amiga que recomiendas: <b>{R.referida}</b>.</li>
          </ul>
        </section>

        <section className="tarjeta">
          <h2 className="titulo text-xl">Niveles</h2>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
            {niveles.map(n => (
              <div key={n.nivel} className="rounded-xl bg-marca-marfil p-2">
                <p className="font-display text-lg text-marca-negro">{n.nivel}</p>
                <p className="text-xs text-marca-gris">desde {n.desde.toLocaleString('es-MX')} pts</p>
                <p className="text-xs">puntos ×{n.x}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="tarjeta">
          <h2 className="titulo text-xl">Lo que ganas</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {descuentosProducto().map(d => <li key={d.pct}><b>{d.pct}% en productos</b> al llegar a {d.puntos.toLocaleString('es-MX')} puntos.</li>)}
            <li>Cambia puntos por saldo a favor: <b>{R.canjeMinimo} puntos = {pesos(montoCanje(R.canjeMinimo))}</b>.</li>
            <li>{BENEFICIOS.cumple.titulo}.</li>
            <li>{BENEFICIOS.constancia.titulo}: {R.constanciaVisitas} visitas seguidas.</li>
          </ul>
          <p className="mt-2 text-xs text-marca-gris">Después de un mes de gracia, cada mes sin visita ni compra se pierde el {R.inactividadPorcentaje}% de los puntos.</p>
        </section>
      </main>
    </>
  )
}
