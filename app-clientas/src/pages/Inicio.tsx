import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, Clock, Facebook, Instagram, MapPin, MessageCircle, Sparkles } from 'lucide-react'
import AvisoInstalar from '@/components/AvisoInstalar'
import { ENLACE_FACEBOOK, ENLACE_INSTAGRAM, ENLACE_MAPA, NOMBRE_CLUB, enlaceWhatsApp } from '@/salon'
import { citasGuardadas, miCita, olvidarCita, type VistaCita } from '@/api'
import { useEnVivo, useSalon } from '@/vivo'

const TRABAJOS = [
  { foto: 'balayage-caramelo', nombre: 'Balayage' },
  { foto: 'castano-cobre', nombre: 'Castaños y cobres' },
  { foto: 'novia-peinado-maquillaje-1', nombre: 'Novias' },
  { foto: 'maquillaje-social', nombre: 'Maquillaje' },
  { foto: 'corte-bob-cobrizo', nombre: 'Corte' }
]

const ESTADO: Partial<Record<VistaCita['estado'], string>> = { pendiente: 'Por confirmar', confirmada: 'Confirmada', iniciada: 'En curso' }

/** La próxima cita pedida o abierta en este celular, con su estado en vivo (al tocarla abre «Mi cita») */
function ProximaCita() {
  const [proxima, setProxima] = useState<{ ref: string; v: VistaCita } | null>(null)
  useEnVivo(async () => {
    const hoy = new Date().toLocaleDateString('en-CA')   // YYYY-MM-DD local
    for (const c of citasGuardadas().filter(x => x.fecha >= hoy).sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`)).slice(0, 3)) {
      try {
        const v = await miCita(c.ref)
        if (ESTADO[v.estado]) return setProxima({ ref: c.ref, v })
      } catch (e) { if ((e as { status?: number }).status === 404) olvidarCita(c.ref) }
    }
    setProxima(null)
  })
  if (!proxima) return null
  const { v } = proxima
  const dia = new Date(`${v.fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <Link to={`/cita/${proxima.ref}`} className="tarjeta flex items-center gap-4">
      <CalendarCheck size={20} strokeWidth={1.4} className="shrink-0 text-marca-dorado" />
      <span className="min-w-0 flex-1">
        <span className="rotulo block">Tu próxima cita · {ESTADO[v.estado]}</span>
        <span className="mt-1 block font-display text-xl text-marca-negro">{v.servicio}</span>
        <span className="block text-sm text-marca-gris">{dia.charAt(0).toUpperCase() + dia.slice(1)} a las {v.hora}</span>
      </span>
      <ArrowRight size={16} strokeWidth={1.4} className="shrink-0 text-marca-dorado-prof" />
    </Link>
  )
}

export default function Inicio() {
  const DATOS_SALON = useSalon().salon   // en vivo de CB Control (Configuración y Agenda)
  return (
    <>
      <header className="relative flex h-[78svh] max-h-[46rem] min-h-[32rem] flex-col justify-end overflow-hidden bg-marca-negro px-6 pb-10 pt-[calc(env(safe-area-inset-top)+2rem)] text-white lg:h-[calc(100svh-4rem)] lg:max-h-[56rem] lg:px-0 lg:pb-20">
        <img src="./fotos/portada.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-marca-negro/70 via-marca-negro/10 to-marca-negro" />
        <img src="./icons/logo-horizontal.svg" alt={DATOS_SALON.nombre} className="aparece absolute left-6 top-[calc(env(safe-area-inset-top)+1.75rem)] w-52 lg:hidden" />
        <div className="aparece contenido relative">
          <p className="rotulo text-marca-champan">Hermosillo, Sonora</p>
          <h1 className="mt-3 font-display text-[3.4rem] font-light leading-[0.95] lg:text-8xl">
            El arte<br /><em className="text-marca-dorado">del color</em>
          </h1>
          <p className="mt-4 max-w-[17rem] text-sm leading-relaxed text-white/75 lg:max-w-md lg:text-lg">Diseño de color, corte, maquillaje y peinado, con la calma de una cita solo para ti.</p>
          <Link to="/agendar" className="boton-dorado mt-7 w-full lg:inline-flex lg:w-auto">Agendar mi cita <ArrowRight size={15} strokeWidth={1.5} /></Link>
        </div>
      </header>

      <main className="contenido space-y-10 px-6 py-9 lg:space-y-16 lg:py-16">
        <ProximaCita />
        <AvisoInstalar />

        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="rotulo">Nuestro trabajo</p>
              <h2 className="titulo mt-1 text-3xl">Lo que hacemos</h2>
            </div>
            <a href={ENLACE_INSTAGRAM} className="pb-1 text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof">Ver más</a>
          </div>
          <div className="-mx-6 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
            {TRABAJOS.map(t => (
              <Link key={t.foto} to="/agendar" className="relative w-40 shrink-0 snap-start overflow-hidden rounded-sm lg:w-auto">
                <img src={`./fotos/${t.foto}.jpg`} alt={t.nombre} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-marca-negro/80 to-transparent px-3 pb-3 pt-8 font-display text-lg text-white">{t.nombre}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-10 lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 lg:space-y-0">
        <Link to="/club" className="block overflow-hidden rounded-sm bg-marca-negro p-6 text-white lg:p-10">
          <div className="flex items-center justify-between">
            <p className="rotulo text-marca-dorado">Membresía</p>
            <Sparkles size={16} strokeWidth={1.4} className="text-marca-dorado" />
          </div>
          <p className="mt-3 font-display text-2xl">{NOMBRE_CLUB}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">Cinco niveles: Marfil, Miel, Ámbar, Dorado y Ónix. Puntos en cada visita, descuentos, cortesías y saldo a favor.</p>
          <p className="mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-marca-champan">Únete gratis <ArrowRight size={13} strokeWidth={1.5} /></p>
        </Link>

        <section>
          <p className="rotulo">Visítanos</p>
          <h2 className="titulo mt-1 text-3xl">El salón</h2>
          <div className="mt-3">
            <a href={ENLACE_MAPA} className="renglon">
              <MapPin size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-marca-dorado" />
              <div className="text-sm leading-relaxed">
                <p className="font-normal text-marca-negro">Plaza Galilea, planta alta</p>
                <p className="mt-1 text-marca-gris">{DATOS_SALON.direccion.replace(/^Plaza Galilea,\s*/, '')}</p>
                <p className="mt-2 text-marca-gris">{DATOS_SALON.comoLlegar}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof">Abrir en el mapa</p>
              </div>
            </a>
            <div className="renglon">
              <Clock size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-marca-dorado" />
              <div className="text-sm leading-relaxed">
                <p className="font-normal text-marca-negro">Horario</p>
                <p className="mt-1 text-marca-gris">{DATOS_SALON.horario}</p>
              </div>
            </div>
          </div>
        </section>
        </div>

        <section className="space-y-6 text-center">
          <a href={enlaceWhatsApp('Hola, tengo una pregunta:')} className="boton-claro w-full lg:mx-auto lg:w-auto lg:max-w-sm"><MessageCircle size={16} strokeWidth={1.5} /> Escríbenos por WhatsApp</a>
          <div className="flex justify-center gap-8 text-marca-gris">
            <a href={ENLACE_INSTAGRAM} aria-label="Instagram"><Instagram size={20} strokeWidth={1.4} /></a>
            <a href={ENLACE_FACEBOOK} aria-label="Facebook"><Facebook size={20} strokeWidth={1.4} /></a>
          </div>
          <p className="font-display text-sm italic text-marca-gris">{DATOS_SALON.nombre}</p>
        </section>
      </main>
    </>
  )
}
