import { useState } from 'react';
import { DATOS_SALON } from '../../data/datosSalon';

// El Google Calendar de Cristina dentro de Citas. Es el de Google tal cual (sus eventos y las citas que copia el
// servidor): solo se ve si este navegador tiene abierta su cuenta de Google o una con acceso a su calendario.
const VISTAS = { WEEK: 'Semana', MONTH: 'Mes', AGENDA: 'Agenda' } as const;
type Vista = keyof typeof VISTAS;

export default function CalendarioGoogle() {
  // En celular la semana no cabe: arranca en Agenda (lista)
  const inicial: Vista = innerWidth < 640 ? 'AGENDA' : 'WEEK';
  const [vista, setVista] = useState<Vista>(() => { try { return (localStorage.getItem('cb-vista-google') as Vista) || inicial; } catch { return inicial; } });
  const elegir = (v: Vista) => { setVista(v); try { localStorage.setItem('cb-vista-google', v); } catch { /* sin almacenamiento */ } };
  const src = `https://calendar.google.com/calendar/embed?${new URLSearchParams({
    src: DATOS_SALON.email, ctz: 'America/Hermosillo', mode: vista, showTitle: '0', showPrint: '0', showCalendars: '0', showTz: '0', hl: 'es'
  })}`;
  return (
    <div className="bg-white rounded-lg shadow p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg bg-gray-100 p-1">
          {(Object.keys(VISTAS) as Vista[]).map(v => (
            <button key={v} onClick={() => elegir(v)} className={`rounded-md px-3 py-1 text-sm ${vista === v ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}>{VISTAS[v]}</button>
          ))}
        </div>
        <a href="https://calendar.google.com/calendar/r" target="_blank" rel="noopener noreferrer" className="py-2 text-sm text-marca-dorado-prof hover:underline">Abrir en Google Calendar</a>
      </div>
      <iframe key={vista} title="Google Calendar de Cristina" src={src} className="h-[70vh] min-h-[520px] w-full rounded border-0" />
      <p className="text-xs text-gray-500">Si sale vacío o pide permiso, entra en este navegador con la cuenta de Google de Cristina ({DATOS_SALON.email}).</p>
    </div>
  );
}
