import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { miClub, misDatos, pedirCodigo, salir, sesion, verificarCodigo, type MiClub } from '@/api'
import { AVISO_GASTO, pesos } from '@/salon'
import NoSoyRobot, { conTurnstile } from '@/components/NoSoyRobot'

// Tarjeta del Club de la clienta: entra con su teléfono y un código que le llega por WhatsApp; luego ve sus puntos,
// nivel, saldo en pesos, regalos disponibles y próximas citas, calculados con las mismas reglas de CB Control.
const fecha = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

export default function TarjetaClub() {
  const [datos, setDatos] = useState<MiClub | null>(null)
  const [conSesion, setConSesion] = useState(!!sesion())
  const [telefono, setTelefono] = useState(misDatos().telefono)
  const [reto, setReto] = useState('')
  const [codigo, setCodigo] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')
  const [robot, setRobot] = useState('')   // «no soy robot» para pedir el código (uno por envío)
  const [vueltaRobot, setVueltaRobot] = useState(0)

  useEffect(() => {
    if (!conSesion) return
    miClub().then(setDatos).catch(e => { setError(e.message); if (!sesion()) setConSesion(false) })
  }, [conSesion])

  const accion = (fn: () => Promise<void>) => async () => {
    setTrabajando(true); setError('')
    try { await fn() } catch (e) { setError((e as Error).message) } finally { setTrabajando(false) }
  }
  const mandar = accion(async () => { try { setReto((await pedirCodigo(telefono, robot)).reto) } finally { setRobot(''); setVueltaRobot(v => v + 1) } })
  const entrar = accion(async () => { await verificarCodigo(reto, codigo); setReto(''); setCodigo(''); setConSesion(true) })

  const marco = 'relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2B2B2B] via-[#151515] to-[#0B0B0B] p-6 text-white shadow-[0_24px_48px_-24px_rgba(17,17,17,0.6)]'

  if (!conSesion) return (
    <div className={marco}>
      <img src="./icons/monograma.svg" alt="" className="absolute -bottom-10 -right-8 h-48 opacity-[0.12]" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <img src="./icons/monograma.svg" alt="" className="h-8" />
          <p className="rotulo text-marca-dorado">Mi tarjeta</p>
        </div>
        <div>
          <p className="font-display text-2xl">Entra a tu Club</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">Te mandamos un código por WhatsApp para ver tus puntos, tu nivel y tus regalos.</p>
        </div>
        {!reto ? (
          <>
            <input className="w-full border-0 border-b border-white/30 bg-transparent px-0 py-2.5 text-base text-white outline-none placeholder:text-white/40 focus:border-marca-dorado"
              type="tel" inputMode="tel" autoComplete="tel" placeholder="Tu teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
            <NoSoyRobot key={vueltaRobot} onToken={setRobot} />
            <button onClick={mandar} disabled={trabajando || telefono.replace(/\D/g, '').length < 10 || (conTurnstile && !robot)} className="boton-dorado w-full disabled:opacity-40">
              {trabajando ? 'Enviando…' : 'Mandarme el código'}
            </button>
          </>
        ) : (
          <>
            <input className="w-full border-0 border-b border-white/30 bg-transparent px-0 py-2.5 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-marca-dorado"
              inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="······" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} />
            <button onClick={entrar} disabled={trabajando || codigo.length !== 6} className="boton-dorado w-full disabled:opacity-40">
              {trabajando ? 'Entrando…' : 'Entrar'}
            </button>
            <button onClick={() => { setReto(''); setCodigo('') }} className="w-full text-[11px] uppercase tracking-[0.2em] text-white/60">Cambiar teléfono</button>
          </>
        )}
        {error && <p className="text-sm text-[#E8B4AC]">{error}</p>}
      </div>
    </div>
  )

  if (!datos) return <div className={marco}><p className="text-sm text-white/70">{error || 'Cargando tu tarjeta…'}</p></div>

  if (!datos.registrada) return (
    <div className={marco}>
      <p className="font-display text-2xl">Aún no tienes tarjeta</p>
      <p className="mt-2 text-sm text-white/70">Únete abajo con este mismo teléfono y en tu primera visita recibes tus puntos de bienvenida.</p>
      <button onClick={() => { salir(); setConSesion(false); setDatos(null) }} className="mt-4 text-[11px] uppercase tracking-[0.2em] text-white/60">Usar otro teléfono</button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className={`${marco} aspect-[1.586]`}>
        <img src="./icons/monograma.svg" alt="" className="absolute -bottom-10 -right-8 h-48 opacity-[0.12]" />
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between">
            <img src="./icons/monograma.svg" alt="" className="h-8" />
            <p className="rotulo text-marca-dorado">{datos.nombreNivel}</p>
          </div>
          <div className="mt-auto">
            <p className="font-display text-3xl">{datos.nombre}</p>
            <p className="mt-1 text-sm text-white/80">{(datos.puntos || 0).toLocaleString('es-MX')} puntos</p>
            {datos.siguiente && <p className="mt-1 text-xs text-white/55">Te faltan {datos.siguiente.falta.toLocaleString('es-MX')} para {datos.siguiente.nivel}</p>}
          </div>
        </div>
      </div>
      <p className="border-l border-marca-dorado pl-3 text-sm leading-relaxed text-marca-grafito">{datos.saldoTexto}</p>
      {!!datos.saldoFavor && <p className="text-sm text-marca-gris">Saldo a favor: <span className="text-marca-negro">{pesos(datos.saldoFavor)}</span></p>}

      {datos.porFirmar?.map(f => (
        <Link key={f.id} to={`/firmar/${f.id}`} className="flex items-center justify-between gap-3 rounded-sm bg-white p-4 text-sm text-marca-grafito">
          <span>Tienes un consentimiento por firmar{f.servicio ? ` para ${f.servicio}` : ''}{f.fecha ? ` (${fecha(f.fecha)})` : ''}.</span>
          <span className="rotulo shrink-0 text-marca-dorado-prof">Firmar</span>
        </Link>
      ))}

      {!!datos.disponibles?.length && (
        <section>
          <p className="rotulo">Para ti, ahora</p>
          <ul className="mt-2 text-sm">
            {datos.disponibles.map((b, i) => (
              <li key={b.clave + i} className="flex justify-between gap-4 border-b border-marca-linea/70 py-2.5">
                <span className="text-marca-negro">{b.titulo.replace(/ \(\d+ pts\)$/, '')}</span>
                <span className="shrink-0 text-marca-gris">{b.puntos ? `${b.puntos} pts` : 'gratis'}</span>
              </li>
            ))}
          </ul>
          {datos.disponibles.some(b => b.puntos) && <p className="mt-2 text-xs text-marca-gris">{AVISO_GASTO}. Pídelo al pagar tu cita.</p>}
        </section>
      )}

      {!!datos.proximas?.length && (
        <section>
          <p className="rotulo">Tus próximas citas</p>
          <ul className="mt-2 text-sm">
            {datos.proximas.map(c => (
              <li key={c.fecha + c.hora} className="flex justify-between gap-4 border-b border-marca-linea/70 py-2.5">
                <span className="text-marca-negro">{c.servicio}</span>
                <span className="shrink-0 text-right text-marca-gris">{fecha(c.fecha)} · {c.hora}<span className="block text-[10px] uppercase tracking-[0.16em]">{c.estado === 'pendiente' ? 'por confirmar' : c.estado}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!!datos.movimientos?.length && (
        <section>
          <p className="rotulo">Tus últimos puntos</p>
          <ul className="mt-2 text-sm">
            {datos.movimientos.map((m, i) => (
              <li key={i} className="flex justify-between gap-4 border-b border-marca-linea/70 py-2">
                <span className="text-marca-gris">{fecha(m.fecha)} · {m.concepto}</span>
                <span className={m.puntos < 0 ? 'text-red-700' : 'text-marca-negro'}>{m.puntos > 0 ? '+' : ''}{m.puntos}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <button onClick={() => { salir(); setConSesion(false); setDatos(null) }} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-marca-gris">
        <LogOut size={13} /> Salir de mi tarjeta
      </button>
    </div>
  )
}
