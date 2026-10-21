import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MapPin, Copy, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { Servicio } from '../../types/catalogo';
import { db } from '../../db/db';
import { formatCurrency } from '../../utils/financialUtils';
import { PARAMETROS_TRASLADO, calcularTraslado } from '../../utils/trasladoUtils';
import { zonasDe, idZona, type Zona } from '../../utils/zonas';

interface CotizadorTrasladoProps {
  servicios: Servicio[];
}

const OTRO = '__otro';
const campo = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500';
const chico = 'w-full border border-gray-300 rounded px-2 py-1 text-sm';

/** Zonas fuera de Hermosillo (editables) y cotización: precio del servicio + traslado */
export default function CotizadorTraslado({ servicios }: CotizadorTrasladoProps) {
  const settings = useLiveQuery(() => db.configuracion.get('settings'));
  const zonas = zonasDe(settings as any);
  const activas = zonas.filter(z => z.activa);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Zona[] | null>(null);
  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [zonaId, setZonaId] = useState('');
  const [kmOtro, setKmOtro] = useState(0);
  const [diasOtro, setDiasOtro] = useState(1);
  const [clientas, setClientas] = useState(1);
  const [params, setParams] = useState(PARAMETROS_TRASLADO);

  const ordenados = useMemo(
    () => [...servicios].filter(s => s.precioSugerido > 0).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [servicios]
  );
  const zona = activas.find(z => z.id === (zonaId || activas[0]?.id));
  // Fuera de Hermosillo solo van novias; el color solo donde la zona lo permite (respuestas de octubre 2026)
  const permitidos = ordenados.filter(s => /for[aá]neo/i.test(s.nombre) || (zona?.color && s.categoria === 'color'));
  const elegidos = permitidos.filter(s => servicioIds.includes(s.id));
  const km = zona ? zona.km : kmOtro;
  const dias = zona ? zona.dias : diasOtro;
  // Novias que obligan a dormir allá: una noche menos que los días. En Arizona no se paga hotel (v5).
  const noches = zona?.color ? 0 : Math.max(0, dias - 1);
  const { gasolina, viaticos, traslado, hospedaje } = calcularTraslado(km, dias, params, noches);
  const servicio = elegidos.reduce((t, s) => t + s.precioSugerido, 0) * clientas;
  const total = servicio + traslado + hospedaje;
  const anticipo = Math.round((total * 0.3) / 50) * 50;
  const lugar = zona ? zona.nombre : 'fuera de Hermosillo';
  const hayColor = elegidos.some(s => s.categoria === 'color');
  const avisos = [
    hayColor && zona?.color && zona.minimoClientas && clientas < zona.minimoClientas && `Para color en ${zona.nombre} se necesitan al menos ${zona.minimoClientas} clientas.`,
    zona?.anticipacionDias && `Agendar con al menos ${zona.anticipacionDias} días de anticipación, sujeto a disponibilidad.`
  ].filter(Boolean) as string[];

  const texto = [
    `Cotización ${lugar}${clientas > 1 ? ` (${clientas} clientas)` : ''}:`,
    ...elegidos.map(s => `• ${s.nombre}: ${formatCurrency(s.precioSugerido)}${clientas > 1 ? ` × ${clientas}` : ''}`),
    `• Traslado (gasolina y viáticos): ${formatCurrency(traslado)}`,
    ...(noches ? [`• Hospedaje (${noches} ${noches === 1 ? 'noche' : 'noches'}): ${formatCurrency(hospedaje)}`] : []),
    `Total: ${formatCurrency(total)}`,
    `Anticipo para apartar la fecha (30%): ${formatCurrency(anticipo)}`
  ].join('\n');

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      alert('Cotización copiada. Pégala en WhatsApp.');
    } catch {
      alert(texto);
    }
  };

  const toggle = (id: string) =>
    setServicioIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));

  const cambiarZona = (i: number, cambios: Partial<Zona>) =>
    setEditando(z => z && z.map((x, j) => (j === i ? { ...x, ...cambios } : x)));
  const guardarZonas = async () => {
    if (!editando) return;
    if (editando.some(z => !z.nombre.trim())) { alert('Cada zona necesita un nombre'); return; }
    const actual = await db.configuracion.get('settings');
    await db.configuracion.put({ ...(actual as any), id: 'settings', zonas: editando });
    setEditando(null);
  };

  return (
    <div className="bg-white rounded-lg shadow border">
      <button onClick={() => setAbierto(!abierto)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          <MapPin size={18} className="text-purple-600" />
          Fuera de Hermosillo: zonas y cotizador
        </span>
        <span className="text-sm text-gray-500">{abierto ? 'Ocultar' : `${activas.length} zonas · servicio + traslado`}</span>
      </button>

      {abierto && (
        <div className="border-t p-4 space-y-6">
          {/* Zonas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Zonas</h4>
              {editando ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditando(null)} className="text-sm text-gray-600 px-3 py-1 rounded hover:bg-gray-100">Cancelar</button>
                  <button onClick={guardarZonas} className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">Guardar zonas</button>
                </div>
              ) : (
                <button onClick={() => setEditando(zonas.map(z => ({ ...z })))} className="text-sm text-purple-700 border border-purple-200 px-3 py-1 rounded hover:bg-purple-50">Editar zonas</button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Fuera de Hermosillo solo van los servicios de novia. Marca «Color» en las zonas donde también se hacen diseños de color (con su mínimo de clientas).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th className="p-2">Zona</th><th className="p-2">Región</th><th className="p-2">Km ida y vuelta</th><th className="p-2">Días</th>
                    <th className="p-2">Color</th><th className="p-2">Mín. clientas</th><th className="p-2">Anticipación (días)</th><th className="p-2">Activa</th>
                    {editando && <th className="p-2" />}
                  </tr>
                </thead>
                <tbody>
                  {(editando ?? zonas).map((z, i) => editando ? (
                    <tr key={z.id} className="border-t">
                      <td className="p-1"><input className={chico} value={z.nombre} onChange={e => cambiarZona(i, { nombre: e.target.value })} /></td>
                      <td className="p-1"><input className={chico} value={z.region} onChange={e => cambiarZona(i, { region: e.target.value })} /></td>
                      <td className="p-1"><input className={chico} type="number" min="0" value={z.km} onChange={e => cambiarZona(i, { km: Number(e.target.value) })} /></td>
                      <td className="p-1"><input className={chico} type="number" min="1" value={z.dias} onChange={e => cambiarZona(i, { dias: Number(e.target.value) })} /></td>
                      <td className="p-1 text-center"><input type="checkbox" checked={z.color} onChange={e => cambiarZona(i, { color: e.target.checked })} /></td>
                      <td className="p-1"><input className={chico} type="number" min="0" value={z.minimoClientas ?? ''} onChange={e => cambiarZona(i, { minimoClientas: Number(e.target.value) || undefined })} /></td>
                      <td className="p-1"><input className={chico} type="number" min="0" value={z.anticipacionDias ?? ''} onChange={e => cambiarZona(i, { anticipacionDias: Number(e.target.value) || undefined })} /></td>
                      <td className="p-1 text-center"><input type="checkbox" checked={z.activa} onChange={e => cambiarZona(i, { activa: e.target.checked })} /></td>
                      <td className="p-1">
                        <button onClick={() => confirm(`¿Quitar ${z.nombre || 'esta zona'}? Las citas viejas conservan el nombre.`) && setEditando(editando.filter((_, j) => j !== i))}
                          className="text-red-600 p-1 hover:bg-red-50 rounded" title="Quitar"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={z.id} className={`border-t ${z.activa ? '' : 'text-gray-400'}`}>
                      <td className="p-2 font-medium">{z.nombre}</td><td className="p-2">{z.region}</td><td className="p-2">{z.km}</td><td className="p-2">{z.dias}</td>
                      <td className="p-2">{z.color ? 'Sí' : '—'}</td><td className="p-2">{z.minimoClientas ?? '—'}</td><td className="p-2">{z.anticipacionDias ?? '—'}</td>
                      <td className="p-2">{z.activa ? 'Sí' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {editando && (
              <button
                onClick={() => setEditando([...editando, { id: idZona('zona nueva', editando), nombre: '', region: '', km: 0, dias: 1, color: false, activa: true }])}
                className="mt-2 text-sm text-purple-700 flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Agregar zona
              </button>
            )}
          </div>

          {/* Cotizador */}
          <div className="grid gap-6 lg:grid-cols-2 border-t pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                  <select value={zona ? zona.id : OTRO} onChange={e => setZonaId(e.target.value)} className={campo}>
                    {[...new Set(activas.map(z => z.region))].map(r => (
                      <optgroup key={r} label={r || 'Sin región'}>
                        {activas.filter(z => z.region === r).map(z => (
                          <option key={z.id} value={z.id}>{z.nombre} · {z.km} km · {z.dias} {z.dias === 1 ? 'día' : 'días'}</option>
                        ))}
                      </optgroup>
                    ))}
                    <option value={OTRO}>Otro destino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clientas</label>
                  <input type="number" min="1" value={clientas} onChange={e => setClientas(Math.max(1, Number(e.target.value)))} className={campo} />
                </div>
              </div>
              {!zona && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Km ida y vuelta</label>
                    <input type="number" min="0" value={kmOtro || ''} onChange={e => setKmOtro(Number(e.target.value))} className={campo} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Días</label>
                    <input type="number" min="1" value={diasOtro} onChange={e => setDiasOtro(Number(e.target.value))} className={campo} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicios</label>
                <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
                  {permitidos.map(s => (
                    <label key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <input type="checkbox" checked={servicioIds.includes(s.id)} onChange={() => toggle(s.id)} />
                        {s.nombre}
                      </span>
                      <span className="text-gray-500">{formatCurrency(s.precioSugerido)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600">Ajustar gasolina y viáticos</summary>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {([
                    ['kmPorLitro', 'Km por litro'],
                    ['precioGasolina', 'Gasolina por litro'],
                    ['comidaDia', 'Comida por persona/día'],
                    ['cafeDia', 'Café por persona/día'],
                    ['personas', 'Personas'],
                    ['hospedajeNoche', 'Hospedaje por noche (mínimo)']
                  ] as const).map(([k, etiqueta]) => (
                    <div key={k}>
                      <label className="block text-xs text-gray-600 mb-1">{etiqueta}</label>
                      <input type="number" step="0.5" min="0" value={params[k]}
                        onChange={e => setParams({ ...params, [k]: Number(e.target.value) })} className={campo} />
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-sm space-y-2 self-start">
              {elegidos.map(s => (
                <div key={s.id} className="flex justify-between"><span>{s.nombre}{clientas > 1 ? ` × ${clientas}` : ''}</span><span>{formatCurrency(s.precioSugerido * clientas)}</span></div>
              ))}
              {elegidos.length === 0 && <p className="text-gray-500">Elige uno o más servicios.</p>}
              <div className="flex justify-between text-gray-600"><span>Gasolina ({km} km)</span><span>{formatCurrency(gasolina)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Viáticos ({dias} {dias === 1 ? 'día' : 'días'}, {params.personas} personas)</span><span>{formatCurrency(viaticos)}</span></div>
              <div className="flex justify-between font-medium border-t pt-2"><span>Traslado</span><span>{formatCurrency(traslado)}</span></div>
              {noches > 0 && <div className="flex justify-between font-medium"><span>Hospedaje ({noches} {noches === 1 ? 'noche' : 'noches'})</span><span>{formatCurrency(hospedaje)}</span></div>}
              <div className="flex justify-between text-lg font-semibold border-t pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
              <div className="flex justify-between text-purple-700"><span>Anticipo 30%</span><span>{formatCurrency(anticipo)}</span></div>
              {avisos.map(a => (
                <p key={a} className="text-xs text-amber-800 flex gap-1"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{a}</p>
              ))}
              <p className="text-xs text-gray-500 pt-1">Sin casetas. Hospedaje mínimo por noche cuando hay que dormir allá; si el hotel cuesta más, la diferencia la pone el salón (anotarla como gasto del viaje). Para Arizona no incluye visa ni seguro del carro.</p>
              <button onClick={copiar} disabled={elegidos.length === 0}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-purple-600 text-white rounded-lg py-2 hover:bg-purple-700 disabled:opacity-40">
                <Copy size={16} /> Copiar para WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
