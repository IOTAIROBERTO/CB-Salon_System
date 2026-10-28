import { useState } from 'react'
import { Check, MessageCircle } from 'lucide-react'
import { NOMBRE_CLUB, REGLAS_CLUB, enlaceWhatsApp } from '@/salon'
import { misDatos, recordarDatos, unirmeClub } from '@/api'
import NoSoyRobot, { conTurnstile } from '@/components/NoSoyRobot'

// Alta al Club directa: la API crea (o encuentra por teléfono) a la clienta en CB Control y avisa al salón.
// Si la API no responde, queda WhatsApp como respaldo.
export const fechaCumple = (f: string) => f ? new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : ''

export default function UnirmeClub() {
  const [datos, setDatos] = useState(misDatos)
  const [recomendo, setRecomendo] = useState('')
  const [trampa, setTrampa] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [hecho, setHecho] = useState(false)
  const [robot, setRobot] = useState('')   // token de «no soy robot» (uno por envío)
  const [vueltaRobot, setVueltaRobot] = useState(0)
  const listo = datos.nombre.trim().length >= 3 && datos.telefono.replace(/\D/g, '').length >= 10
  const mensaje = `Hola, quiero unirme al ${NOMBRE_CLUB}. Soy ${datos.nombre.trim()}, mi teléfono es ${datos.telefono.trim()}` +
    (datos.cumple ? ` y mi cumpleaños es el ${fechaCumple(datos.cumple)}.` : '.')

  const enviar = async () => {
    setEnviando(true); setError('')
    try {
      await unirmeClub({ ...datos, recomendo, sitio: trampa, turnstile: robot })
      setHecho(true)
      recordarDatos(datos)
    } catch (e) { setError((e as Error).message) } finally { setEnviando(false); setRobot(''); setVueltaRobot(v => v + 1) }
  }

  if (hecho) return (
    <section className="tarjeta aparece space-y-3 p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-marca-negro text-marca-dorado"><Check size={22} /></span>
      <p className="rotulo">Bienvenida</p>
      <h2 className="titulo text-3xl">Ya eres del Club, {datos.nombre.split(' ')[0]}</h2>
      <p className="text-sm leading-relaxed text-marca-gris">
        En tu primera visita recibes tus {REGLAS_CLUB.bienvenida} puntos de bienvenida{recomendo ? ' (y los extra por venir recomendada)' : ''}. Desde ahí, cada servicio y compra suma.
      </p>
    </section>
  )

  return (
    <section className="tarjeta space-y-4 p-6">
      <div>
        <p className="rotulo">Gratis y sin compromiso</p>
        <h2 className="titulo mt-1 text-3xl">Únete al Club</h2>
        <p className="mt-2 text-sm leading-relaxed text-marca-gris">Te registras aquí mismo y desde tu primera visita juntas puntos: {REGLAS_CLUB.bienvenida} de bienvenida ({REGLAS_CLUB.bienvenida + REGLAS_CLUB.bienvenidaReferida} si te recomendó una amiga).</p>
      </div>
      <label className="block">
        <span className="rotulo text-marca-gris">Nombre completo</span>
        <input className="campo" value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} autoComplete="name" />
      </label>
      <label className="block">
        <span className="rotulo text-marca-gris">Teléfono (WhatsApp)</span>
        <input className="campo" type="tel" inputMode="tel" value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} autoComplete="tel" />
      </label>
      <label className="block">
        <span className="rotulo text-marca-gris">Cumpleaños (para tus puntos dobles)</span>
        <input className="campo" type="date" value={datos.cumple} onChange={e => setDatos({ ...datos, cumple: e.target.value })} />
      </label>
      <label className="block">
        <span className="rotulo text-marca-gris">¿Te recomendó una amiga? Su teléfono (opcional)</span>
        <input className="campo" type="tel" inputMode="tel" value={recomendo} onChange={e => setRecomendo(e.target.value)} />
      </label>
      <input className="hidden" tabIndex={-1} autoComplete="off" value={trampa} onChange={e => setTrampa(e.target.value)} aria-hidden="true" />
      {error && <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <NoSoyRobot key={vueltaRobot} onToken={setRobot} />
      <button onClick={enviar} disabled={!listo || enviando || (conTurnstile && !robot)} className="boton w-full disabled:opacity-40">
        {enviando ? 'Registrando…' : 'Unirme al Club'}
      </button>
      {error && listo && (
        <a href={enlaceWhatsApp(mensaje)} className="boton-claro w-full"><MessageCircle size={16} strokeWidth={1.5} /> Mejor por WhatsApp</a>
      )}
    </section>
  )
}
