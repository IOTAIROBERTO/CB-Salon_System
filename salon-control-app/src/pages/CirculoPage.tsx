import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CreditCard, MessageCircle, Search, SlidersHorizontal } from 'lucide-react';
import { db } from '../db/db';
import { registrarCanjes, asignarRecomendacion, canjearPuntos } from '../db/circulo';
import { useRolSalon } from '../db/salon';
import {
  NOMBRE_NIVEL, NOMBRE_CIRCULO, BENEFICIOS, estadoCirculo, siguienteNivel, beneficiosDisponibles, descuentoProducto, siguienteDescuento,
  multiplicador, montoCanje, rachaConstancia, tituloCanje, enlaceWhatsApp, codigoClienta, parametrosDe, PARAMETROS_CIRCULO,
  type Nivel, type ClaveBeneficio, type ParametrosCirculo
} from '../utils/lealtad';
import { imprimirTarjeta } from '../utils/tarjetaCirculo';
import { normalizar } from '../utils/texto';

const ESTILO_NIVEL: Record<Nivel, string> = {
  onix: 'bg-marca-negro text-marca-dorado',
  dorado: 'bg-marca-dorado text-marca-negro',
  marfil: 'bg-marca-marfil text-marca-dorado-prof border border-marca-champan'
};

export const InsigniaNivel = ({ nivel }: { nivel: Nivel }) => (
  <span className={`inline-block text-[11px] tracking-[0.14em] uppercase px-2.5 py-0.5 rounded-full font-medium ${ESTILO_NIVEL[nivel]}`}>
    {NOMBRE_NIVEL[nivel]}
  </span>
);

const REGLAS: [keyof ParametrosCirculo, string][] = [
  ['bienvenida', 'Bienvenida al activar'], ['pesosPorPuntoServicio', 'Pesos en servicios por punto'], ['pesosPorPuntoProducto', 'Pesos en producto por punto'],
  ['reservaEnLinea', 'Reserva en línea'], ['cumpleanos', 'Visita en su cumpleaños'], ['referida', 'Amiga recomendada (con color)'],
  ['inactividadPorcentaje', '% que se pierde por mes sin visita'], ['mesesDeGracia', 'Meses sin visita que no castigan'], ['dorado', 'Puntos para Dorado'], ['onix', 'Puntos para Ónix'],
  ['multiplicadorDorado', 'Multiplicador en Dorado'], ['multiplicadorOnix', 'Multiplicador en Ónix'], ['pesosPorPuntoCanje', 'Pesos de saldo por punto canjeado'],
  ['canjeMinimo', 'Puntos mínimos para canjear'], ['constanciaVisitas', 'Visitas seguidas para corte de cortesía'], ['constanciaDias', 'Días máximos entre visitas (constancia)']
];

