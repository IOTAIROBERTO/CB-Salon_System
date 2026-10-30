import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Camera, Check, MessageCircle, RotateCcw, X } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import { NOMBRE_CLUB, POLITICAS_RESERVA, enlaceWhatsApp, nombreCategoria, pesos, type Servicio } from '@/salon'
import { reducirFoto } from '@/fotos'
import { fechaCumple } from '@/components/UnirmeClub'
import { citasGuardadas, crearCita, disponibilidad, guardarCita, misDatos, olvidarDatos, pedirCodigo, recordarDatos, serviciosEnLinea, sesion, verificarCodigo, type DiaLibre } from '@/api'
import ElegirHorario from '@/components/ElegirHorario'
import { leerCarrito, paraApartar, totalCarrito, vaciarCarrito } from '@/carrito'
import Ventana from '@/components/Ventana'
import NoSoyRobot, { conTurnstile } from '@/components/NoSoyRobot'
import { useEnVivo } from '@/vivo'

// Agenda en tiempo real: los horarios salen del mismo motor que usa CB Control (API /api/disponibilidad) y la cita
// se aparta al enviar; llega «pendiente» a CB Control y a la bandeja de avisos para que el salón la confirme.
// Si la API no responde, queda WhatsApp como respaldo. «No soy robot» (Turnstile) en cada envío; con el WhatsApp del
// salón conectado, la API pide confirmar el teléfono con un código antes de apartar (428) y aquí se pide en el momento.
const ORDEN = ['color', 'corte', 'tratamiento', 'maquillaje', 'peinado']   // el color primero: es la especialidad
const categoriasDe = (lista: Servicio[]) => [...new Set(lista.map(s => s.categoria))].sort((a, b) => (ORDEN.indexOf(a) + 1 || 99) - (ORDEN.indexOf(b) + 1 || 99))

const horas = (min: number) => min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`

/** Vista previa antes de pedir: la clienta revisa y acepta lo que pide (servicio, día y hora, precio «desde», anticipo
 *  y políticas). La API guarda la constancia (`politicasAceptadas`). */
function VistaPrevia({ servicio, fecha, hora, nombre, telefono, valoracion, onAceptar, onCerrar }: {
  servicio: Servicio; fecha: string; hora: string; nombre: string; telefono: string; valoracion: boolean; onAceptar: () => void; onCerrar: () => void
}) {
  const dia = new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  // Si en este teléfono ya pidió ese servicio, mejor cambiar esa cita que pedir otra
  const ya = citasGuardadas().find(c => c.servicio === servicio.nombre && c.fecha >= new Date().toLocaleDateString('en-CA'))
  const renglon = 'flex gap-4 border-b border-marca-linea/70 py-3 last:border-0'
  const carrito = leerCarrito()
  return (
    <Ventana onCerrar={onCerrar}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="rotulo">Revisa tu solicitud</p>
            <h2 className="titulo mt-1 text-3xl">{servicio.nombre}</h2>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="p-2 text-marca-gris"><X size={18} strokeWidth={1.5} /></button>
        </div>
        <div className="mt-4 text-sm">
          <div className={renglon}><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Cuándo</span><span className="text-marca-negro">{dia.charAt(0).toUpperCase() + dia.slice(1)} a las {hora}</span></div>
          <div className={renglon}><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Precio</span>
            <span className="text-marca-negro">Desde {pesos(servicio.precio)}<span className="block text-marca-gris">{valoracion ? 'Con tus fotos y respuestas Cristina te confirma el precio final antes de tu cita.' : 'Cristina te confirma el precio final antes de tu cita.'}</span></span></div>
          <div className={renglon}><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Anticipo</span>
            <span className="text-marca-negro">{servicio.anticipo > 0 ? <>{pesos(servicio.anticipo)} para apartar<span className="block text-marca-gris">Te pasamos cómo pagarlo al confirmar. En la app no se cobra nada.</span></> : 'Sin anticipo'}</span></div>
          {carrito.length > 0 && (
            <div className={renglon}><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Productos</span>
              <span className="text-marca-negro">{carrito.map(i => `${i.cantidad} × ${i.nombre}`).join(', ')} · {pesos(totalCarrito(carrito))}
                <span className="block text-marca-gris">Se apartan con tu cita y los pagas junto con tu anticipo: cuando Cristina la confirme tendrás 48 horas para pagar (y nunca después de 48 horas antes de tu cita). Si no, tu cita y tus productos se liberan solos.</span></span></div>
          )}
          <div className={renglon}><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">A nombre de</span><span className="min-w-0 break-words text-marca-negro">{nombre || '—'} · {telefono || '—'}</span></div>
        </div>
        <ul className="mt-3 list-disc space-y-1 border-l border-marca-dorado pl-7 text-xs leading-relaxed text-marca-gris">
          {POLITICAS_RESERVA.map(p => <li key={p}>{p}</li>)}
        </ul>
        {ya && (
          <p className="mt-4 rounded-sm bg-marca-marfil p-3 text-xs leading-relaxed text-marca-grafito">
            Ya pediste {servicio.nombre} para el {new Date(`${ya.fecha}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} desde este teléfono.
            Si quieres otro día u hora, <Link to={`/cita/${ya.ref}`} className="underline">cámbiala en «Mi cita»</Link> en vez de pedir otra.
          </p>
        )}
        <button onClick={onAceptar} className="boton mt-5 w-full">Acepto y pido mi cita</button>
        <button onClick={onCerrar} className="mt-2 w-full py-3 text-[11px] uppercase tracking-[0.2em] text-marca-gris">Cambiar algo</button>
    </Ventana>
  )
}

