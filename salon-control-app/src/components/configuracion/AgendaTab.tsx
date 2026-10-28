import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Save } from 'lucide-react';
import { db } from '../../db/db';
import { useAgenda, guardarAgenda } from '../../hooks/useAgenda';
import { DUENA, AGENDA_INICIAL, type ConfigAgenda, type DiaSemana, type HorarioDia, type LimiteLargo } from '../../utils/agenda';

const DIAS: [DiaSemana, string][] = [['1', 'Lunes'], ['2', 'Martes'], ['3', 'Miércoles'], ['4', 'Jueves'], ['5', 'Viernes'], ['6', 'Sábado'], ['0', 'Domingo']];
const campo = 'border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';

export default function AgendaTab() {
  const { guardada, empleados, cargando } = useAgenda();
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  const categorias = [...new Set(servicios.map(s => s.categoria).filter(Boolean))] as string[];
  const [cfg, setCfg] = useState<ConfigAgenda | null>(null);
  const [nuevo, setNuevo] = useState({ personaId: 'todas', desde: '', hasta: '', motivo: '' });
  const [aviso, setAviso] = useState('');

  useEffect(() => { if (!cargando && !cfg) setCfg(guardada); }, [cargando]);
  if (!cfg) return <p className="text-gray-500">Cargando agenda…</p>;

  const setDia = (d: DiaSemana, h: HorarioDia | null) => setCfg({ ...cfg, horario: { ...cfg.horario, [d]: h } });
  const num = (k: 'margen' | 'intervalo' | 'anticipacionHoras' | 'maxDias', v: string) => setCfg({ ...cfg, [k]: Math.max(0, Number(v) || 0) });
  const personas = [{ id: 'todas', nombre: 'Todo el salón' }, { id: DUENA, nombre: 'Cristina' }, ...empleados.filter(e => e.activo).map(e => ({ id: e.id, nombre: e.nombre }))];

  const largos = cfg.largos ?? AGENDA_INICIAL.largos ?? [];
  const setLargos = (l: LimiteLargo[]) => setCfg({ ...cfg, largos: l });

  const guardar = async () => {
    await guardarAgenda(cfg);
    setAviso('Agenda guardada');
    setTimeout(() => setAviso(''), 2500);
  };
  const agregarBloqueo = () => {
    if (!nuevo.desde || !nuevo.hasta || nuevo.hasta < nuevo.desde) return alert('Indica desde y hasta (hasta debe ser después de desde)');
    setCfg({ ...cfg, bloqueos: [...cfg.bloqueos, { id: `blq_${Date.now()}`, ...nuevo, motivo: nuevo.motivo || undefined }] });
    setNuevo({ personaId: 'todas', desde: '', hasta: '', motivo: '' });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <section className="bg-white rounded-lg shadow p-5">
        <h3 className="font-semibold text-lg mb-1">Horario del salón</h3>
        <p className="text-sm text-gray-500 mb-4">Con esto se calculan los horarios libres. Ajústalo a tu horario real.</p>
        <div className="space-y-2">
          {DIAS.map(([d, nombre]) => {
            const h = cfg.horario[d];
            return (
              <div key={d} className="flex flex-wrap items-center gap-2 text-sm">
                <label className="w-full sm:w-28 flex items-center gap-2">
                  <input type="checkbox" checked={!!h} onChange={e => setDia(d, e.target.checked ? { abre: '10:00', cierra: '19:00' } : null)} />
                  {nombre}
                </label>
                {/* Cada par de horas va junto: en celular se acomodan en renglones, sin partir «abre a cierra» */}
                {h ? (<>
                  <span className="flex items-center gap-2">
                    <input type="time" value={h.abre} onChange={e => setDia(d, { ...h, abre: e.target.value })} className={campo} aria-label={`${nombre} abre`} />
                    <span>a</span>
                    <input type="time" value={h.cierra} onChange={e => setDia(d, { ...h, cierra: e.target.value })} className={campo} aria-label={`${nombre} cierra`} />
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="w-full text-gray-500 sm:ml-2 sm:w-auto">Descanso</span>
                    <input type="time" value={h.descansoDe || ''} onChange={e => setDia(d, { ...h, descansoDe: e.target.value || undefined })} className={campo} aria-label={`${nombre} descanso desde`} />
                    <span>a</span>
                    <input type="time" value={h.descansoA || ''} onChange={e => setDia(d, { ...h, descansoA: e.target.value || undefined })} className={campo} aria-label={`${nombre} descanso hasta`} />
                  </span>
                </>) : <span className="text-gray-400">Cerrado</span>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-5">
        <h3 className="font-semibold text-lg mb-3">Reglas</h3>
        <div className="grid sm:grid-cols-4 gap-4 text-sm">
          <label>Margen entre citas (min)<input type="number" min="0" value={cfg.margen} onChange={e => num('margen', e.target.value)} className={`${campo} w-full mt-1`} /></label>
          <label>Horarios cada (min)
            <select value={cfg.intervalo} onChange={e => num('intervalo', e.target.value)} className={`${campo} w-full mt-1`}>
              {[15, 30, 60].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label>Anticipación mínima (horas)<input type="number" min="0" value={cfg.anticipacionHoras} onChange={e => num('anticipacionHoras', e.target.value)} className={`${campo} w-full mt-1`} /></label>
          <label>Agendar hasta (días)<input type="number" min="1" value={cfg.maxDias} onChange={e => num('maxDias', e.target.value)} className={`${campo} w-full mt-1`} /></label>
        </div>
        <p className="text-xs text-gray-500 mt-2">La anticipación y el máximo de días aplican a las clientas; en CB Control puedes agendar cualquier hora futura.</p>
      </section>

      <section className="bg-white rounded-lg shadow p-5">
        <h3 className="font-semibold text-lg mb-1">Trabajos largos</h3>
        <p className="text-sm text-gray-500 mb-3">Un trabajo largo no se ofrece tarde: se acomoda temprano o en otro día. En CB Control puedes agendarlo a cualquier hora (por ejemplo, un caso especial hasta la noche) y solo verás un aviso.</p>
        <div className="space-y-2 text-sm">
          {largos.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              Si dura
              <input type="number" min="1" step="0.5" value={l.horas} onChange={e => setLargos(largos.map((x, j) => j === i ? { ...x, horas: Math.max(0.5, Number(e.target.value) || 1) } : x))} className={`${campo} w-20`} />
              horas o más, empezar a más tardar a las
              <input type="time" value={l.ultimaHora} onChange={e => setLargos(largos.map((x, j) => j === i ? { ...x, ultimaHora: e.target.value } : x))} className={campo} />
              <button type="button" onClick={() => setLargos(largos.filter((_, j) => j !== i))} className="text-red-600 p-1" title="Quitar regla"><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => setLargos([...largos, { horas: 3, ultimaHora: '14:00' }])} className="flex items-center gap-1 text-purple-700 mt-1"><Plus size={14} /> Agregar regla</button>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-5">
        <h3 className="font-semibold text-lg mb-1">Quién atiende</h3>
        <p className="text-sm text-gray-500 mb-3">Cristina atiende todos los servicios. Activa a las colaboradoras que toman citas propias y lo que hacen.</p>
        {empleados.filter(e => e.activo).length === 0 && <p className="text-sm text-gray-400">No hay colaboradoras activas en Empleados.</p>}
        <div className="space-y-3">
          {empleados.filter(e => e.activo).map(e => (
            <div key={e.id} className="border rounded-lg p-3 text-sm">
              <label className="flex items-center gap-2 font-medium">
                <input type="checkbox" checked={!!e.tomaCitas} onChange={ev => db.empleados.update(e.id, { tomaCitas: ev.target.checked })} />
                {e.nombre} toma citas
              </label>
              {e.tomaCitas && (
                <div className="flex flex-wrap gap-3 mt-2 ml-6">
                  {categorias.map(c => (
                    <label key={c} className="flex items-center gap-1 capitalize">
                      <input type="checkbox" checked={!!e.categoriasAgenda?.includes(c)}
                        onChange={ev => db.empleados.update(e.id, { categoriasAgenda: ev.target.checked ? [...(e.categoriasAgenda || []), c] : (e.categoriasAgenda || []).filter(x => x !== c) })} />
                      {c}
                    </label>
                  ))}
                  <span className="text-xs text-gray-400">(sin marcar = todos los servicios)</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Las vacaciones y días inhábiles de Empleados bloquean su agenda automáticamente.</p>
      </section>

      <section className="bg-white rounded-lg shadow p-5">
        <h3 className="font-semibold text-lg mb-1">Bloqueos</h3>
        <p className="text-sm text-gray-500 mb-3">Cursos, citas personales, vacaciones del salón: en ese tiempo no se ofrecen horarios.</p>
        <div className="space-y-2 mb-3">
          {cfg.bloqueos.map(b => (
            <div key={b.id} className="flex justify-between items-center border rounded-lg px-3 py-2 text-sm">
              <span>{personas.find(p => p.id === b.personaId)?.nombre || b.personaId} · {b.desde.replace('T', ' ')} → {b.hasta.replace('T', ' ')}{b.motivo ? ` · ${b.motivo}` : ''}</span>
              <button onClick={() => setCfg({ ...cfg, bloqueos: cfg.bloqueos.filter(x => x.id !== b.id) })} className="text-gray-400 hover:text-red-600" aria-label="Quitar bloqueo"><Trash2 size={16} /></button>
            </div>
          ))}
          {cfg.bloqueos.length === 0 && <p className="text-sm text-gray-400">Sin bloqueos.</p>}
        </div>
        <div className="grid sm:grid-cols-5 gap-2 items-end text-sm">
          <select value={nuevo.personaId} onChange={e => setNuevo({ ...nuevo, personaId: e.target.value })} className={campo} aria-label="Quién">
            {personas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input type="datetime-local" value={nuevo.desde} onChange={e => setNuevo({ ...nuevo, desde: e.target.value })} className={campo} aria-label="Desde" />
          <input type="datetime-local" value={nuevo.hasta} onChange={e => setNuevo({ ...nuevo, hasta: e.target.value })} className={campo} aria-label="Hasta" />
          <input value={nuevo.motivo} onChange={e => setNuevo({ ...nuevo, motivo: e.target.value })} placeholder="Motivo (opcional)" className={campo} />
          <button onClick={agregarBloqueo} className="flex items-center justify-center gap-1 border-2 border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100"><Plus size={14} /> Agregar</button>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={guardar} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700"><Save size={16} /> Guardar agenda</button>
        {aviso && <span className="text-green-700 text-sm">{aviso}</span>}
        <span className="text-xs text-gray-500">Los tiempos de cada servicio (duración, proceso y cierre) se ajustan en Catálogo.</span>
      </div>
    </div>
  );
}
