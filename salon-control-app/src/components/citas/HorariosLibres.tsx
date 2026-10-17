import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Clock } from 'lucide-react';
import { db } from '../../db/db';
import { useAgenda, nombrePersona } from '../../hooks/useAgenda';
import { horariosLibres, choques, tiemposServicio } from '../../utils/agenda';

interface Props {
  fecha: string;
  servicioId: string;
  adicionales?: string[];
  atiendeId?: string;    // filtra a una persona; sin valor, todas las que hacen el servicio
  ignorarCitaId?: string; // la cita que se está moviendo no cuenta como ocupada
  horaElegida?: string;
  onElegir: (hora: string, personaId: string) => void;
}

/** Horarios libres del día para el servicio, agrupados por quién atiende */
export default function HorariosLibres({ fecha, servicioId, adicionales = [], atiendeId, ignorarCitaId, horaElegida, onElegir }: Props) {
  const { config, personas } = useAgenda();
  const citas = useLiveQuery(() => db.citas.where('fecha').equals(fecha || '-').toArray(), [fecha]) || [];
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  if (!fecha || !servicioId) return null;

  // En CB Control se puede agendar cualquier hora futura: sin anticipación mínima
  const libres = horariosLibres({ fecha, servicioId, adicionales, personas, citas, servicios: servicios as any, config,
    personaId: atiendeId, ignorarCitaId, respetarAnticipacion: false });
  const t = tiemposServicio(servicios.find(s => s.id === servicioId) as any);
  const porPersona = personas.map(p => ({ p, horas: libres.filter(l => l.personaId === p.id).map(l => l.hora) })).filter(x => x.horas.length);

  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Clock size={14} /> Horarios disponibles</span>
        <span className="text-xs text-gray-500">{t.total} min{t.proceso ? ` · ${t.proceso} de proceso` : ''} + {config.margen} de margen</span>
      </div>
      {porPersona.length === 0 && <p className="text-sm text-gray-500">No hay horarios libres ese día para este servicio. Elige otra fecha o una hora manual abajo.</p>}
      {porPersona.map(({ p, horas }) => (
        <div key={p.id} className="mb-2 last:mb-0">
          {personas.length > 1 && <div className="text-xs text-gray-500 mb-1">{p.nombre}</div>}
          <div className="flex flex-wrap gap-1.5">
            {horas.map(h => (
              <button type="button" key={h} onClick={() => onElegir(h, p.id)}
                className={`px-2.5 py-1 rounded-md text-sm border ${horaElegida === h && (atiendeId || 'cristina') === p.id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-300 hover:border-purple-500'}`}>
                {h}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Avisos si la hora elegida a mano choca con otra cita, el horario o un bloqueo */
export function AvisosAgenda({ cita }: { cita: { id?: string; fecha: string; hora: string; servicioId: string; atiendeId?: string; serviciosAdicionales?: { servicioId: string }[] } }) {
  const { config, personas } = useAgenda();
  const citas = useLiveQuery(() => db.citas.where('fecha').equals(cita.fecha || '-').toArray(), [cita.fecha]) || [];
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  if (!cita.fecha || !cita.hora || !cita.servicioId) return null;
  const avisos = choques(cita, citas, servicios as any, config);
  if (!avisos.length) return null;
  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      <div className="flex items-center gap-2 font-medium mb-1"><AlertTriangle size={16} /> Ojo con este horario ({nombrePersona(personas, cita.atiendeId)})</div>
      <ul className="list-disc ml-6">{avisos.map(a => <li key={a}>{a}</li>)}</ul>
      <p className="text-xs mt-1">Puedes guardarla de todos modos si ya lo acordaste con la clienta.</p>
    </div>
  );
}