export default function Agendar() {
  // Catálogo vivo de CB Control (nombres y precios de hoy). Si la API falla no se muestra uno viejo: se ofrece WhatsApp
  const [catalogo, setCatalogo] = useState<Servicio[] | null>(null)
  const [sinCatalogo, setSinCatalogo] = useState(false)
  // En vivo: al abrir, al volver a la app y cada minuto (nombres, precios y anticipos que se cambien en CB Control)
  useEnVivo(() => serviciosEnLinea()
    .then(l => { setCatalogo(l); setSinCatalogo(false); setElegido(e => e && (l.find(x => x.id === e.id) ?? e)) })
    .catch(() => { if (!catalogo) setSinCatalogo(true) }))
  const categorias = categoriasDe(catalogo || [])
  const [elegido, setElegido] = useState<Servicio | null>(null)
  const [datos, setDatos] = useState(misDatos)
  // Clienta que ya agendó en este celular: sus datos van en un renglón (sin volver a escribirlos) y su último servicio a un toque
  const [editandoDatos, setEditandoDatos] = useState(() => !(misDatos().nombre && misDatos().telefono))
  const [recordar, setRecordar] = useState(true)
  const [revisando, setRevisando] = useState(false)   // vista previa: la clienta acepta el resumen antes de pedir
  const ultimo = catalogo?.find(s => s.id === datos.ultimoServicio)
  // «Agendar otra vez» desde Inicio llega con ?servicio=<id>: se elige solo en cuanto carga el catálogo
  const [params] = useSearchParams()
  useEffect(() => {
    const pedido = catalogo?.find(s => s.id === params.get('servicio'))
    if (pedido) setElegido(e => e ?? pedido)
  }, [catalogo, params])
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [notas, setNotas] = useState('')
  const [club, setClub] = useState(false)   // quiere unirse al Club con esta cita (no es obligatorio)
  const [trampa, setTrampa] = useState('')  // campo oculto: solo los robots lo llenan
  const [dias, setDias] = useState<DiaLibre[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [lista, setLista] = useState<{ fecha: string; hora: string; servicio: string; anticipo: number; enlace: string } | null>(null)
  const formulario = useRef<HTMLElement>(null)
  const [robot, setRobot] = useState('')          // token de Turnstile (sirve una vez)
  const [vueltaRobot, setVueltaRobot] = useState(0)
  const otroRobot = () => { setRobot(''); setVueltaRobot(v => v + 1) }
  const [reto, setReto] = useState('')            // código por WhatsApp pedido para confirmar el teléfono
  const [codigo, setCodigo] = useState('')
  // Cómo trae su cabello (servicios de color): con esto y las fotos Cristina valora el precio antes de la cita
  const [cabello, setCabello] = useState<{ largo?: string; color?: string; quimicos?: boolean; busca?: string }>({})
  const [fotos, setFotos] = useState<string[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const pideValoracion = elegido?.categoria === 'color'
  const descripcion = (s: Servicio) => s.descripcion || ''   // la escribe Cristina en Catálogo
  const agregarFotos = async (lista: FileList | null) => {
    if (!lista) return
    setSubiendo(true); setError('')
    try { for (const f of [...lista].slice(0, 4 - fotos.length)) { const foto = await reducirFoto(f); setFotos(v => [...v, foto].slice(0, 4)) } }
    catch { setError('No se pudo leer una foto. Prueba con otra (JPG o PNG).') }
    finally { setSubiendo(false) }
  }
  // En el celular el formulario queda abajo de la lista y se baja a él; en computadora ya está a la derecha
  const bajarAlFormulario = () => { if (!matchMedia('(min-width: 1024px)').matches) formulario.current?.scrollIntoView({ behavior: 'smooth' }) }

  const cargarHorarios = (s: Servicio) => {
    setCargando(true); setError(''); setDias(null)
    disponibilidad(s.id)
      .then(r => { setDias(r.dias); const primero = r.dias.find(d => d.horas.length); setFecha(f => r.dias.some(d => d.fecha === f && d.horas.length) ? f : primero?.fecha || '') })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }
  useEffect(() => {
    if (!elegido) return
    bajarAlFormulario()
    setHora(''); cargarHorarios(elegido)
  }, [elegido?.id])   // por id: el refresco del catálogo actualiza precio y nombre sin borrar la hora elegida
  useEnVivo(() => elegido && !lista && disponibilidad(elegido.id).then(r => {
    setDias(r.dias)
    setHora(h => h && r.dias.find(d => d.fecha === fecha)?.horas.includes(h) ? h : '')
  }).catch(() => { /* se queda lo último */ }), 60_000, !!elegido)

  const enviar = async () => {
    if (!elegido || !hora) return
    setRevisando(false); setEnviando(true); setError('')
    try {
      const carrito = leerCarrito()
      const r = await crearCita({ servicioId: elegido.id, fecha, hora, ...datos, notas, club, sitio: trampa, turnstile: robot, acepta: true, productos: paraApartar(carrito),
        ...(pideValoracion ? { valoracion: cabello, fotos } : {}) })
      if (recordar) recordarDatos({ ...datos, ultimoServicio: elegido.id }); else olvidarDatos()
      if (r.cita.enlace) { guardarCita({ ref: r.cita.enlace, fecha: r.cita.fecha, hora: r.cita.hora, servicio: r.cita.servicio }); vaciarCarrito() }
      setLista(r.cita)
      setReto('')
      otroRobot()
      setTimeout(bajarAlFormulario, 50)
    } catch (e) {
      const err = e as { message: string; status?: number }
      if (err.status === 428) {   // falta confirmar el teléfono: el mismo token (aún sin usar) sirve para pedir el código
        try { setReto((await pedirCodigo(datos.telefono, robot)).reto) } catch (e2) { setError((e2 as Error).message) }
      } else setError(err.message)
      otroRobot()
      if (err.status === 409) cargarHorarios(elegido)   // el horario se ocupó: se actualizan los libres
    } finally { setEnviando(false) }
  }

  /** Con el código correcto queda la sesión en este celular y se vuelve a pedir la cita */
  const confirmarTelefono = async () => {
    setEnviando(true); setError('')
    try { await verificarCodigo(reto, codigo); setCodigo('') } catch (e) { setError((e as Error).message); setEnviando(false); return }
    await enviar()
  }

  const mensajeWhatsApp = elegido ? [
    `Hola, soy ${datos.nombre.trim() || '(mi nombre)'}. Quiero agendar: ${elegido.nombre} (desde ${pesos(elegido.precio)}).`,
    fecha && `Me acomoda el ${new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}${hora ? ` a las ${hora}` : ''}.`,
    notas.trim(),
    club && `Quiero unirme al ${NOMBRE_CLUB}${datos.cumple ? `; mi cumpleaños es el ${fechaCumple(datos.cumple)}` : ''}.`
  ].filter(Boolean).join(' ') : ''

  return (
    <>
      <Encabezado rotulo="Paso 1 de 2 · Servicio" titulo="Agenda tu cita" bajada="Elige tu servicio, el día y la hora. Ves los horarios libres en tiempo real y tu lugar queda apartado al enviar." />
      <nav className="contenido sticky top-0 z-[5] -mt-2 mb-4 flex gap-2 overflow-x-auto bg-marca-marfil/90 px-6 py-3 backdrop-blur-md [scrollbar-width:none] lg:top-16 lg:mb-8">
        {categorias.map(cat => (
          <button key={cat} onClick={() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 rounded-full border border-marca-linea px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-marca-grafito active:border-marca-dorado">
            {nombreCategoria(cat)}
          </button>
        ))}
      </nav>
      <main className="contenido space-y-10 px-6 pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-14 lg:space-y-0">
        <div className="space-y-10">
        <div className="rounded-sm border-l-2 border-marca-dorado bg-white p-4 text-sm leading-relaxed text-marca-grafito">
          <p className="text-marca-negro">¿No sabes cuál pedir?</p>
          <p className="mt-1 text-marca-gris">Elige el que más se parezca: con tus fotos Cristina te dice cuál necesitas y su precio antes de tu cita. Toca «Más info» para ver qué es cada uno, o <a href={enlaceWhatsApp('Hola, no sé qué servicio pedir. Te mando fotos de mi cabello:')} className="underline">pregúntanos por WhatsApp</a>.</p>
        </div>
        {ultimo && !elegido && (
          <button onClick={() => setElegido(ultimo)} className="tarjeta flex w-full items-center gap-4 text-left">
            <RotateCcw size={18} strokeWidth={1.4} className="shrink-0 text-marca-dorado" />
            <span className="min-w-0 flex-1">
              <span className="rotulo block">Lo de siempre</span>
              <span className="mt-1 block font-display text-xl text-marca-negro">{ultimo.nombre}</span>
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof">Agendar</span>
          </button>
        )}
        {!catalogo && !sinCatalogo && <p className="text-sm text-marca-gris">Cargando servicios…</p>}
        {sinCatalogo && <p className="text-sm text-marca-gris">No pudimos cargar los servicios. Revisa tu internet o <a href={enlaceWhatsApp('Hola, quiero agendar una cita.')} className="underline">agenda por WhatsApp</a>.</p>}
        {categorias.map(cat => (
          <section key={cat} id={`cat-${cat}`} className="scroll-mt-16">
            <p className="rotulo">{nombreCategoria(cat)}</p>
            <div className="mt-2">
              {(catalogo || []).filter(s => s.categoria === cat).map(s => {
                const activo = elegido?.id === s.id
                return (
                  <div key={s.id} className="border-b border-marca-linea/70">
                  <button onClick={() => { setLista(null); setElegido(s) }}
                    className="flex w-full items-center gap-4 pb-2 pt-4 text-left transition-colors">
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
                  {descripcion(s)
                    ? <details className="pb-3 text-sm text-marca-gris"><summary className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-marca-dorado-prof">Más info</summary><p className="mt-1 leading-relaxed">{descripcion(s)}</p></details>
                    : <div className="pb-2" />}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
        </div>

        {!elegido && !lista && (
          <aside className="tarjeta hidden space-y-3 p-8 lg:sticky lg:top-36 lg:block">
            <p className="rotulo">Paso 2 de 2</p>
            <p className="titulo text-2xl">Día, hora y tus datos</p>
            <p className="text-sm leading-relaxed text-marca-gris">Elige un servicio de la lista y aquí aparecen los días y horarios libres en tiempo real.</p>
          </aside>
        )}

        {elegido && !lista && (
          <section ref={formulario} className="tarjeta aparece scroll-mt-6 space-y-5 p-6 lg:sticky lg:top-36 lg:max-h-[calc(100svh-10rem)] lg:overflow-y-auto">
            <div>
              <p className="rotulo">Paso 2 de 2 · Día, hora y tus datos</p>
              <h2 className="titulo mt-2 text-3xl">{elegido.nombre}</h2>
              <p className="mt-1 text-sm text-marca-gris">Desde {pesos(elegido.precio)} · {horas(elegido.duracion)}</p>
            </div>

            {cargando && <p className="text-sm text-marca-gris">Buscando horarios libres…</p>}
            {dias && !cargando && (
              <ElegirHorario dias={dias} fecha={fecha} hora={hora} onFecha={setFecha} onHora={setHora}>
                {!dias.some(d => d.horas.length) && <p className="mt-2 text-sm text-marca-gris">No hay horarios libres en las próximas dos semanas. Escríbenos y te buscamos lugar.</p>}
                <p className="mt-2 text-xs text-marca-gris">¿Para hoy? Cristina lo revisa en su agenda: <a href={enlaceWhatsApp(`Hola, ¿tienen espacio hoy para ${elegido.nombre}?`)} className="underline">escríbenos por WhatsApp</a>.</p>
              </ElegirHorario>
            )}

            {pideValoracion && (
              <div className="space-y-4 rounded-sm bg-marca-marfil p-4">
                <div>
                  <p className="rotulo">Tu cabello hoy</p>
                  <p className="mt-1 text-xs leading-relaxed text-marca-gris">Con esto y tus fotos Cristina te confirma el precio antes de tu cita.</p>
                </div>
                <div>
                  <span className="text-xs text-marca-gris">Largo</span>
                  <div className="mt-1 flex flex-wrap gap-2">{['corto', 'hombros', 'media espalda', 'cintura o más'].map(o => (
                    <button key={o} type="button" onClick={() => setCabello({ ...cabello, largo: o })} className={`rounded-full border px-3 py-1 text-xs ${cabello.largo === o ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea bg-white'}`}>{o}</button>))}</div>
                </div>
                <div>
                  <span className="text-xs text-marca-gris">¿Qué color tienes ahora?</span>
                  <div className="mt-1 flex flex-wrap gap-2">{['natural', 'tinte', 'decoloración o mechas'].map(o => (
                    <button key={o} type="button" onClick={() => setCabello({ ...cabello, color: o })} className={`rounded-full border px-3 py-1 text-xs ${cabello.color === o ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea bg-white'}`}>{o}</button>))}</div>
                </div>
                <div>
                  <span className="text-xs text-marca-gris">¿Alaciado, keratina o permanente en los últimos 6 meses?</span>
                  <div className="mt-1 flex gap-2">{[true, false].map(o => (
                    <button key={String(o)} type="button" onClick={() => setCabello({ ...cabello, quimicos: o })} className={`rounded-full border px-4 py-1 text-xs ${cabello.quimicos === o ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea bg-white'}`}>{o ? 'Sí' : 'No'}</button>))}</div>
                </div>
                <label className="block">
                  <span className="text-xs text-marca-gris">¿Qué resultado buscas?</span>
                  <input className="campo" value={cabello.busca || ''} onChange={e => setCabello({ ...cabello, busca: e.target.value })} placeholder="Rubio más claro, cubrir canas…" />
                </label>
                <div>
                  <span className="text-xs text-marca-gris">Fotos de tu cabello (frente, atrás y raíz; hasta 4)</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fotos.map((f, i) => (
                      <span key={i} className="relative">
                        <img src={f} alt={`Foto ${i + 1}`} className="h-16 w-16 rounded-sm object-cover" />
                        <button type="button" onClick={() => setFotos(fotos.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 rounded-full bg-marca-negro p-0.5 text-white" aria-label="Quitar foto"><X size={12} /></button>
                      </span>
                    ))}
                    {fotos.length < 4 && (
                      <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-sm border border-dashed border-marca-linea bg-white text-marca-gris">
                        {subiendo ? '…' : <Camera size={18} strokeWidth={1.4} />}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={e => { agregarFotos(e.target.files); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {editandoDatos ? (<>
              <label className="block">
                <span className="rotulo text-marca-gris">Nombre completo</span>
                <input className="campo" autoComplete="name" value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} />
              </label>
              <label className="block">
                <span className="rotulo text-marca-gris">Teléfono (WhatsApp)</span>
                <input className="campo" type="tel" inputMode="tel" autoComplete="tel" value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} />
              </label>
              <label className="flex items-center gap-3 text-xs text-marca-gris">
                <input type="checkbox" checked={recordar} onChange={e => setRecordar(e.target.checked)} className="h-4 w-4 accent-marca-dorado-prof" />
                Recordar mis datos en este teléfono para la próxima vez
              </label>
            </>) : (
              <div className="flex items-center gap-3 border-b border-marca-linea pb-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="rotulo block text-marca-gris">Agendas como</span>
                  <span className="mt-1 block truncate text-marca-negro">{datos.nombre} · {datos.telefono}</span>
                </span>
                <button type="button" onClick={() => setEditandoDatos(true)} className="py-2 text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof">Cambiar</button>
              </div>
            )}
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
            {reto && (
              <div className="space-y-3 rounded-sm bg-marca-marfil p-4">
                <p className="text-sm leading-relaxed text-marca-grafito">Te mandamos un código por WhatsApp al {datos.telefono}. Escríbelo para apartar tu horario.</p>
                <input className="campo text-center text-2xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  placeholder="······" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} />
              </div>
            )}
            <NoSoyRobot key={vueltaRobot} onToken={setRobot} />
            {error && <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {reto
              ? <button onClick={confirmarTelefono} disabled={enviando || codigo.length !== 6} className="boton w-full disabled:opacity-40">
                  {enviando ? 'Confirmando…' : `Confirmar y apartar ${hora}`}
                </button>
              : <button onClick={() => setRevisando(true)} disabled={enviando || !hora || (conTurnstile && !robot && !sesion())} className="boton w-full disabled:opacity-40">
                  {enviando ? 'Enviando…' : !hora ? 'Elige día y hora' : conTurnstile && !robot && !sesion() ? 'Verificando…' : `Pedir ${hora}`}
                </button>}
            {(error || (dias === null && !cargando)) && (
              <a href={enlaceWhatsApp(mensajeWhatsApp)} className="boton-claro w-full"><MessageCircle size={16} strokeWidth={1.5} /> Mejor por WhatsApp</a>
            )}
          </section>
        )}

        {revisando && elegido && (
          <VistaPrevia servicio={elegido} fecha={fecha} hora={hora} nombre={datos.nombre} telefono={datos.telefono} valoracion={pideValoracion}
            onAceptar={enviar} onCerrar={() => setRevisando(false)} />
        )}

        {lista && (
          <section ref={formulario} className="tarjeta aparece scroll-mt-6 space-y-4 p-6 text-center lg:sticky lg:top-36">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-marca-negro text-marca-dorado"><Check size={22} /></span>
            <p className="rotulo">Solicitud recibida</p>
            <h2 className="titulo text-3xl">¡Listo, {datos.nombre.split(' ')[0]}!</h2>
            <p className="text-sm leading-relaxed text-marca-gris">
              {lista.servicio} · {new Date(`${lista.fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las {lista.hora}.
              Cristina revisa tu solicitud y te escribe por WhatsApp con el precio de tu servicio{lista.anticipo ? ' y, para confirmar, los datos de tu anticipo' : ''}.
              Si tu servicio lo pide, también te llega tu consentimiento para firmarlo aquí en la app.
            </p>
            {lista.enlace && <Link to={`/cita/${lista.enlace}`} className="boton w-full">Ver mi cita</Link>}
            {lista.enlace && <p className="text-xs leading-relaxed text-marca-gris">Ahí ves cuándo queda confirmada, y la cambias o cancelas tú misma. También aparece en Inicio.</p>}
            <a href={enlaceWhatsApp(`Hola, soy ${datos.nombre.trim()}. Acabo de pedir mi cita en la app: ${lista.servicio}, el ${new Date(`${lista.fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${lista.hora}.${fotos.length ? ' Ya mandé fotos de mi cabello.' : ''}`)}
              className={`${lista.enlace ? 'boton-claro' : 'boton'} w-full`}><MessageCircle size={16} strokeWidth={1.5} /> Avisar a Cristina por WhatsApp</a>
            <button onClick={() => { setLista(null); setElegido(null); setHora(''); setFecha(''); setFotos([]); setCabello({}) }} className="text-xs uppercase tracking-[0.2em] text-marca-dorado-prof">Agendar otra cita</button>
          </section>
        )}
      </main>
    </>
  )
}
