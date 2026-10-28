import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarPlus, EyeOff } from 'lucide-react';
import { db } from '../../db/db';
import { useRolSalon } from '../../db/salon';

// Citas que Cristina o Roberto apuntaron a mano en el Google Calendar de Cristina (con prisa, sin pasar por CB Control).
// El Worker cb-avisos trae cada minuto sus eventos con hora que CB Control no creó (configuracion/eventosGoogle).
// «Registrar como cita» abre la cita ya llena y el Worker adopta ese mismo evento (no lo duplica); «Es personal» lo esconde.
// Solo la dueña ve la lista: en ese calendario también hay pendientes personales.
export interface EventoGoogle { id: string; titulo: string; desde: string; hasta: string }

const fechaCorta = (f: string) => new Date(`${f.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

export default function EventosGoogle({ onRegistrar }: { onRegistrar: (e: EventoGoogle) => void }) {
  const esDuena = useRolSalon() === 'duena';
  const datos = useLiveQuery(async () => {
    const [eventos, ignorados, ligadas] = await Promise.all([
      db.configuracion.get('eventosGoogle').then(d => ((d as any)?.eventos || []) as EventoGoogle[]),
      db.configuracion.get('eventosGoogleIgnorados').then(d => new Set<string>((d as any)?.ids || [])),
      db.citas.filter(c => !!c.googleAdoptar).toArray().then(l => new Set(l.map(c => c.googleAdoptar)))
    ]);
    return { lista: eventos.filter(e => !ignorados.has(e.id) && !ligadas.has(e.id)), ignorados, eventos };
  });
  if (!esDuena || !datos?.lista.length) return null;

  const esPersonal = async (id: string) => {
    const vigentes = new Set(datos.eventos.map(e => e.id));   // solo se guardan los que siguen en Google
    await db.configuracion.put({ id: 'eventosGoogleIgnorados', ids: [...datos.ignorados, id].filter(x => vigentes.has(x)) } as any);
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-amber-800">De Google, sin registrar · {datos.lista.length}</p>
      <p className="mt-1 text-xs text-gray-600">Eventos con hora en el Google Calendar de Cristina que no están en CB Control. Si es una cita, regístrala; si es algo personal, escóndelo.</p>
      <div className="mt-3 space-y-2">
        {datos.lista.map(e => (
          <div key={e.id} className="flex flex-wrap items-center gap-2 rounded-md bg-white p-2 text-sm">
            <span className="min-w-0 flex-1">
              <span className="font-medium text-gray-900">{e.titulo}</span>
              <span className="ml-2 text-gray-500">{fechaCorta(e.desde)} · {e.desde.slice(11, 16)}–{e.hasta.slice(11, 16)}</span>
            </span>
            <button onClick={() => onRegistrar(e)} className="flex items-center gap-1 rounded-md bg-marca-negro px-3 py-1.5 text-xs text-white hover:bg-gray-800"><CalendarPlus size={13} /> Registrar como cita</button>
            <button onClick={() => esPersonal(e.id)} className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><EyeOff size={13} /> Es personal</button>
          </div>
        ))}
      </div>
    </div>
  );
}
