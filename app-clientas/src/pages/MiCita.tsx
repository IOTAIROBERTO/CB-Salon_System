import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarPlus, Check, Copy, MapPin, MessageCircle, RefreshCw, X } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import ElegirHorario from '@/components/ElegirHorario'
import Ventana from '@/components/Ventana'
import { aceptarMiCita, cancelarMiCita, disponibilidad, guardarCita, miCita, misDatos, olvidarCita, reagendarMiCita, serviciosEnLinea, type DiaLibre, type ServicioEnLinea, type VistaCita } from '@/api'
import { ENLACE_MAPA, enlaceWhatsApp, pesos } from '@/salon'
import { useEnVivo, useSalon } from '@/vivo'

// «Mi cita»: el enlace personal de cada cita (lo manda el salón por WhatsApp o sale al agendar). La clienta ve cómo va
// su cita en vivo y la cambia o la cancela sola con la política de reserva: con 48 h o más conserva su anticipo (si
// cancela, pasa a su saldo a favor); con menos solo puede cancelar y el anticipo se pierde.
const largo = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const corto = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
const horas = (min: number) => min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`

function estadoDe(c: VistaCita): { titulo: string; texto: string; color: string } {
  switch (c.estado) {
    case 'confirmada': return { titulo: 'Confirmada', texto: 'Te esperamos. Si necesitas cambiarla, hazlo aquí mismo.', color: 'bg-marca-negro text-white' }
    case 'iniciada': return { titulo: 'En curso', texto: 'Estás en el salón. ¡Disfruta tu cita!', color: 'bg-marca-negro text-white' }
    case 'completada': return { titulo: '¡Gracias por tu visita!', texto: 'Tu cita quedó registrada. Te esperamos pronto.', color: 'bg-marca-dorado text-marca-negro' }
    case 'cancelada': return {
      titulo: 'Cancelada', color: 'bg-marca-linea text-marca-negro',
      texto: c.anticipoASaldo ? `Tu anticipo de ${pesos(c.anticipoASaldo)} quedó como saldo a favor para tu próxima cita.`
        : c.anticipoPerdido ? `Se canceló con menos de 48 horas: el anticipo de ${pesos(c.anticipoPerdido)} no se devuelve.` : 'Tu horario quedó libre.'
    }
    case 'no_llego': return { titulo: 'No asististe', texto: c.anticipoPerdido ? `El anticipo de ${pesos(c.anticipoPerdido)} no se devuelve.` : 'Cuando quieras, agenda de nuevo.', color: 'bg-marca-linea text-marca-negro' }
    default: return c.porAceptar
      ? { titulo: 'Revisa y acepta', texto: 'Cristina ya revisó tu solicitud: acepta el resumen y el precio para continuar.', color: 'bg-marca-dorado text-marca-negro' }
      : c.anticipo && !c.anticipoPagado && c.precioAcordado
      ? { titulo: 'Falta tu anticipo', texto: 'Cristina ya revisó tu solicitud. Con tu anticipo tu cita queda confirmada.', color: 'bg-marca-dorado text-marca-negro' }
      : { titulo: 'Solicitud recibida', texto: 'Tu horario está apartado. Cristina revisa tu solicitud y te escribe por WhatsApp para confirmarla.', color: 'bg-marca-dorado text-marca-negro' }
  }
}

/** Archivo de calendario (.ics) con aviso un día antes y dos horas antes; las horas van en UTC (Hermosillo es UTC−7) */
function calendario(c: VistaCita, direccion: string) {
  const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const inicio = Date.parse(`${c.fecha}T${c.hora}:00-07:00`)
  const texto = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cristina Borquez Beauty Salon//Mi cita//ES', 'BEGIN:VEVENT',
    `UID:${c.fecha}-${c.hora}-${c.servicioId}@cristinaborquez`, `DTSTAMP:${utc(Date.now())}`, `DTSTART:${utc(inicio)}`,
    `DTEND:${utc(inicio + (c.duracion || 60) * 60000)}`, `SUMMARY:${texto(`${c.servicio} · Cristina Borquez`)}`, `LOCATION:${texto(direccion)}`,
    `DESCRIPTION:${texto(`Tu cita, siempre al día: ${location.href}`)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Mañana es tu cita', 'TRIGGER:-P1D', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Tu cita es en 2 horas', 'TRIGGER:-PT2H', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
}

