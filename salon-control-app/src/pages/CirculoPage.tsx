import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MessageCircle, Search } from 'lucide-react';
import { db } from '../db/db';
import { registrarCanjes, asignarRecomendacion } from '../db/circulo';
import {
  NIVELES, BENEFICIOS, gastoDoceMeses, nivelDe, siguienteNivel, beneficiosDisponibles,
  beneficioEnColor, enlaceWhatsApp, type Nivel, type ClaveBeneficio
} from '../utils/lealtad';
import { formatCurrency } from '../utils/financialUtils';

const ESTILO_NIVEL: Record<Nivel, string> = {
  onix: 'bg-marca-negro text-marca-dorado',
  dorado: 'bg-marca-dorado text-marca-negro',
  marfil: 'bg-marca-marfil text-marca-dorado-prof border border-marca-champan'
};

export const InsigniaNivel = ({ nivel }: { nivel: Nivel }) => (
  <span className={`inline-block text-[11px] tracking-[0.14em] uppercase px-2.5 py-0.5 rounded-full font-medium ${ESTILO_NIVEL[nivel]}`}>
    {NIVELES[nivel].nombre}
  </span>
);

export default function CirculoPage() {
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const citas = useLiveQuery(() => db.citas.toArray()) || [];
  const ventas = useLiveQuery(() => db.ventas.toArray()) || [];
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  const [filtro, setFiltro] = useState<Nivel | 'todas'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);

  const filas = useMemo(() => clientes
    .filter(c => c.activo !== false)
    .map(c => {
      const gasto = gastoDoceMeses(c.id, citas, ventas);
      const nivel = nivelDe(gasto);
      return { cliente: c, gasto, nivel, sig: siguienteNivel(gasto), disponibles: beneficiosDisponibles(c, nivel, clientes, citas, servicios) };
    })
    .sort((a, b) => b.gasto - a.gasto), [clientes, citas, ventas, servicios]);

  const visibles = filas.filter(f =>
    (filtro === 'todas' || f.nivel === filtro) &&
    f.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const seleccionada = filas.find(f => f.cliente.id === seleccionadaId) || null;
  const porNivel = (n: Nivel) => filas.filter(f => f.nivel === n).length;

  const canjear = async (clienteId: string, clave: ClaveBeneficio) => {
    if (!confirm(`¿Registrar el canje de «${BENEFICIOS[clave].titulo}»?`)) return;
    await registrarCanjes(clienteId, [clave]);
  };

  const mensaje = (f: (typeof filas)[number]) =>
    `¡Hola, ${f.cliente.nombre.split(' ')[0]}! Eres parte del Círculo CB 🤍 Estás en nivel ${NIVELES[f.nivel].nombre}` +
    (f.sig ? `; te faltan ${formatCurrency(f.sig.falta)} para ${NIVELES[f.sig.nivel].nombre}.` : '.') +
    (f.disponibles.length ? ` Tienes disponible: ${f.disponibles.map(k => BENEFICIOS[k].titulo).join(', ')}.` : '') +
    ' — Cristina';

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-5 min-w-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Círculo CB</h1>
          <p className="text-gray-600 mt-1">Programa de lealtad · nivel por lo gastado en los últimos 12 meses (servicios sin propina y producto).</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            [filas.length, 'Clientas en el círculo'],
            [`${porNivel('dorado')} · ${porNivel('onix')}`, 'En Dorado · Ónix'],
            [filas.filter(f => f.sig && f.sig.falta <= 1000).length, 'A $1,000 o menos de subir'],
            [filas.reduce((t, f) => t + f.disponibles.length, 0), 'Beneficios por canjear']
          ].map(([v, l]) => (
            <div key={String(l)} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="font-display text-3xl leading-none">{v}</div>
              <div className="text-xs text-gray-500 mt-2">{l}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar clienta…"
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <select value={filtro} onChange={e => setFiltro(e.target.value as Nivel | 'todas')} className="border rounded-lg px-3 py-2">
            <option value="todas">Todos los niveles</option>
            <option value="onix">Ónix</option>
            <option value="dorado">Dorado</option>
            <option value="marfil">Marfil</option>
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr><th className="p-3">Clienta</th><th className="p-3">Nivel</th><th className="p-3">Gasto 12 meses</th><th className="p-3">Al siguiente nivel</th><th className="p-3">Por canjear</th></tr>
            </thead>
            <tbody>
              {visibles.map(f => (
                <tr key={f.cliente.id} onClick={() => setSeleccionadaId(f.cliente.id)}
                  className={`border-t cursor-pointer hover:bg-gray-50 ${seleccionadaId === f.cliente.id ? 'bg-purple-50' : ''}`}>
                  <td className="p-3 font-medium text-gray-900">{f.cliente.nombre}</td>
                  <td className="p-3"><InsigniaNivel nivel={f.nivel} /></td>
                  <td className="p-3">{formatCurrency(f.gasto)}</td>
                  <td className="p-3">
                    {f.sig ? (
                      <div className="w-36">
                        <div className="h-1.5 bg-gray-100 rounded overflow-hidden">
                          <div className="h-full bg-marca-dorado" style={{ width: `${Math.round((f.gasto / NIVELES[f.sig.nivel].desde) * 100)}%` }} />
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">Faltan {formatCurrency(f.sig.falta)}</div>
                      </div>
                    ) : <span className="text-gray-500">Nivel máximo</span>}
                  </td>
                  <td className="p-3 text-gray-700">{f.disponibles.length ? f.disponibles.map(k => BENEFICIOS[k].titulo.split(' (')[0]).join(', ') : '—'}</td>
                </tr>
              ))}
              {!visibles.length && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Sin clientas con ese filtro.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          Marfil al registrarse · Dorado desde {formatCurrency(NIVELES.dorado.desde)} · Ónix desde {formatCurrency(NIVELES.onix.desde)}.
          Las cortesías de cada color (ampolleta o mascarilla) se aplican desde el cobro de la cita.
        </p>
      </div>

      {/* Ficha de la clienta */}
      <aside className="bg-white border border-gray-200 rounded-lg p-5 h-fit xl:sticky xl:top-4">
        {!seleccionada ? (
          <p className="text-sm text-gray-500">Elige una clienta para ver su tarjeta, beneficios e historial.</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-marca-negro text-white rounded-xl p-5 relative overflow-hidden">
              <img src="./marca/CB_monograma_dorado.svg" alt="" className="absolute -right-6 -bottom-8 h-40 opacity-10" />
              <div className="text-[11px] tracking-[0.28em] uppercase text-marca-dorado">Círculo CB · {NIVELES[seleccionada.nivel].nombre}</div>
              <div className="font-display text-3xl mt-2">{seleccionada.cliente.nombre}</div>
              <div className="text-xs text-gray-300 mt-1">{formatCurrency(seleccionada.gasto)} en 12 meses</div>
              {seleccionada.sig && (
                <>
                  <div className="h-1.5 bg-white/20 rounded mt-4 overflow-hidden w-40">
                    <div className="h-full bg-marca-dorado" style={{ width: `${Math.round((seleccionada.gasto / NIVELES[seleccionada.sig.nivel].desde) * 100)}%` }} />
                  </div>
                  <div className="text-[11px] text-gray-300 mt-1">Faltan {formatCurrency(seleccionada.sig.falta)} para {NIVELES[seleccionada.sig.nivel].nombre}</div>
                </>
              )}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-purple-600 mb-1">Beneficios</div>
              {seleccionada.disponibles.map((k, i) => (
                <div key={k + i} className="flex items-center justify-between gap-2 py-2 border-t text-sm">
                  <span>{BENEFICIOS[k].titulo}</span>
                  <button onClick={() => canjear(seleccionada.cliente.id, k)} className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700">Canjear</button>
                </div>
              ))}
              {beneficioEnColor(seleccionada.nivel) && (
                <div className="flex justify-between gap-2 py-2 border-t text-sm">
                  <span>{BENEFICIOS[beneficioEnColor(seleccionada.nivel)!].titulo} con cada color</span>
                  <span className="text-xs text-purple-600 shrink-0">En el cobro</span>
                </div>
              )}
              {seleccionada.nivel !== 'marfil' && (
                <div className="flex justify-between gap-2 py-2 border-t text-sm">
                  <span>Prioridad para agendar diciembre{seleccionada.nivel === 'onix' ? ' y mayo' : ''}</span>
                  <span className="text-xs text-purple-600 shrink-0">Activo</span>
                </div>
              )}
              <div className="py-2 border-t text-sm text-gray-500">Trae a una amiga: matiz corto cuando ella paga su primer color.</div>
            </div>

            <label className="block text-sm">
              <span className="text-[11px] uppercase tracking-[0.2em] text-purple-600">Recomendada por</span>
              <select value={seleccionada.cliente.referidaPor || ''} onChange={e => asignarRecomendacion(seleccionada.cliente.id, e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2">
                <option value="">Nadie / no sé</option>
                {clientes.filter(c => c.id !== seleccionada.cliente.id).sort((a, b) => a.nombre.localeCompare(b.nombre))
                  .map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>

            {(() => {
              const url = enlaceWhatsApp(seleccionada.cliente.telefono, mensaje(seleccionada));
              return url ? (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
                  <MessageCircle size={16} /> Enviarle su nivel por WhatsApp
                </a>
              ) : <p className="text-xs text-gray-500">Sin teléfono válido para WhatsApp.</p>;
            })()}

            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-purple-600 mb-1">Historial de canjes</div>
              {(seleccionada.cliente.canjes || []).slice().reverse().map((c, i) => (
                <div key={i} className="py-1.5 border-t text-sm text-gray-600">
                  {new Date(c.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })} · {BENEFICIOS[c.clave]?.titulo || c.clave}
                </div>
              ))}
              {!(seleccionada.cliente.canjes || []).length && <p className="text-sm text-gray-400">Aún no ha canjeado beneficios.</p>}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
