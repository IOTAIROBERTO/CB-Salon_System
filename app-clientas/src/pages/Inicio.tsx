import { Link } from 'react-router-dom'
import { Clock, Facebook, Instagram, MapPin, MessageCircle, Star } from 'lucide-react'
import { DATOS_SALON, ENLACE_FACEBOOK, ENLACE_INSTAGRAM, ENLACE_MAPA, NOMBRE_CLUB, enlaceWhatsApp } from '@/salon'

export default function Inicio() {
  return (
    <>
      <header className="bg-marca-negro px-6 pb-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] text-center">
        <img src="./icons/logo-horizontal.svg" alt={DATOS_SALON.nombre} className="mx-auto w-64" />
        <p className="mt-4 text-sm tracking-wide text-marca-champan">Diseño de color, cortes, maquillaje y peinado en Hermosillo</p>
        <Link to="/agendar" className="boton mx-auto mt-6 w-fit bg-marca-dorado text-marca-negro active:bg-marca-champan">Agendar mi cita</Link>
      </header>

      <main className="space-y-3 p-4">
        <Link to="/club" className="tarjeta flex items-center gap-3">
          <Star className="shrink-0 text-marca-dorado" />
          <div>
            <p className="font-medium text-marca-negro">{NOMBRE_CLUB}</p>
            <p className="text-sm text-marca-gris">Junta puntos en cada visita y compra; desbloquea descuentos y saldo a favor.</p>
          </div>
        </Link>

        <a href={ENLACE_MAPA} className="tarjeta flex gap-3">
          <MapPin className="shrink-0 text-marca-dorado" />
          <div>
            <p className="font-medium text-marca-negro">Cómo llegar</p>
            <p className="text-sm text-marca-gris">{DATOS_SALON.direccion}</p>
            <p className="mt-1 text-sm text-marca-gris">{DATOS_SALON.comoLlegar}</p>
          </div>
        </a>

        <div className="tarjeta flex gap-3">
          <Clock className="shrink-0 text-marca-dorado" />
          <div>
            <p className="font-medium text-marca-negro">Horario</p>
            <p className="text-sm text-marca-gris">{DATOS_SALON.horario}</p>
          </div>
        </div>

        <a href={enlaceWhatsApp('Hola, tengo una pregunta:')} className="boton-claro w-full"><MessageCircle size={18} /> Escríbenos por WhatsApp</a>
        <div className="flex justify-center gap-6 pt-2 text-marca-gris">
          <a href={ENLACE_INSTAGRAM} aria-label="Instagram"><Instagram /></a>
          <a href={ENLACE_FACEBOOK} aria-label="Facebook"><Facebook /></a>
        </div>
      </main>
    </>
  )
}
