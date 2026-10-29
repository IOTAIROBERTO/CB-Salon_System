import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Cake, Check, MessageCircle, Play, Plus, Search, UserX, Wallet } from 'lucide-react';
import { db } from '../db/db';
import useCitas from '../hooks/useCitas';
import { useRolSalon } from '../db/salon';
import { enlaceMiCita, marcarNoLlego, urlMiCita } from '../db/miCita';
import { type Cita } from '../types/citas';
import CobroExpres from '../components/hoy/CobroExpres';
import CitaExpres from '../components/hoy/CitaExpres';
import CobroModal from '../components/citas/CobroModal';
import ValorarSolicitud from '../components/avisos/ValorarSolicitud';
import { cobroExpres } from '../utils/cobro';
import { ingresoCita } from '../utils/reportUtils';
import { enlaceWhatsApp } from '../utils/lealtad';
import { esCumpleanosHoy } from '../utils/clientesUtils';
import { formatCurrency } from '../utils/financialUtils';
import { fechaLocalISO } from '../utils/dateValidation';
import { DATOS_SALON } from '../data/datosSalon';

// «Hoy»: lo que toca hacer en el salón, cada cosa con su siguiente paso a un toque (pensada para el celular).
// Solicitudes por valorar, anticipos por recibir, citas del día (iniciar → cobrar), recordatorios de mañana y
// cumpleañeras. «Buscar» abre la búsqueda global (BuscarGlobal escucha el evento cb-buscar).
const diaLargo = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const diaDe = (f = '') => f.length > 10 ? fechaLocalISO(new Date(f)) : f;   // ISO con hora → día local
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default function HoyPage() {
  const { citas, servicios, changeEstadoCita, completarCita } = useCitas();
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const ventas = useLiveQuery(() => db.ventas.toArray()) || [];
  const esDuena = useRolSalon() === 'duena';
  const [nueva, setNueva] = useState(false);
  const [valorando, setValorando] = useState<string | null>(null);
  const [cobrando, setCobrando] = useState<{ cita: Cita; completo: boolean } | null>(null);

  const hoy = fechaLocalISO(), manana = fechaLocalISO(new Date(Date.now() + 86400000));
  const ahora = new Date().toTimeString().slice(0, 5);
  const nombre = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Clienta';
  const servicio = (id: string) => servicios.find(s => s.id === id)?.nombre || 'Servicio';
  const porHora = (a: Cita, b: Cita) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`);

  const deHoy = citas.filter(c => c.fecha === hoy && c.estado !== 'cancelada').sort(porHora);
  const porValorar = citas.filter(c => c.estado === 'pendiente' && c.origen && c.precioAcordado == null && c.fecha >= hoy).sort(porHora);
  const anticipos = citas.filter(c => ['pendiente', 'confirmada'].includes(c.estado) && c.fecha >= hoy && (c.montoAnticipo || 0) > 0 && !c.anticipoConfirmado
    && c.precioAcordado != null && ['transferencia', 'deposito'].includes(c.formaAnticipo || '')).sort(porHora);
  const deManana = citas.filter(c => c.fecha === manana && ['pendiente', 'confirmada'].includes(c.estado)).sort(porHora);
  const cumpleaneras = clientes.filter(c => c.activo !== false && esCumpleanosHoy(c.cumple));
  const cobrado = citas.filter(c => c.estado === 'completada' && diaDe(c.fechaCompletada) === hoy).reduce((t, c) => t + ingresoCita(c as any), 0)
    + ventas.filter(v => diaDe(v.fecha) === hoy).reduce((t, v) => t + (v.total || 0), 0);

  // El enlace «Mi cita» de las de mañana se prepara antes, así el WhatsApp abre con un solo toque (sin esperar)
  useEffect(() => { for (const c of deManana) if (!c.enlace) enlaceMiCita(c); }, [deManana.map(c => c.id + (c.enlace || '')).join()]);

  const recordatorio = (c: Cita) => {
    const cl = clientes.find(x => x.id === c.clienteId);
    return c.enlace ? enlaceWhatsApp(cl?.telefono, `¡Hola, ${(cl?.nombre || '').split(' ')[0]}! Te recordamos tu cita de mañana, ${diaLargo(c.fecha)}, a las ${c.hora} para ${servicio(c.servicioId)} en ${DATOS_SALON.nombre}. Ve, cambia o cancela tu cita aquí: ${urlMiCita(c.id, c.enlace)}`) : null;
  };
  const anticipoRecibido = (c: Cita) => db.citas.update(c.id, { anticipoConfirmado: true, estado: 'confirmada' });

  const tarjeta = 'rounded-lg border bg-white p-4 shadow-sm';
  const titulo = 'mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500';
  const boton = 'flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-marca-dorado-prof">Hoy</p>
          <h1 className="font-bold text-gray-900">{mayuscula(diaLargo(hoy))}</h1>
          {esDuena && <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600"><Wallet size={14} /> Cobrado hoy: <strong className="text-gray-900">{formatCurrency(cobrado)}</strong></p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.dispatchEvent(new Event('cb-buscar'))} className={`${boton} border bg-white text-gray-700 hover:bg-gray-50`}><Search size={16} /> Buscar</button>
          <button onClick={() => setNueva(true)} className={`${boton} bg-marca-negro text-white hover:bg-gray-800`}><Plus size={16} /> Nueva cita</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-5">
          {porValorar.length > 0 && (
            <section className={`${tarjeta} border-red-200 bg-red-50/40`}>
              <p className={titulo}><span className="text-red-700">Solicitudes por valorar · {porValorar.length}</span></p>
              <div className="divide-y">
                {porValorar.map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium text-gray-900">{nombre(c.clienteId)}</p>
                      <p className="text-gray-600">{servicio(c.servicioId)} · {new Date(`${c.fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} {c.hora}</p>
                    </div>
                    <button onClick={() => setValorando(c.id)} className={`${boton} bg-marca-negro text-white`}><Check size={14} /> Valorar</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={tarjeta}>
            <p className={titulo}><span>Citas de hoy · {deHoy.length}</span></p>
            {!deHoy.length && <p className="py-2 text-sm text-gray-500">Hoy no hay citas.</p>}
            <div className="divide-y">
              {deHoy.map(c => {
                const yaPaso = c.hora < ahora, abierta = c.estado === 'pendiente' || c.estado === 'confirmada';
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                    <span className="w-12 shrink-0 font-display text-xl text-gray-900">{c.hora}</span>
                    <div className="min-w-[9rem] flex-1 text-sm">
                      <p className="truncate font-medium text-gray-900">{nombre(c.clienteId)}</p>
                      <p className="truncate text-gray-600">{servicio(c.servicioId)}{c.estado === 'pendiente' ? ' · por confirmar' : ''}</p>
                    </div>
                    <div className="ml-auto flex flex-wrap justify-end gap-2">
                      {abierta && yaPaso && (
                        <button onClick={() => confirm(`¿${nombre(c.clienteId)} no llegó?${c.anticipoConfirmado && c.montoAnticipo ? ` El anticipo de ${formatCurrency(c.montoAnticipo)} se queda como anticipo perdido.` : ''}`) && marcarNoLlego(c)}
                          className={`${boton} border bg-white text-gray-600`}><UserX size={14} /> No llegó</button>
                      )}
                      {abierta && <button onClick={() => changeEstadoCita(c.id, 'iniciada')} className={`${boton} bg-marca-negro text-white`}><Play size={14} /> Iniciar</button>}
                      {c.estado === 'iniciada' && (
                        <button onClick={() => setCobrando({ cita: c, completo: false })} className={`${boton} bg-green-700 text-white`}>
                          Cobrar {formatCurrency(cobroExpres(c, servicios).aCobrar)}
                        </button>
                      )}
                      {c.estado === 'completada' && <span className="text-sm text-green-700">Cobrada {formatCurrency(c.precioFinal || 0)}{c.metodoPago ? ` · ${c.metodoPago}` : ''}</span>}
                      {c.estado === 'no_llego' && <span className="text-sm text-gray-500">No llegó</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          {anticipos.length > 0 && (
            <section className={tarjeta}>
              <p className={titulo}><span>Anticipos por recibir · {anticipos.length}</span></p>
              <div className="divide-y">
                {anticipos.map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium text-gray-900">{nombre(c.clienteId)} · {formatCurrency(c.montoAnticipo || 0)}</p>
                      <p className="text-gray-600">{servicio(c.servicioId)} · {new Date(`${c.fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} {c.hora}</p>
                    </div>
                    <button onClick={() => anticipoRecibido(c)} title="Marca el anticipo recibido y confirma la cita" className={`${boton} bg-green-700 text-white`}><Check size={14} /> Recibido</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={tarjeta}>
            <p className={titulo}><span>Mañana · {deManana.length}</span><span className="normal-case tracking-normal">recordar por WhatsApp</span></p>
            {!deManana.length && <p className="py-2 text-sm text-gray-500">Mañana no hay citas.</p>}
            <div className="divide-y">
              {deManana.map(c => {
                const wa = recordatorio(c);
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-12 shrink-0 text-sm text-gray-700">{c.hora}</span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium text-gray-900">{nombre(c.clienteId)}</p>
                      <p className="truncate text-gray-600">{servicio(c.servicioId)}</p>
                    </div>
                    {c.recordatorio
                      ? <span className="flex items-center gap-1 text-xs text-green-700"><Check size={13} /> Recordada</span>
                      : wa && <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => db.citas.update(c.id, { recordatorio: new Date().toISOString() })}
                          className={`${boton} border bg-white text-green-700`}><MessageCircle size={14} /> Recordar</a>}
                  </div>
                );
              })}
            </div>
          </section>

          {cumpleaneras.length > 0 && (
            <section className={`${tarjeta} border-marca-dorado/40 bg-marca-marfil`}>
              <p className={titulo}><span className="flex items-center gap-1.5"><Cake size={14} /> Cumplen años hoy</span></p>
              <div className="divide-y">
                {cumpleaneras.map(c => {
                  const wa = enlaceWhatsApp(c.telefono, `¡Feliz cumpleaños, ${c.nombre.split(' ')[0]}! Todo el equipo de ${DATOS_SALON.nombreCorto} te desea un día precioso. 🤍`);
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="font-medium text-gray-900">{c.nombre}</span>
                      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={`${boton} border bg-white text-green-700`}><MessageCircle size={14} /> Felicitar</a>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {nueva && <CitaExpres onClose={() => setNueva(false)} />}
      {valorando && <ValorarSolicitud citaId={valorando} onClose={() => setValorando(null)} />}
      {cobrando && !cobrando.completo && (
        <CobroExpres cita={cobrando.cita} servicios={servicios} cliente={nombre(cobrando.cita.clienteId)} onCompletar={completarCita}
          onMas={() => setCobrando({ ...cobrando, completo: true })} onClose={() => setCobrando(null)} />
      )}
      {cobrando?.completo && <CobroModal cita={cobrando.cita} servicios={servicios} onCompletar={completarCita} onClose={() => setCobrando(null)} />}
    </div>
  );
}
