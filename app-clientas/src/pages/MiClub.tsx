import Encabezado from '@/components/Encabezado'
import UnirmeClub from '@/components/UnirmeClub'
import {
  ANIVERSARIO_PUNTOS, AVISO_GASTO, BENEFICIOS_NIVEL, CLAVES_REGALO, DIAS_PUNTOS_DOBLES, NIVELES, NOMBRE_CLUB, NOMBRE_NIVEL, REGALOS_NIVEL, REGLA_CANJE,
  REGLAS_CLUB as R, beneficioCumple, montoCanje, multiplicador, pesos, textoSaldoPuntos, umbral
} from '@/salon'

// Las reglas salen de utils/lealtad.ts de CB Control. La tarjeta con puntos de cada clienta llega con el inicio de
// sesión por teléfono (fase 3); por ahora la pantalla explica el programa y el alta sale por WhatsApp.
const ESTILO: Record<string, string> = {
  marfil: 'bg-white text-marca-negro border border-marca-linea',
  miel: 'bg-gradient-to-br from-[#F1E2C2] to-[#E2C68F] text-marca-negro',
  ambar: 'bg-gradient-to-br from-[#D39A52] to-[#A8692A] text-white',
  dorado: 'bg-gradient-to-br from-[#D9BF8C] to-[#A9843F] text-marca-negro',
  onix: 'bg-gradient-to-br from-[#2B2B2B] to-[#111111] text-white'
}
const DIAS = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados']

