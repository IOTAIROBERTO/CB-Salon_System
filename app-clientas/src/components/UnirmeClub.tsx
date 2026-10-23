import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { NOMBRE_CLUB, REGLAS_CLUB, enlaceWhatsApp } from '@/salon'

// Fase 1: el alta al Club sale por WhatsApp ya escrita y el salón la registra en CB Control (ahí se activa la tarjeta).
// Con la API de la fase 3 la clienta se registrará sola y llegará a CB Control como «nueva en el Club».
export const fechaCumple = (f: string) => f ? new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : ''

export default function UnirmeClub() {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cumple, setCumple] = useState('')
  const listo = nombre.trim() && telefono.replace(/\D/g, '').length >= 10
  const mensaje = `Hola, quiero unirme al ${NOMBRE_CLUB}. Soy ${nombre.trim()}, mi teléfono es ${telefono.trim()}` +
    (cumple ? ` y mi cumpleaños es el ${fechaCumple(cumple)}.` : '.')

  return (
    <section className="tarjeta space-y-4 p-6">
      <div>
        <p className="rotulo">Gratis y sin compromiso</p>
        <h2 className="titulo mt-1 text-3xl">Únete al Club</h2>
        <p className="mt-2 text-sm leading-relaxed text-marca-gris">Desde tu primera visita empiezas a juntar puntos. Te registramos y te damos la bienvenida con {REGLAS_CLUB.bienvenida} puntos ({REGLAS_CLUB.bienvenida + REGLAS_CLUB.bienvenidaReferida} si te recomendó una amiga).</p>
      </div>
      <label className="block">
        <span className="rotulo text-marca-gris">Nombre completo</span>
        <input className="campo" value={nombre} onChange={e => setNombre(e.target.value)} autoComplete="name" />
      </label>
      <label className="block">
        <span className="rotulo text-marca-gris">Teléfono (WhatsApp)</span>
        <input className="campo" type="tel" inputMode="tel" value={telefono} onChange={e => setTelefono(e.target.value)} autoComplete="tel" />
      </label>
      <label className="block">
        <span className="rotulo text-marca-gris">Cumpleaños (para tus puntos dobles)</span>
        <input className="campo" type="date" value={cumple} onChange={e => setCumple(e.target.value)} />
      </label>
      <a href={listo ? enlaceWhatsApp(mensaje) : undefined} aria-disabled={!listo}
        className={`boton w-full ${listo ? '' : 'pointer-events-none opacity-40'}`}>
        <MessageCircle size={16} strokeWidth={1.5} /> Unirme por WhatsApp
      </a>
    </section>
  )
}
