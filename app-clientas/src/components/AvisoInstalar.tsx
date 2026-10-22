import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

// Aviso para instalar la app desde el navegador, sin pasar por una tienda. No sale si ya está instalada (o si se abrió
// desde Google Play) ni después de que la clienta lo cierra.
type EventoInstalar = Event & { prompt: () => Promise<void> }

// Chrome ofrece instalar una sola vez por visita y puede ser antes de que se vea Inicio: se guarda desde que carga la app.
let eventoGuardado: EventoInstalar | null = null
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault()   // sin la barrita de Chrome: el botón del aviso la reemplaza
  eventoGuardado = e as EventoInstalar
})

const CLAVE = 'cb-aviso-instalar'

function cerradoAntes() {
  try { return localStorage.getItem(CLAVE) === 'cerrado' } catch { return false }
}

export default function AvisoInstalar() {
  const [cerrado, setCerrado] = useState(cerradoAntes)
  const [evento, setEvento] = useState(eventoGuardado)

  function cerrar() {
    try { localStorage.setItem(CLAVE, 'cerrado') } catch { /* modo privado: solo se oculta esta vez */ }
    setCerrado(true)
  }

  useEffect(() => {
    const guardar = (e: Event) => setEvento(e as EventoInstalar)
    window.addEventListener('beforeinstallprompt', guardar)
    window.addEventListener('appinstalled', cerrar)
    return () => {
      window.removeEventListener('beforeinstallprompt', guardar)
      window.removeEventListener('appinstalled', cerrar)
    }
  }, [])

  const ua = navigator.userAgent
  const instalada = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
  const iphone = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)   // el iPad dice ser Mac
  const redSocial = /Instagram|FBAN|FBAV/.test(ua)   // el navegador de Instagram o Facebook no deja instalar
  if (cerrado || instalada || (!evento && !iphone && !/Android/.test(ua))) return null   // en computadora sin Chrome no aplica

  let pasos
  if (redSocial) {
    pasos = <p>Primero ábrela en tu navegador: toca <b>···</b> arriba y elige <b>Abrir en el navegador</b>.</p>
  } else if (evento) {
    pasos = (
      <button onClick={async () => { await evento.prompt(); eventoGuardado = null; setEvento(null) }} className="boton w-full">
        <Download size={18} /> Instalar
      </button>
    )
  } else if (iphone) {
    pasos = (
      <ol className="list-decimal space-y-1 pl-4">
        <li>Toca <Share size={14} className="inline align-[-2px]" /> <b>Compartir</b> (si no lo ves, toca primero <b>···</b>).</li>
        <li>Elige <b>Agregar a pantalla de inicio</b>.</li>
        <li>Toca <b>Agregar</b>.</li>
      </ol>
    )
  } else {
    pasos = <p>Abre el menú <b>⋮</b> de tu navegador y elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</p>
  }

  return (
    <section className="tarjeta relative border-marca-dorado bg-marca-marfil">
      <button onClick={cerrar} aria-label="Cerrar aviso" className="absolute right-1 top-1 p-2 text-marca-gris"><X size={18} /></button>
      <div className="flex gap-3 pr-6">
        <Download className="shrink-0 text-marca-dorado" />
        <div className="min-w-0 flex-1 space-y-2 text-sm text-marca-gris">
          <p className="font-medium text-marca-negro">Instala la app en tu celular</p>
          <p>Queda con su ícono junto a tus apps y la abres en un toque, sin buscar el enlace.</p>
          {pasos}
        </div>
      </div>
    </section>
  )
}
