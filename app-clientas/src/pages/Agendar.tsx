import { useEffect, useRef, useState } from 'react'
import { Check, MessageCircle } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import { NOMBRE_CLUB, POLITICAS, SERVICIOS, enlaceWhatsApp, nombreCategoria, pesos, type Servicio } from '@/salon'
import { fechaCumple } from '@/components/UnirmeClub'
import { crearCita, disponibilidad, misDatos, recordarDatos, serviciosEnLinea, type DiaLibre } from '@/api'

// Agenda en tiempo real: los horarios salen del mismo motor que usa CB Control (API /api/disponibilidad) y la cita
// se aparta al enviar; llega «pendiente» a CB Control y a la bandeja de avisos para que el salón la confirme.
// Si la API no responde, queda WhatsApp como respaldo.
const ORDEN = ['color', 'corte', 'tratamiento', 'maquillaje', 'peinado']   // el color primero: es la especialidad
const categoriasDe = (lista: Servicio[]) => [...new Set(lista.map(s => s.categoria))].sort((a, b) => (ORDEN.indexOf(a) + 1 || 99) - (ORDEN.indexOf(b) + 1 || 99))

const horas = (min: number) => min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`

export default function Agendar() {
  // Catálogo vivo de CB Control; mientras carga (o si la API falla) se muestra el de la app
  const [catalogo, setCatalogo] = useState<Servicio[] | null>(null)
  useEffect(() => { serviciosEnLinea().then(l => setCatalogo(l.length ? l : SERVICIOS)).catch(() => setCatalogo(SERVICIOS)) }, [])
  const categorias = categoriasDe(catalogo || [])
  const [elegido, setElegido] = useState<Servicio | null>(null)
  const [datos, setDatos] = useState(misDatos)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [notas, setNotas] = useState('')
  const [club, setClub] = useState(false)   // quiere unirse al Club con esta cita (no es obligatorio)
  const [trampa, setTrampa] = useState('')  // campo oculto: solo los robots lo llenan
  const [dias, setDias] = useState<DiaLibre[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [lista, setLista] = useState<{ fecha: string; hora: string; servicio: string; anticipo: number } | null>(null)
  const formulario = useRef<HTMLElement>(null)

  const cargarHorarios = (s: Servicio) => {
    setCargando(true); setError(''); setDias(null)
    disponibilidad(s.id)
      .then(r => { setDias(r.dias); const primero = r.dias.find(d => d.horas.length); setFecha(f => r.dias.some(d => d.fecha === f && d.horas.length) ? f : primero?.fecha || '') })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }
  useEffect(() => {
    if (!elegido) return
    formulario.current?.scrollIntoView({ behavior: 'smooth' })
    setHora(''); cargarHorarios(elegido)
  }, [elegido])

  const enviar = async () => {
    if (!elegido || !hora) return
    setEnviando(true); setError('')
    try {
      const r = await crearCita({ servicioId: elegido.id, fecha, hora, ...datos, notas, club, sitio: trampa })
      recordarDatos(datos)
      setLista(r.cita)
      setTimeout(() => formulario.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) {
      const err = e as { message: string; status?: number }
      setError(err.message)
      if (err.status === 409) cargarHorarios(elegido)   // el horario se ocupó: se actualizan los libres
    } finally { setEnviando(false) }
  }

  const mensajeWhatsApp = elegido ? [
    `Hola, soy ${datos.nombre.trim() || '(mi nombre)'}. Quiero agendar: ${elegido.nombre} (desde ${pesos(elegido.precio)}).`,
    fecha && `Me acomoda el ${new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}${hora ? ` a las ${hora}` : ''}.`,
    notas.trim(),
    club && `Quiero unirme al ${NOMBRE_CLUB}${datos.cumple ? `; mi cumpleaños es el ${fechaCumple(datos.cumple)}` : ''}.`
  ].filter(Boolean).join(' ') : ''

  return (
    <>
      <Encabezado rotulo="Paso 1 de 2 · Servicio" titulo="Agenda tu cita" bajada="Elige tu servicio, el día y la hora: tu lugar queda apartado al momento." />
      <nav className="sticky top-0 z-[5] -mt-2 mb-4 flex gap-2 overflow-x-auto bg-marca-marfil/90 px-6 py-3 backdrop-blur-md [scrollbar-width:none]">
        {categorias.map(cat => (
          <button key={cat} onClick={() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 rounded-full border border-marca-linea px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-marca-grafito active:border-marca-dorado">
            {nombreCategoria(cat)}
          </button>
        ))}
      </nav>
      <main className="space-y-10 px-6 pb-8">
        {!catalogo && <p className="text-sm text-marca-gris">Cargando servicios…</p>}
        {categorias.map(cat => (
          <section key={cat} id={`cat-${cat}`} className="scroll-mt-16">
            <p className="rotulo">{nombreCategoria(cat)}</p>
            <div className="mt-2">
              {(catalogo || []).filter(s => s.categoria === cat).map(s => {
                const activo = elegido?.id === s.id
                return (
                  <button key={s.id} onClick={() => { setLista(null); setElegido(s) }}
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

        {elegido && !lista && (
          <section ref={formulario} className="tarjeta aparece scroll-mt-6 space-y-5 p-6">
            <div>
              <p className="rotulo">Paso 2 de 2 · Día, hora y tus datos</p>
              <h2 className="titulo mt-2 text-3xl">{elegido.nombre}</h2>
              <p className="mt-1 text-sm text-marca-gris">Desde {pesos(elegido.precio)} · {horas(elegido.duracion)}</p>
            </div>

            {cargando && <p className="text-sm text-marca-gris">Buscando horarios libres…</p>}
            {dias && !cargando && (
              <>
                <div>
                  <span className="rotulo text-marca-gris">Día</span>
                  <div className="-mx-6 mt-2 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
                    {dias.map(d => {
                      const f = new Date(`${d.fecha}T12:00:00`)
                      const activo = d.fecha === fecha, vacio = !d.horas.length
                      return (
                        <button key={d.fecha} disabled={vacio} onClick={() => { setFecha(d.fecha); setHora('') }}
                          className={`flex w-14 shrink-0 flex-col items-center rounded-sm border py-2 transition ${activo ? 'border-marca-negro bg-marca-negro text-white' : vacio ? 'border-marca-linea/50 text-marca-gris/40' : 'border-marca-linea text-marca-negro'}`}>
                          <span className="text-[9px] uppercase tracking-[0.14em]">{f.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}</span>
                          <span className="font-display text-xl leading-tight">{f.getDate()}</span>
                          <span className="text-[9px] uppercase tracking-[0.1em]">{f.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}</span>
                        </button>
                      )
                    })}
                  </div>
                  {!dias.some(d => d.horas.length) && <p className="mt-2 text-sm text-marca-gris">No hay horarios libres en las próximas dos semanas. Escríbenos y te buscamos lugar.</p>}
                </div>
                {fecha && (
                  <div>
                    <span className="rotulo text-marca-gris">Hora</span>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {dias.find(d => d.fecha === fecha)?.horas.map(h => (
                        <button key={h} onClick={() => setHora(h)}
                          className={`rounded-sm border py-2.5 text-sm tabular-nums transition ${hora === h ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea text-marca-negro'}`}>{h}</button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <label className="block">
              <span className="rotulo text-marca-gris">Nombre completo</span>
              <input className="campo" autoComplete="name" value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} />
            </label>
            <label className="block">
              <span className="rotulo text-marca-gris">Teléfono (WhatsApp)</span>
              <input className="campo" type="tel" inputMode="tel" autoComplete="tel" value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} />
            </label>
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
                <input className="campo" type="date" value={datos.cumple} onChange={e => setDatos({ ...datos, cumple: e.target.value })} />
              </label>
            )}
            <input className="hidden" tabIndex={-1} autoComplete="off" value={trampa} onChange={e => setTrampa(e.target.value)} aria-hidden="true" />
            <p className="border-l border-marca-dorado pl-3 text-xs leading-relaxed text-marca-gris">
              Al enviar, tu solicitud llega al salón y te confirmamos por WhatsApp y te mandamos el anticipo{elegido.anticipo ? ` (${pesos(elegido.anticipo)})` : ''}.
              Los precios son desde: el final se confirma en tu valoración. {POLITICAS.cambios}
            </p>
            {error && <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button onClick={enviar} disabled={enviando || !hora} className="boton w-full disabled:opacity-40">
              {enviando ? 'Enviando…' : hora ? `Pedir ${hora}` : 'Elige día y hora'}
            </button>
            {(error || (dias === null && !cargando)) && (
              <a href={enlaceWhatsApp(mensajeWhatsApp)} className="boton-claro w-full"><MessageCircle size={16} strokeWidth={1.5} /> Mejor por WhatsApp</a>
            )}
          </section>
        )}

        {lista && (
          <section ref={formulario} className="tarjeta aparece scroll-mt-6 space-y-4 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-marca-negro text-marca-dorado"><Check size={22} /></span>
            <p className="rotulo">Solicitud recibida</p>
            <h2 className="titulo text-3xl">¡Listo, {datos.nombre.split(' ')[0]}!</h2>
            <p className="text-sm leading-relaxed text-marca-gris">
              {lista.servicio} · {new Date(`${lista.fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las {lista.hora}.
              Te confirmamos tu cita por WhatsApp{lista.anticipo ? ` y te mandamos el anticipo de ${pesos(lista.anticipo)}` : ''}.
            </p>
            <button onClick={() => { setLista(null); setElegido(null); setHora(''); setFecha('') }} className="text-xs uppercase tracking-[0.2em] text-marca-dorado-prof">Agendar otra cita</button>
          </section>
        )}
      </main>
    </>
  )
}