export default function MiClub() {
  return (
    <>
      <Encabezado rotulo="Membresía" titulo={NOMBRE_CLUB} bajada="Cinco niveles con los colores de la casa. Mientras más tiempo eres clienta, más rinde cada visita." />
      <main className="space-y-10 px-6 pb-8">
        <div className="relative aspect-[1.586] overflow-hidden rounded-xl bg-gradient-to-br from-[#2B2B2B] via-[#151515] to-[#0B0B0B] p-6 text-white shadow-[0_24px_48px_-24px_rgba(17,17,17,0.6)]">
          <img src="./icons/monograma.svg" alt="" className="absolute -bottom-10 -right-8 h-48 opacity-[0.12]" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between">
              <img src="./icons/monograma.svg" alt="" className="h-8" />
              <p className="rotulo text-marca-dorado">Club</p>
            </div>
            <div className="mt-auto">
              <p className="font-display text-2xl">Tu tarjeta, muy pronto aquí</p>
              <p className="mt-1 max-w-[17rem] text-xs leading-relaxed text-white/60">Entrarás con tu teléfono y verás tu nivel y tu saldo en pesos, por ejemplo: «{textoSaldoPuntos(1240)}»</p>
            </div>
          </div>
        </div>

        <UnirmeClub />

        <section>
          <p className="rotulo">Cómo funciona</p>
          <h2 className="titulo mt-1 text-3xl">Juntas puntos</h2>
          <dl className="mt-3 text-sm">
            {[
              ['Al unirte', `${R.bienvenida} puntos`],
              ['Si te recomendó una amiga', `${R.bienvenidaReferida} puntos más`],
              ['Servicios', `1 punto por cada ${pesos(R.pesosPorPuntoServicio)}`],
              ['Productos', `1 punto por cada ${pesos(R.pesosPorPuntoProducto)}`],
              ['Agendar en línea', `${R.reservaEnLinea} puntos`],
              ['Tu mes de cumpleaños', 'puntos dobles'],
              [`Los ${DIAS_PUNTOS_DOBLES.map(d => DIAS[d]).join(' y ')}`, 'puntos dobles en servicios'],
              ['Amiga que recomiendas', `${R.referidaDescuento}% en tu próxima cita*`]
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-marca-linea/70 py-3">
                <dt className="text-marca-gris">{k}</dt><dd className="text-right text-marca-negro">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-marca-gris">
            * Si tu amiga agenda diseño de color, maquillaje social o de novia (tope de {pesos(R.referidaTope)}); con otro servicio ganas {R.referida} puntos.
            Tus puntos valen dinero: cada punto vale {pesos(R.pesosPorPuntoCanje)} (1,000 puntos = {pesos(montoCanje(1000))}). {REGLA_CANJE}, desde {R.canjeMinimo} puntos.
          </p>
        </section>

        <section>
          <p className="rotulo">Niveles</p>
          <h2 className="titulo mt-1 text-3xl">Sube de nivel</h2>
          <p className="mt-2 text-sm leading-relaxed text-marca-gris">
            Tu nivel lo marcan tus puntos disponibles, contando los que juntaste en los últimos 12 meses. Venir te sube; usar puntos te baja.
            Al subir no pierdes nada: cada nivel trae todo lo del anterior, mejorado.
          </p>
          <div className="mt-5 grid grid-cols-5 gap-1.5">
            {NIVELES.map(n => (
              <div key={n} className={`flex aspect-[3/4] flex-col justify-between rounded-md p-2 ${ESTILO[n]}`}>
                <p className="font-display text-[15px] leading-tight">{NOMBRE_NIVEL[n]}</p>
                <p className="text-[9px] uppercase leading-tight tracking-[0.1em] opacity-80">{n === 'marfil' ? 'al unirte' : `${umbral(n).toLocaleString('es-MX')} pts`}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="rotulo">1 · Siempre</p>
          <h2 className="titulo mt-1 text-3xl">Mientras estés en tu nivel</h2>
          <p className="mt-2 text-sm leading-relaxed text-marca-gris">En cada visita, sin gastar puntos.</p>
          <table className="mt-4 w-full table-fixed text-center text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-[0.08em] text-marca-dorado-prof">
                <th className="w-[30%] pb-2 text-left font-normal" />
                {NIVELES.map(n => <th key={n} className="pb-2 font-normal">{NOMBRE_NIVEL[n]}</th>)}
              </tr>
            </thead>
            <tbody>
              {([
                ['Puntos por compra', n => `×${multiplicador(n)}`],
                ['Productos', n => BENEFICIOS_NIVEL[n].productos ? `${BENEFICIOS_NIVEL[n].productos}%` : '—'],
                ['Maquillaje social', n => BENEFICIOS_NIVEL[n].maquillaje ? `${BENEFICIOS_NIVEL[n].maquillaje}%` : '—'],
                ['Corte y peinado', n => BENEFICIOS_NIVEL[n].cortePeinado ? `${BENEFICIOS_NIVEL[n].cortePeinado}%` : '—'],
                ['Despunte de flequillo', n => BENEFICIOS_NIVEL[n].flequillo ? '1 al mes' : '—'],
                ['Antojos: waffles, snacks y galletas', n => BENEFICIOS_NIVEL[n].antojosSeleccion ? `${BENEFICIOS_NIVEL[n].antojosSeleccion}%` : '—'],
                ['Antojos: todo lo demás', n => BENEFICIOS_NIVEL[n].antojosResto ? `${BENEFICIOS_NIVEL[n].antojosResto}%` : '—'],
                ['Antojo y bebida de cortesía', n => BENEFICIOS_NIVEL[n].antojoCortesia ? '1 al mes' : '—'],
                ['Extra en tarjeta de regalo', n => BENEFICIOS_NIVEL[n].tarjeta ? `+${BENEFICIOS_NIVEL[n].tarjeta}%` : '—']
              ] as [string, (n: (typeof NIVELES)[number]) => string][]).map(([k, f]) => (
                <tr key={k} className="border-t border-marca-linea/70">
                  <td className="py-2.5 text-left text-xs text-marca-gris">{k}</td>
                  {NIVELES.map(n => <td key={n} className="py-2.5 text-marca-negro">{f(n)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-marca-gris">Los paquetes de novia no llevan descuento de nivel. Café, té caliente y agua son de cortesía para todas.</p>
        </section>

        <section>
          <p className="rotulo">2 · Una vez por nivel</p>
          <h2 className="titulo mt-1 text-3xl">Tu regalo de nivel</h2>
          <p className="mt-2 text-sm leading-relaxed text-marca-gris">
            Cada nivel te regala un servicio que pagas con pocos puntos. Al subir conservas los de abajo que no hayas usado. Se tacha al usarlo y vuelve a los 12 meses si sigues en ese nivel.
          </p>
          <div className="mt-4">
            {CLAVES_REGALO.map(k => {
              const r = REGALOS_NIVEL[k]
              return (
                <div key={k} className="flex items-center gap-4 border-b border-marca-linea/70 py-3.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm ${ESTILO[r.nivel]}`}>{NOMBRE_NIVEL[r.nivel][0]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-marca-negro">{r.titulo}</p>
                    <p className="text-xs text-marca-gris">Desde {NOMBRE_NIVEL[r.nivel]} · precio normal {pesos(r.precio)}</p>
                  </div>
                  <p className="text-right text-sm text-marca-dorado-prof">{r.puntos}<span className="block text-[9px] uppercase tracking-[0.16em] text-marca-gris">puntos</span></p>
                </div>
              )
            })}
          </div>
          <p className="mt-3 border-l border-marca-dorado pl-3 text-xs leading-relaxed text-marca-gris">{AVISO_GASTO}.</p>
        </section>

        <section>
          <p className="rotulo">3 · Celebraciones</p>
          <h2 className="titulo mt-1 text-3xl">Gratis, y mejoran contigo</h2>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-marca-gris">Tu cumpleaños · puntos dobles todo el mes y además</p>
          <dl className="mt-1 text-sm">
            {NIVELES.map(n => (
              <div key={n} className="flex justify-between gap-4 border-b border-marca-linea/70 py-2.5">
                <dt className="text-marca-gris">{NOMBRE_NIVEL[n]}</dt>
                <dd className="text-right text-marca-negro">{n === 'marfil' ? 'Puntos dobles' : beneficioCumple(n).titulo}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-marca-gris">Aniversario en el Club · si viniste en los últimos {R.aniversarioDias} días</p>
          <div className="mt-2 grid grid-cols-5 gap-1.5 text-center">
            {NIVELES.map(n => (
              <div key={n} className="rounded-md bg-white py-2">
                <p className="text-[9px] uppercase tracking-[0.1em] text-marca-gris">{NOMBRE_NIVEL[n]}</p>
                <p className="text-sm text-marca-negro">{ANIVERSARIO_PUNTOS[n]}</p>
              </div>
            ))}
          </div>
          <dl className="mt-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-marca-linea/70 py-2.5">
              <dt className="text-marca-gris">Amiga recomendada*</dt><dd className="text-right text-marca-negro">{R.referidaDescuento}% en tu próxima cita</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-marca-linea/70 py-2.5">
              <dt className="text-marca-gris">{R.constanciaVisitas} visitas seguidas</dt><dd className="text-right text-marca-negro">Ampolleta de hidratación</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-marca-gris">
            Si pasan {R.inactividad1Dias} días sin visita ni compra se pierde el {R.inactividad1Pct}% de los puntos; a los {R.inactividad2Dias}, el {R.inactividad2Pct}%,
            y después el {R.inactividadPct}% cada {R.inactividadCadaDias} días. En Dorado y Ónix tienes {R.graciaExtraAltos} días más. Cualquier visita o compra reinicia la cuenta.
          </p>
        </section>
      </main>
    </>
  )
}