export default function MiCita() {
  const { ref = '' } = useParams()
  const salon = useSalon().salon
  const nombre = misDatos().nombre.split(' ')[0]   // el que ella guardó en su teléfono: la API no manda datos de su ficha
  const [cita, setCita] = useState<VistaCita | null>(null)
  const [error, setError] = useState('')
  const [modo, setModo] = useState<'' | 'cancelar' | 'cambiar'>('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [dias, setDias] = useState<DiaLibre[] | null>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [resumenAbierto, setResumenAbierto] = useState(false)   // ventana para aceptar lo que dejó Cristina al valorar
  const [vistoResumen, setVistoResumen] = useState(false)       // se abre sola una vez; después, desde el botón
  const [catalogo, setCatalogo] = useState<ServicioEnLinea[] | null>(null)
  const [servicioNuevo, setServicioNuevo] = useState('')

  const mostrar = (c: VistaCita) => {
    setCita(c); setError(''); guardarCita({ ref, fecha: c.fecha, hora: c.hora, servicio: c.servicio })
    if (c.porAceptar && !vistoResumen) { setResumenAbierto(true); setVistoResumen(true) }
  }
  // En vivo: al abrir, al volver a la app y cada minuto (así ve cuando el salón la confirma); no mientras la cambia
  useEnVivo(() => !modo && miCita(ref).then(mostrar).catch(e => {
    if (e.status === 404) olvidarCita(ref)
    if (!cita) setError(e.message)
  }), 60_000)

  const cargarDias = (servicioId: string) => {
    setDias(null); setHora('')
    disponibilidad(servicioId)
      .then(r => { setDias(r.dias); setFecha(r.dias.find(d => d.horas.length)?.fecha || '') })
      .catch(e => setAviso(e.message))
  }
  const cambiar = () => {
    if (!cita) return
    setModo('cambiar'); setAviso(''); setServicioNuevo(cita.servicioId)
    if (cita.puedeCambiarServicio && !catalogo) serviciosEnLinea().then(setCatalogo).catch(() => { /* sin catálogo: solo día y hora */ })
    cargarDias(cita.servicioId)
  }
  const accion = async (f: () => Promise<VistaCita>, listo: string) => {
    setEnviando(true); setAviso('')
    try { mostrar(await f()); setModo(''); setAviso(listo) }
    catch (e) { setAviso((e as Error).message); if ((e as { status?: number }).status === 409 && modo === 'cambiar') cambiar() }
    finally { setEnviando(false) }
  }

  if (error && !cita) return (
    <>
      <Encabezado rotulo="Tu cita" titulo="No la encontramos" bajada={error} />
      <main className="contenido space-y-3 px-6">
        <a href={enlaceWhatsApp('Hola, quiero revisar mi cita.')} className="boton w-full"><MessageCircle size={16} strokeWidth={1.5} /> Escríbenos por WhatsApp</a>
        <Link to="/agendar" className="boton-claro w-full">Agendar una cita</Link>
      </main>
    </>
  )
  if (!cita) return <><Encabezado rotulo="Tu cita" titulo="Un momento…" /><p className="contenido px-6 text-sm text-marca-gris">Cargando tu cita…</p></>

  const e = estadoDe(cita)
  const futura = ['pendiente', 'confirmada'].includes(cita.estado)
  const consecuencia = cita.anticipo && cita.anticipoPagado
    ? cita.sinCosto ? `Faltan más de 48 horas: tu anticipo de ${pesos(cita.anticipo)} queda como saldo a favor para tu próxima cita.`
      : `Faltan menos de 48 horas: según la política de reserva, tu anticipo de ${pesos(cita.anticipo)} no se devuelve.`
    : 'Tu horario se libera para otra clienta.'

  return (
    <>
      <Encabezado rotulo={`Tu cita${nombre ? `, ${nombre}` : ''}`} titulo={cita.servicio} />
      <main className="contenido space-y-6 px-6 pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-14 lg:space-y-0">
        <div className="space-y-6">
          <section className={`rounded-sm p-5 ${e.color}`}>
            <p className="text-[10px] uppercase tracking-[0.28em] opacity-80">Estado</p>
            <p className="mt-1 font-display text-3xl">{e.titulo}</p>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{e.texto}</p>
          </section>
          {aviso && <p className="rounded-sm bg-white px-4 py-3 text-sm text-marca-grafito">{aviso}</p>}
          {cita.porAceptar && <button onClick={() => setResumenAbierto(true)} className="boton w-full">Revisar y aceptar</button>}

          <section className="tarjeta">
            {cita.resumen && (
              <div className="renglon">
                <span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Haremos</span>
                <span className="whitespace-pre-line text-marca-negro">{cita.resumen}</span>
              </div>
            )}
            <div className="renglon">
              <span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Cuándo</span>
              <span className="text-marca-negro">{mayuscula(largo(cita.fecha))} a las {cita.hora}{cita.duracion ? <span className="block text-sm text-marca-gris">Dura alrededor de {horas(cita.duracion)}</span> : null}</span>
            </div>
            <div className="renglon">
              <span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Precio</span>
              <span className="text-marca-negro">{cita.precioAcordado ? pesos(cita.precio) : `Desde ${pesos(cita.precio)}`}
                <span className="block text-sm text-marca-gris">{cita.aceptadaEn ? 'Precio final que aceptaste.' : cita.precioAcordado ? 'Precio final que propone Cristina.' : 'Cristina te confirma el precio de tu servicio.'}</span></span>
            </div>
            {cita.anticipo > 0 && (
              <div className="renglon">
                <span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Anticipo</span>
                <span className="min-w-0 flex-1 text-marca-negro">{pesos(cita.anticipo)} · {cita.anticipoPagado ? 'recibido, se descuenta del total' : cita.formaAnticipo === 'salon' ? 'lo pagas en el salón' : 'pendiente'}
                  {cita.datosPago && (
                    <span className="mt-2 block rounded-sm bg-marca-marfil p-3 text-sm leading-relaxed text-marca-grafito">
                      <span className="block whitespace-pre-line">{cita.datosPago}</span>
                      <button onClick={() => navigator.clipboard?.writeText(cita.datosPago).then(() => setCopiado(true))}
                        className="mt-2 flex min-h-[40px] items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof">
                        {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar datos'}
                      </button>
                      <span className="block text-xs text-marca-gris">Mándanos tu comprobante por WhatsApp y tu cita queda confirmada.</span>
                    </span>
                  )}
                </span>
              </div>
            )}
            <a href={ENLACE_MAPA} className="renglon">
              <span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Dónde</span>
              <span className="text-sm leading-relaxed text-marca-negro">{salon.direccion}<span className="mt-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof"><MapPin size={13} /> Cómo llegar</span></span>
            </a>
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24">
          {modo === 'cambiar' ? (
            <section className="tarjeta space-y-5 p-6">
              <div>
                <p className="rotulo">{cita.puedeCambiarServicio ? 'Cambiar servicio, día u hora' : 'Cambiar día u hora'}</p>
                <p className="mt-1 text-sm text-marca-gris">Horarios libres en tiempo real. Tu cita sigue {cita.estado === 'confirmada' ? 'confirmada' : 'igual'} y conservas tu anticipo.</p>
              </div>
              {cita.puedeCambiarServicio && catalogo && (
                <label className="block">
                  <span className="rotulo text-marca-gris">Servicio</span>
                  <select className="campo" value={servicioNuevo} onChange={e => { setServicioNuevo(e.target.value); cargarDias(e.target.value) }}>
                    {catalogo.map(s => <option key={s.id} value={s.id}>{s.nombre} · desde {pesos(s.precio)}</option>)}
                  </select>
                  <span className="mt-1 block text-xs text-marca-gris">Solo un servicio por cita: cambia este en vez de pedir otra. Cristina lo revisa antes de confirmarte.</span>
                </label>
              )}
              {!dias && !aviso && <p className="text-sm text-marca-gris">Buscando horarios libres…</p>}
              {dias && <ElegirHorario dias={dias} fecha={fecha} hora={hora} onFecha={setFecha} onHora={setHora} />}
              {hora && Date.parse(`${fecha}T${hora}:00-07:00`) - Date.now() < 48 * 3600000 && (
                <p className="rounded-sm bg-marca-marfil p-3 text-xs leading-relaxed text-marca-grafito">Ese horario es en menos de 48 horas: después ya no podrás cambiarla aquí y, si la cancelas, el anticipo no se devuelve.</p>
              )}
              <button disabled={!hora || enviando} onClick={() => accion(() => reagendarMiCita(ref, fecha, hora, servicioNuevo && servicioNuevo !== cita.servicioId ? servicioNuevo : undefined), 'Listo: tu cita cambió. Le avisamos a Cristina.')} className="boton w-full disabled:opacity-40">
                {enviando ? 'Cambiando…' : hora ? `Cambiar al ${corto(fecha)} a las ${hora}` : 'Elige día y hora'}
              </button>
              <button onClick={() => { setModo(''); setAviso('') }} className="w-full py-2 text-[11px] uppercase tracking-[0.2em] text-marca-gris">Volver</button>
            </section>
          ) : modo === 'cancelar' ? (
            <section className="tarjeta space-y-4 p-6">
              <p className="rotulo">Cancelar mi cita</p>
              <p className="text-sm leading-relaxed text-marca-grafito">{consecuencia}</p>
              <button disabled={enviando} onClick={() => accion(() => cancelarMiCita(ref), 'Tu cita quedó cancelada. Le avisamos a Cristina.')} className="boton w-full disabled:opacity-40">
                {enviando ? 'Cancelando…' : 'Sí, cancelar mi cita'}
              </button>
              <button onClick={() => setModo('')} className="boton-claro w-full">No, la conservo</button>
            </section>
          ) : (<>
            {futura && <a href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendario(cita, salon.direccion))}`} download="mi-cita.ics" className="boton w-full"><CalendarPlus size={16} strokeWidth={1.5} /> Agregar a mi calendario</a>}
            {cita.puedeReagendar && <button onClick={cambiar} className="boton-claro w-full"><RefreshCw size={15} strokeWidth={1.5} /> {cita.puedeCambiarServicio ? 'Cambiar servicio, día u hora' : 'Cambiar día u hora'}</button>}
            {cita.puedeCancelar && !cita.puedeReagendar && futura && (
              <p className="text-xs leading-relaxed text-marca-gris">Faltan menos de 48 horas: para cambiarla, escríbenos por WhatsApp.</p>
            )}
            {cita.puedeCancelar && <button onClick={() => { setModo('cancelar'); setAviso('') }} className="boton-claro w-full"><X size={15} strokeWidth={1.5} /> Cancelar mi cita</button>}
            <a href={enlaceWhatsApp(`Hola${nombre ? `, soy ${nombre}` : ''}. Sobre mi cita de ${cita.servicio} el ${largo(cita.fecha)} a las ${cita.hora}: `)} className="boton-claro w-full"><MessageCircle size={16} strokeWidth={1.5} /> Escríbenos</a>
            {!futura && <Link to="/agendar" className="boton w-full">Agendar otra cita</Link>}
            <p className="pt-2 text-xs leading-relaxed text-marca-gris">Cambios o cancelaciones con al menos 48 horas: conservas tu anticipo (si cancelas, queda como saldo a favor). Con menos, o si no llegas, se pierde.</p>
          </>)}
        </aside>
      </main>

      {resumenAbierto && cita.porAceptar && (
        <Ventana onCerrar={() => setResumenAbierto(false)}>
            <p className="rotulo">Cristina revisó tu solicitud</p>
            <h2 className="titulo mt-1 text-3xl">{cita.servicio}</h2>
            <div className="mt-4 text-sm">
              <div className="renglon !py-3"><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Haremos</span><span className="whitespace-pre-line text-marca-negro">{cita.resumen || cita.servicio}</span></div>
              <div className="renglon !py-3"><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Cuándo</span><span className="text-marca-negro">{mayuscula(largo(cita.fecha))} a las {cita.hora}</span></div>
              <div className="renglon !py-3"><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Precio final</span><span className="font-display text-2xl text-marca-negro">{pesos(cita.precio)}</span></div>
              <div className="renglon !py-3"><span className="w-24 shrink-0 text-xs uppercase tracking-[0.18em] text-marca-gris">Anticipo</span>
                <span className="text-marca-negro">{cita.anticipo > 0 ? <>{pesos(cita.anticipo)}{cita.anticipoPagado ? ' · ya recibido' : ''}<span className="block text-marca-gris">{cita.anticipoPagado ? 'Se descuenta del total.' : cita.formaAnticipo === 'salon' ? 'Lo pagas en el salón el día de tu cita.' : 'Al aceptar te mostramos cómo pagarlo; con él tu cita queda confirmada.'}</span></> : 'Sin anticipo: el pago completo es el día de tu cita.'}</span></div>
            </div>
            <p className="mt-3 border-l border-marca-dorado pl-3 text-xs leading-relaxed text-marca-gris">Cambios o cancelaciones con al menos 48 horas: conservas tu anticipo (si cancelas, queda como saldo a favor). Con menos, o si no llegas, se pierde.</p>
            <button disabled={enviando} onClick={async () => {
              await accion(() => aceptarMiCita(ref, cita), 'Listo: aceptaste tu cita. Le avisamos a Cristina.')
              setResumenAbierto(false)
              miCita(ref).then(c => { mostrar(c); if (c.porAceptar) setResumenAbierto(true) }).catch(() => {})   // si cambió, lo vuelve a ver
            }} className="boton mt-5 w-full disabled:opacity-40">
              {enviando ? 'Guardando…' : 'Acepto'}
            </button>
            <a href={enlaceWhatsApp(`Hola${nombre ? `, soy ${nombre}` : ''}. Tengo una duda sobre mi cita de ${cita.servicio}: `)} className="boton-claro mt-2 w-full"><MessageCircle size={16} strokeWidth={1.5} /> Tengo dudas</a>
            <button onClick={() => setResumenAbierto(false)} className="mt-2 w-full py-3 text-[11px] uppercase tracking-[0.2em] text-marca-gris">Ahora no</button>
        </Ventana>
      )}
    </>
  )
}