export default function CirculoPage() {
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const citas = useLiveQuery(() => db.citas.toArray()) || [];
  const ventas = useLiveQuery(() => db.ventas.toArray()) || [];
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  const settings = useLiveQuery(() => db.configuracion.get('settings'));
  const p = parametrosDe(settings as any);
  const [filtro, setFiltro] = useState<Nivel | 'todas'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const [reglas, setReglas] = useState<ParametrosCirculo | null>(null);
  const [aCanjear, setACanjear] = useState('');
  const esDuena = useRolSalon() === 'duena';
  const arrancado = new Date().toISOString().slice(0, 10) >= p.inicio;

  const filas = useMemo(() => clientes
    .filter(c => c.activo !== false)
    .map(c => {
      const e = estadoCirculo(c, citas, ventas, clientes, servicios, p);
      return { cliente: c, codigo: codigoClienta(c.id), ...e, sig: siguienteNivel(e.puntos, p), disponibles: beneficiosDisponibles(c, e.nivel, clientes, citas, servicios, new Date(), p), descuento: descuentoProducto(e.puntos, p) };
    })
    .sort((a, b) => b.puntos - a.puntos || a.cliente.nombre.localeCompare(b.cliente.nombre)), [clientes, citas, ventas, servicios, p]);

  const q = normalizar(busqueda.trim());
  const visibles = filas.filter(f =>
    (filtro === 'todas' || f.nivel === filtro) &&
    (!q || normalizar(f.cliente.nombre).includes(q) || f.codigo.toLowerCase() === q));
  const seleccionada = filas.find(f => f.cliente.id === seleccionadaId) || (visibles.length === 1 && q ? visibles[0] : null);
  const porNivel = (n: Nivel) => filas.filter(f => f.nivel === n).length;

  const canjear = async (clienteId: string, clave: ClaveBeneficio) => {
    if (!confirm(`¿Registrar el canje de «${BENEFICIOS[clave].titulo}»?`)) return;
    await registrarCanjes(clienteId, [clave]);
  };

  const canjearSaldo = async (clienteId: string, disponibles: number) => {
    const puntos = Math.floor(Number(aCanjear));
    if (!(puntos >= p.canjeMinimo)) return alert(`El canje mínimo es de ${p.canjeMinimo} puntos.`);
    if (puntos > disponibles) return alert(`Solo tiene ${disponibles} puntos.`);
    if (!confirm(`¿Cambiar ${puntos} puntos por $${montoCanje(puntos, p)} de saldo a favor?`)) return;
    await canjearPuntos(clienteId, puntos, p);
    setACanjear('');
  };

  const guardarReglas = async () => {
    if (!reglas) return;
    const actual = await db.configuracion.get('settings');
    await db.configuracion.put({ ...(actual as any), id: 'settings', circulo: reglas });
    setReglas(null);
  };

  const mensaje = (f: (typeof filas)[number]) =>
    `¡Hola, ${f.cliente.nombre.split(' ')[0]}! Eres parte del ${NOMBRE_CIRCULO} 🤍 Tienes ${f.puntos.toLocaleString('es-MX')} puntos, nivel ${NOMBRE_NIVEL[f.nivel]}` +
    (f.sig ? `; te faltan ${f.sig.falta.toLocaleString('es-MX')} para ${NOMBRE_NIVEL[f.sig.nivel]}.` : '.') +
    (f.descuento ? ` Tienes ${f.descuento}% de descuento en productos para el cabello y cepillos.` : '') +
    (f.disponibles.length ? ` Tienes disponible: ${f.disponibles.map(k => BENEFICIOS[k].titulo).join(', ')}.` : '') +
    ' — Cristina';

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-5 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{NOMBRE_CIRCULO}</h1>
            <p className="text-gray-600 mt-1">Programa de lealtad por puntos: visitas, producto y bonos; cada mes sin visita resta puntos.</p>
          </div>
          <button onClick={() => setReglas(reglas ? null : { ...p })} className="text-sm border rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-50">
            <SlidersHorizontal size={16} /> Reglas
          </button>
        </div>

        {!arrancado && (
          <div className="bg-marca-marfil border border-marca-champan rounded-lg p-3 text-sm text-gray-700">
            El {NOMBRE_CIRCULO} arranca el {new Date(`${p.inicio}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}: todas empiezan en Marfil con cero puntos.
            Ya puedes imprimir tarjetas y ajustar las reglas.
          </div>
        )}

        {reglas && (
          <div className="bg-white border rounded-lg p-4 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <label className="text-gray-600">Inicio del programa
                <input type="date" value={reglas.inicio} onChange={e => setReglas({ ...reglas, inicio: e.target.value })} className="w-full border rounded px-2 py-1 mt-1" />
              </label>
              {REGLAS.map(([k, etiqueta]) => (
                <label key={k} className="text-gray-600">{etiqueta}
                  <input type="number" min="0" value={reglas[k] as number} onChange={e => setReglas({ ...reglas, [k]: Number(e.target.value) })} className="w-full border rounded px-2 py-1 mt-1" />
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setReglas({ ...PARAMETROS_CIRCULO })} className="text-sm text-gray-600 px-3 py-1 rounded hover:bg-gray-100">Valores sugeridos</button>
              <button onClick={guardarReglas} className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">Guardar reglas</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            [filas.filter(f => f.activa).length, 'Tarjetas activas'],
            [`${porNivel('dorado')} · ${porNivel('onix')}`, 'En Dorado · Ónix'],
            [filas.filter(f => f.sig && f.sig.falta <= 100).length, 'A 100 puntos o menos de subir'],
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
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o código (lector de tarjeta)…"
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
              <tr><th className="p-3">Clienta</th><th className="p-3">Nivel</th><th className="p-3">Puntos</th><th className="p-3">Al siguiente nivel</th><th className="p-3">Por canjear</th></tr>
            </thead>
            <tbody>
              {visibles.map(f => (
                <tr key={f.cliente.id} onClick={() => setSeleccionadaId(f.cliente.id)}
                  className={`border-t cursor-pointer hover:bg-gray-50 ${seleccionada?.cliente.id === f.cliente.id ? 'bg-purple-50' : ''}`}>
                  <td className="p-3 font-medium text-gray-900">{f.cliente.nombre}<div className="text-[11px] text-gray-400 font-normal">{f.codigo}</div></td>
                  <td className="p-3"><InsigniaNivel nivel={f.nivel} /></td>
                  <td className="p-3">{f.puntos.toLocaleString('es-MX')}</td>
                  <td className="p-3">
                    {f.sig ? (
                      <div className="w-36">
                        <div className="h-1.5 bg-gray-100 rounded overflow-hidden">
                          <div className="h-full bg-marca-dorado" style={{ width: `${Math.round((f.puntos / (f.sig.nivel === 'onix' ? p.onix : p.dorado)) * 100)}%` }} />
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">Faltan {f.sig.falta.toLocaleString('es-MX')} puntos</div>
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
          Marfil al activar la tarjeta · Dorado desde {p.dorado.toLocaleString('es-MX')} puntos · Ónix desde {p.onix.toLocaleString('es-MX')}.
          Las cortesías de cada color (ampolleta o mascarilla) se aplican desde el cobro de la cita.
        </p>
      </div>

      {/* Ficha de la clienta */}
      <aside className="bg-white border border-gray-200 rounded-lg p-5 h-fit xl:sticky xl:top-4">
        {!seleccionada ? (
          <p className="text-sm text-gray-500">Elige una clienta o lee su tarjeta para ver sus puntos, beneficios y movimientos.</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-marca-negro text-white rounded-xl p-5 relative overflow-hidden">
              <img src="./marca/CB_monograma_dorado.svg" alt="" className="absolute -right-6 -bottom-8 h-40 opacity-10" />
              <div className="text-[11px] tracking-[0.28em] uppercase text-marca-dorado">{NOMBRE_CIRCULO} · {NOMBRE_NIVEL[seleccionada.nivel]}</div>
              <div className="font-display text-3xl mt-2">{seleccionada.cliente.nombre}</div>
              <div className="text-xs text-gray-300 mt-1">{seleccionada.puntos.toLocaleString('es-MX')} puntos · {seleccionada.codigo}</div>
              {seleccionada.sig && (
                <>
                  <div className="h-1.5 bg-white/20 rounded mt-4 overflow-hidden w-40">
                    <div className="h-full bg-marca-dorado" style={{ width: `${Math.round((seleccionada.puntos / (seleccionada.sig.nivel === 'onix' ? p.onix : p.dorado)) * 100)}%` }} />
                  </div>
                  <div className="text-[11px] text-gray-300 mt-1">Faltan {seleccionada.sig.falta.toLocaleString('es-MX')} para {NOMBRE_NIVEL[seleccionada.sig.nivel]}</div>
                </>
              )}
            </div>
            <button onClick={() => imprimirTarjeta(seleccionada.cliente.nombre, seleccionada.codigo)}
              className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
              <CreditCard size={16} /> Imprimir tarjeta con QR
            </button>

            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-purple-600 mb-1">Beneficios</div>
              {seleccionada.disponibles.map((k, i) => (
                <div key={k + i} className="flex items-center justify-between gap-2 py-2 border-t text-sm">
                  <span>{BENEFICIOS[k].titulo}</span>
                  <button onClick={() => canjear(seleccionada.cliente.id, k)} className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700">Canjear</button>
                </div>
              ))}
              <div className="flex justify-between gap-2 py-2 border-t text-sm">
                <span>Descuento en productos para el cabello y cepillos</span>
                <span className="text-xs text-purple-600 shrink-0">{seleccionada.descuento ? `${seleccionada.descuento}%` : '—'}</span>
              </div>
              {(() => { const sd = siguienteDescuento(seleccionada.puntos, p); return sd && (
                <div className="py-1 text-xs text-gray-500">Con {sd.puntos.toLocaleString('es-MX')} puntos se desbloquea {sd.pct}% (le faltan {(sd.puntos - seleccionada.puntos).toLocaleString('es-MX')}).</div>
              ); })()}
              <div className="flex justify-between gap-2 py-2 border-t text-sm">
                <span>Puntos por cada compra</span>
                <span className="text-xs text-purple-600 shrink-0">×{multiplicador(seleccionada.nivel, p)}</span>
              </div>
              <div className="flex justify-between gap-2 py-2 border-t text-sm">
                <span>Constancia: {Math.min(rachaConstancia(seleccionada.cliente, citas, p), p.constanciaVisitas)} de {p.constanciaVisitas} visitas seguidas para un corte de cortesía</span>
              </div>
              <div className="py-2 border-t text-sm text-gray-500">Trae a una amiga: {p.referida} puntos cuando ella paga su primer color.</div>
              {esDuena && arrancado && seleccionada.puntos >= p.canjeMinimo && (
                <div className="py-2 border-t text-sm">
                  <div className="mb-1">Cambiar puntos por saldo a favor (para productos, color, maquillaje o corte): {p.canjeMinimo} puntos = ${montoCanje(p.canjeMinimo, p)}</div>
                  <div className="flex gap-2">
                    <input type="number" min={p.canjeMinimo} max={seleccionada.puntos} value={aCanjear} onChange={e => setACanjear(e.target.value)} placeholder={`${p.canjeMinimo}`} className="w-28 border rounded px-2 py-1" />
                    <button onClick={() => canjearSaldo(seleccionada.cliente.id, seleccionada.puntos)} className="text-xs px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700">Canjear por saldo</button>
                  </div>
                </div>
              )}
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
                  <MessageCircle size={16} /> Enviarle sus puntos por WhatsApp
                </a>
              ) : <p className="text-xs text-gray-500">Sin teléfono válido para WhatsApp.</p>;
            })()}

            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-purple-600 mb-1">Movimientos de puntos</div>
              {seleccionada.movimientos.slice().reverse().slice(0, 12).map((m, i) => (
                <div key={i} className="flex justify-between py-1.5 border-t text-sm text-gray-600">
                  <span>{new Date(`${m.fecha}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} · {m.concepto}</span>
                  <span className={m.puntos < 0 ? 'text-red-600' : 'text-green-700'}>{m.puntos > 0 ? '+' : ''}{m.puntos}</span>
                </div>
              ))}
              {!seleccionada.movimientos.length && <p className="text-sm text-gray-400">Sin movimientos desde el arranque del programa.</p>}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-purple-600 mb-1">Historial de canjes</div>
              {(seleccionada.cliente.canjes || []).slice().reverse().map((c, i) => (
                <div key={i} className="py-1.5 border-t text-sm text-gray-600">
                  {new Date(c.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })} · {tituloCanje(c)}
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
