import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

// Aviso para instalar CB Control desde el navegador (celular o computadora), sin tiendas: queda con su ícono, abre en
// pantalla completa y, en iPhone, solo instalada recibe los avisos de la campana. No sale si ya está instalada ni
// después de cerrarlo. Igual que app-clientas/src/components/AvisoInstalar.tsx.
type EventoInstalar = Event & { prompt: () => Promise<void> };

// Chrome ofrece instalar una sola vez por visita y puede ser antes de que cargue el salón: se guarda desde el inicio
let eventoGuardado: EventoInstalar | null = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();   // sin la barrita de Chrome: el botón del aviso la reemplaza
  eventoGuardado = e as EventoInstalar;
});

const CLAVE = 'cb-control-aviso-instalar';
const cerradoAntes = () => { try { return localStorage.getItem(CLAVE) === 'cerrado'; } catch { return false; } };

export const esIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);   // el iPad dice ser Mac
export const estaInstalada = () => matchMedia('(display-mode: standalone)').matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;

export default function AvisoInstalar() {
  const [cerrado, setCerrado] = useState(cerradoAntes);
  const [evento, setEvento] = useState(eventoGuardado);

  function cerrar() {
    try { localStorage.setItem(CLAVE, 'cerrado'); } catch { /* modo privado: solo se oculta esta vez */ }
    setCerrado(true);
  }

  useEffect(() => {
    const guardar = (e: Event) => setEvento(e as EventoInstalar);
    window.addEventListener('beforeinstallprompt', guardar);
    window.addEventListener('appinstalled', cerrar);
    return () => {
      window.removeEventListener('beforeinstallprompt', guardar);
      window.removeEventListener('appinstalled', cerrar);
    };
  }, []);

  const iphone = esIphone();
  if (cerrado || estaInstalada() || (!evento && !iphone && !/Android/.test(navigator.userAgent))) return null;   // computadora sin Chrome/Edge

  let pasos;
  if (evento) {
    pasos = (
      <button onClick={async () => { await evento.prompt(); eventoGuardado = null; setEvento(null); }}
        className="mt-1 flex min-h-[44px] items-center gap-2 rounded-md bg-marca-negro px-5 text-xs uppercase tracking-[0.2em] text-white hover:bg-gray-800">
        <Download size={16} /> Instalar
      </button>
    );
  } else if (iphone) {
    pasos = (
      <ol className="list-decimal space-y-1 pl-4">
        <li>En Safari, toca <Share size={14} className="inline align-[-2px]" /> <b>Compartir</b> (si no lo ves, toca primero <b>···</b>).</li>
        <li>Elige <b>Agregar a pantalla de inicio</b> y toca <b>Agregar</b>.</li>
        <li>Abre CB Control desde su ícono y activa los avisos en la campana.</li>
      </ol>
    );
  } else {
    pasos = <p>Abre el menú <b>⋮</b> de Chrome y elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</p>;
  }

  return (
    <section className="relative mb-6 rounded-lg border border-gray-200 border-l-2 border-l-marca-dorado bg-white p-4 shadow-sm">
      <button onClick={cerrar} aria-label="Cerrar aviso" className="absolute right-1 top-1 p-3 text-gray-400 hover:text-gray-700"><X size={16} strokeWidth={1.5} /></button>
      <div className="flex gap-4 pr-8">
        <Download size={18} strokeWidth={1.4} className="mt-1 shrink-0 text-marca-dorado" />
        <div className="min-w-0 flex-1 space-y-2 text-sm leading-relaxed text-gray-600">
          <p className="font-display text-xl text-gray-900">Instala CB Control en este dispositivo</p>
          <p>Queda con su ícono, abre en pantalla completa y te avisa al momento de citas, solicitudes y firmas.</p>
          {pasos}
        </div>
      </div>
    </section>
  );
}
