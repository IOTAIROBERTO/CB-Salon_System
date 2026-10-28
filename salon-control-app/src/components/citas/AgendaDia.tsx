import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAgenda } from '../../hooks/useAgenda';
import useCitas from '../../hooks/useCitas';
import ReagendarModal from './ReagendarModal';
import { aMin, aHora, atiende, diaSemana, tramosCita, ocupacion, tiemposServicio } from '../../utils/agenda';

const PX = 1.4; // píxeles por minuto

/**
 * Agenda de un día con una columna por persona: tiempo activo en color,
 * proceso rayado (libre para otra clienta), margen tenue, descanso y bloqueos
 * en gris. Clic en una cita para moverla o reagendarla.
 */
export default function AgendaDia({ fecha }: { fecha: string }) {
  const { config, personas } = useAgenda();
  const { saveCita } = useCitas();
  const citas = (useLiveQuery(() => db.citas.where('fecha').equals(fecha).toArray(), [fecha]) || []).filter(c => c.estado !== 'cancelada');
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const [moviendo, setMoviendo] = useState<any>(null);

  const h = config.horario[diaSemana(fecha)];
  const inicio = Math.min(h ? aMin(h.abre) : 9 * 60, ...citas.map(c => aMin(c.hora)));
  const fin = Math.max(h ? aMin(h.cierra) : 20 * 60, ...citas.map(c => tramosCita(aMin(c.hora), c.servicioId, (c.serviciosAdicionales || []).map(a => a.servicioId), servicios as any, 0).fin));
  const desde = Math.floor(inicio / 60) * 60;
  const alto = (Math.ceil(fin / 60) * 60 - desde) * PX;
  const y = (min: number) => (min - desde) * PX;
  const horas = Array.from({ length: Math.ceil((fin - desde) / 60) + 1 }, (_, i) => desde + i * 60);
  // Citas de alguien que ya no toma citas se muestran con Cristina
  const columna = (c: { atiendeId?: string }) => (personas.some(p => p.id === atiende(c)) ? atiende(c) : personas[0].id);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
      {!h && <p className="px-4 pt-3 text-sm text-amber-700">El salón está cerrado este día según la agenda.</p>}
      <div className="flex min-w-max">
        <div className="w-14 shrink-0 relative" style={{ height: alto + 40 }}>
          {horas.map(m => <div key={m} className="absolute right-2 text-xs text-gray-400" style={{ top: y(m) + 32 }}>{aHora(m)}</div>)}
        </div>
        {personas.map(p => {
          const bloqueos = ocupacion(p.id, fecha, [], servicios as any, config).fijos;
          return (
            <div key={p.id} className="w-56 shrink-0 border-l">
              <div className="h-10 flex items-center justify-center text-sm font-semibold text-gray-700 border-b">{p.nombre}</div>
              <div className="relative" style={{ height: alto }}>
                {horas.map(m => <div key={m} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: y(m) }} />)}
                {bloqueos.map((b, i) => (
                  <div key={i} className="absolute left-1 right-1 rounded bg-gray-100 text-[10px] text-gray-500 px-1"
                    style={{ top: y(Math.max(b.de, desde)), height: Math.max((Math.min(b.a, fin) - Math.max(b.de, desde)) * PX, 0),
                      backgroundImage: 'repeating-linear-gradient(45deg,transparent 0 6px,rgba(0,0,0,.05) 6px 12px)' }}>No disponible</div>
                ))}
                {citas.filter(c => columna(c) === p.id).map(c => {
                  const s = servicios.find(x => x.id === c.servicioId) as any;
                  const t = tiemposServicio(s);
                  const ini = aMin(c.hora);
                  const { fin: termina } = tramosCita(ini, c.servicioId, (c.serviciosAdicionales || []).map(a => a.servicioId), servicios as any, 0);
                  const cliente = clientes.find(x => x.id === c.clienteId);
                  const color = c.estado === 'completada' ? 'bg-green-100 border-green-400' : c.estado === 'confirmada' || c.estado === 'iniciada' ? 'bg-blue-100 border-blue-400' : 'bg-purple-100 border-purple-400';
                  return (
                    <button key={c.id} onClick={() => setMoviendo(c)} title="Mover o reagendar"
                      className={`absolute left-1 right-1 rounded border-l-4 text-left overflow-hidden hover:ring-2 hover:ring-purple-400 flex flex-col justify-start ${color}`}
                      style={{ top: y(ini), height: (termina - ini) * PX }}>
                      {t.proceso > 0 && (
                        <div className="absolute left-0 right-0 bg-white/70" style={{ top: t.inicio * PX, height: t.proceso * PX,
                          backgroundImage: 'repeating-linear-gradient(45deg,transparent 0 5px,rgba(138,106,47,.18) 5px 10px)' }}>
                          <span className="text-[10px] text-gray-500 px-1">Proceso · libre</span>
                        </div>
                      )}
                      <div className="relative px-1.5 py-0.5 text-[11px] leading-tight">
                        <div className="font-semibold">{c.hora}–{aHora(termina)} {cliente?.nombre || ''}</div>
                        <div className="text-gray-600 truncate">{s?.nombre || ''}</div>
                      </div>
                      <div className="absolute left-0 right-0 bg-gray-200/60" style={{ top: (termina - ini) * PX, height: config.margen * PX }} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-gray-500 border-t">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-100 border border-purple-400" /> Pendiente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-400" /> Confirmada o en curso</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-400" /> Cobrada</span>
        <span>Rayado: proceso, se puede agendar otra clienta · Gris: descanso o bloqueo · Toca una cita para moverla</span>
      </div>
      {moviendo && <ReagendarModal cita={moviendo} onClose={() => setMoviendo(null)} onSave={saveCita} />}
    </div>
  );
}
