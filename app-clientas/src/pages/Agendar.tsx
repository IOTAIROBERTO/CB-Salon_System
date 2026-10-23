import { useEffect, useRef, useState } from 'react'
import { Check, MessageCircle } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import { NOMBRE_CLUB, POLITICAS, SERVICIOS, enlaceWhatsApp, nombreCategoria, pesos, type Servicio } from '@/salon'
import { fechaCumple } from '@/components/UnirmeClub'

// Fase 1: la solicitud sale por WhatsApp ya escrita. Cristina o Roberto confirman el horario y mandan el anticipo
// (decisión de la propuesta v7). Cuando exista la API, la solicitud llegará directo a CB Control.
const ORDEN = ['color', 'corte', 'tratamiento', 'maquillaje', 'peinado']   // el color primero: es la especialidad
const categorias = [...new Set(SERVICIOS.map(s => s.categoria))].sort((a, b) => (ORDEN.indexOf(a) + 1 || 99) - (ORDEN.indexOf(b) + 1 || 99))

const horas = (min: number) => min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`

export default function Agendar() {
  const [elegido, setElegido] = useState<Servicio | null>(null)
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [turno, setTurno] = useState('mañana')
  const [notas, setNotas] = useState('')
  const [club, setClub] = useState(false)   // quiere unirse al Club con esta cita (no es obligatorio)
  const [cumple, setCumple] = useState('')
  const formulario = useRef<HTMLElement>(null)
  useEffect(() => { if (elegido) formulario.current?.scrollIntoView({ behavior: 'smooth' }) }, [elegido])

  const mensaje = elegido && [
    `Hola, soy ${nombre.trim() || '(mi nombre)'}. Quiero agendar: ${elegido.nombre} (desde ${pesos(elegido.precio)}).`,
    fecha && `Me acomoda el ${new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} por la ${turno}.`,
    notas.trim() && notas.trim(),
    club && `Quiero unirme al ${NOMBRE_CLUB}${cumple ? `; mi cumpleaños es el ${fechaCumple(cumple)}` : ''}.`
  ].filter(Boolean).join(' ')

  return (
    <>
      <Encabezado rotulo="Paso 1 de 2 · Servicio" titulo="Agenda tu cita" bajada="Elige tu servicio y te confirmamos el horario por WhatsApp." />
      <nav className="sticky top-0 z-[5] -mt-2 mb-4 flex gap-2 overflow-x-auto bg-marca-marfil/90 px-6 py-3 backdrop-blur-md [scrollbar-width:none]">
        {categorias.map(cat => (
          <button key={cat} onClick={() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 rounded-full border border-marca-linea px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-marca-grafito active:border-marca-dorado">
            {nombreCategoria(cat)}
          </button>
        ))}
      </nav>
      <main className="space-y-10 px-6 pb-8">
        {categorias.map(cat => (
          <section key={cat} id={`cat-${cat}`} className="scroll-mt-16">
            <p className="rotulo">{nombreCategoria(cat)}</p>
            <div className="mt-2">
              {SERVICIOS.filter(s => s.categoria === cat).map(s => {
                const activo = elegido?.id === s.id
                return (
                  <button key={s.id} onClick={() => setElegido(s)}
                    className="flex w-full items-center gap-4 border-b border-marca-linea/70 py-4 text-left transition-colors">
                    <span className="min-w-0 flex-1">
                      <span className={`block font-display text-xl leading-snug ${activo ? 'text-marca-dorado-prof' : 'text-marca-negro'}`}>{s.nombre}</span>
                      <span className="mt-0.5 block text-xs tracking-wide text-marca-gris">{horas(s.duracion)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[9px] uppercase tracking-[0.22em] text-marca-gris">desde</span>
                      <span className="text-sm tabular-nums text-marca-negro">{pesos(s.precio)}</span>
                    </span>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${activo ? 'border-marca-dorado bg-marca-dorado text-white' : 'border-marca-linea'}`}>
                      {activo && <Check size={13} strokeWidth={2} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        {elegido && (
          <section ref={formulario} className="tarjeta aparece scroll-mt-6 space-y-5 p-6">
            <div>
              <p className="rotulo">Paso 2 de 2 · Tus datos</p>
              <h2 className="titulo mt-2 text-3xl">{elegido.nombre}</h2>
              <p className="mt-1 text-sm text-marca-gris">Desde {pesos(elegido.precio)} · {horas(elegido.duracion)}</p>
            </div>
            <label className="block">
              <span className="rotulo text-marca-gris">Nombre</span>
              <input className="campo" placeholder="¿Cómo te llamas?" value={nombre} onChange={e => setNombre(e.target.value)} />
            </label>
            <label className="block">
              <span className="rotulo text-marca-gris">Fecha que te acomoda</span>
              <input className="campo" type="date" value={fecha} onChange={e => setFecha(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['mañana', 'tarde'].map(t => (
                <button key={t} onClick={() => setTurno(t)}
                  className={`rounded-sm border py-3 text-[11px] uppercase tracking-[0.2em] transition ${turno === t ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea text-marca-gris'}`}>
                  Por la {t}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="rotulo text-marca-gris">Notas</span>
              <textarea className="campo resize-none" rows={2} placeholder="Largo de tu cabello, color actual…" value={notas} onChange={e => setNotas(e.target.value)} />
            </label>
            <label className="flex items-start gap-3 rounded-sm bg-marca-marfil p-4 text-sm leading-relaxed text-marca-grafito">
              <input type="checkbox" checked={club} onChange={e => setClub(e.target.checked)} className="mt-1 h-4 w-4 accent-marca-dorado-prof" />
              <span>Quiero unirme al {NOMBRE_CLUB} y que esta cita ya me dé puntos. <span className="text-marca-gris">Es gratis y opcional.</span></span>
            </label>
            {club && (
              <label className="block">
                <span className="rotulo text-marca-gris">Tu cumpleaños (puntos dobles ese mes)</span>
                <input className="campo" type="date" value={cumple} onChange={e => setCumple(e.target.value)} />
              </label>
            )}
            <p className="border-l border-marca-dorado pl-3 text-xs leading-relaxed text-marca-gris">
              Es una solicitud: te confirmamos el horario y te mandamos el anticipo para apartar{elegido.anticipo ? ` (${pesos(elegido.anticipo)})` : ''}.
              Los precios son desde: el final se confirma en tu valoración. {POLITICAS.cambios}
            </p>
            <a href={enlaceWhatsApp(mensaje || '')} className="boton w-full"><MessageCircle size={16} strokeWidth={1.5} /> Enviar por WhatsApp</a>
          </section>
        )}
      </main>
    </>
  )
}
