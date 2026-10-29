import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, MessageCircle, X } from 'lucide-react';
import { db } from '../../db/db';
import useCitas from '../../hooks/useCitas';
import HorariosLibres, { AvisosAgenda } from '../citas/HorariosLibres';
import { enlaceMiCita } from '../../db/miCita';
import { notaReserva } from '../../utils/reserva';
import { enlaceWhatsApp } from '../../utils/lealtad';
import { SALON } from '../../utils/zonas';
import { generateClienteId } from '../../utils/clientesUtils';
import { fechaLocalISO, validarFechaHora } from '../../utils/dateValidation';

// Nueva cita en pocos toques: clienta (buscar o nueva), su servicio de siempre, día y primer horario libre. Guarda lo
// mismo que «Nueva cita» (CitaModal); lo demás (quién apoya, lugar fuera del salón, notas) está en «Más opciones».
const norma = (t = '') => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const tel10 = (t = '') => t.replace(/\D/g, '').slice(-10);
const masDias = (n: number) => fechaLocalISO(new Date(Date.now() + n * 86400000));

export default function CitaExpres({ onClose, clienteInicial }: { onClose: () => void; clienteInicial?: string }) {
  const navigate = useNavigate();
  const { citas, servicios, saveCita } = useCitas();
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const [busca, setBusca] = useState('');
  const [clienteId, setClienteId] = useState(clienteInicial || '');
  const [nueva, setNueva] = useState<{ nombre: string; telefono: string } | null>(null);
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState(fechaLocalISO());
  const [hora, setHora] = useState('');
  const [atiendeId, setAtiendeId] = useState('cristina');
  const [confirmada, setConfirmada] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState<{ whatsapp: string | null } | null>(null);

  const clienta = clientes.find(c => c.id === clienteId);
  const activos = servicios.filter(s => !s.archivado);
  // Sus últimos servicios primero: casi siempre repite
  const recientes = useMemo(() => [...new Set(citas.filter(c => c.clienteId === clienteId).sort((a, b) => b.fecha.localeCompare(a.fecha)).map(c => c.servicioId))]
    .map(id => activos.find(s => s.id === id)).filter(Boolean).slice(0, 3) as typeof activos, [citas, clienteId, activos]);
  useEffect(() => { if (clienteId && !servicioId && recientes[0]) setServicioId(recientes[0].id); }, [clienteId, servicioId, recientes]);

  const q = norma(busca), digitos = busca.replace(/\D/g, '');
  const encontradas = q.length < 2 ? [] : clientes.filter(c => c.activo !== false && (digitos.length >= 3 ? tel10(c.telefono).includes(digitos) : norma(c.nombre).includes(q))).slice(0, 6);
  const elegirClienta = (id: string) => { setClienteId(id); setNueva(null); setServicioId(''); };
  const empezarNueva = () => setNueva(digitos.length >= 7 ? { nombre: '', telefono: digitos } : { nombre: busca.trim(), telefono: '' });

  const guardar = async () => {
    const v = validarFechaHora(fecha, hora);
    if (!v.valido) return setError(v.mensaje || 'Fecha u hora inválida');
    setGuardando(true); setError('');
    try {
      let id = clienteId, nombre = clienta?.nombre || '', telefono = clienta?.telefono || '';
      if (!id && nueva) {
        const t = tel10(nueva.telefono);
        if (nueva.nombre.trim().length < 3 || t.length !== 10) throw new Error('Escribe nombre completo y teléfono de 10 dígitos');
        const existente = clientes.find(c => tel10(c.telefono) === t);   // el teléfono ya tiene ficha: se usa esa
        if (existente) ({ id, nombre, telefono } = existente);
        else {
          id = generateClienteId(); nombre = nueva.nombre.trim().replace(/\s+/g, ' '); telefono = t;
          await db.clientes.add({ id, nombre, telefono, activo: true, fechaRegistro: fechaLocalISO() } as any);
        }
      }
      const citaId = await saveCita({ clienteId: id, servicioId, empleadoIds: [], fecha, hora, notas: '', descripcionTrabajo: '', ubicacion: SALON, atiendeId,
        estado: confirmada ? 'confirmada' : 'pendiente' });
      const s = servicios.find(x => x.id === servicioId);
      const nota = notaReserva({ nombre, servicio: s?.nombre || '', fecha, hora, precio: s?.precioSugerido, miCita: await enlaceMiCita({ id: citaId }) });
      setListo({ whatsapp: enlaceWhatsApp(telefono, nota) });
    } catch (e) { setError((e as Error).message); } finally { setGuardando(false); }
  };

  const chip = (activo: boolean) => `min-h-[40px] rounded-full border px-3 text-sm ${activo ? 'border-marca-negro bg-marca-negro text-white' : 'border-gray-300 bg-white text-gray-700'}`;
  const diaCorto = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="tocable fixed inset-0 z-[70] flex items-end justify-center bg-black/50 text-gray-900 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-marca-dorado-prof">Nueva cita</p>
            <h3 className="text-xl text-gray-900">{listo ? 'Cita agendada' : clienta?.nombre || (nueva ? 'Clienta nueva' : '¿Para quién?')}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {listo ? (
          <div className="space-y-3 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-marca-negro text-marca-dorado"><Check size={22} /></span>
            <p className="text-sm text-gray-600">{diaCorto(fecha)} a las {hora}. Ya está en la agenda y en Google Calendar en menos de un minuto.</p>
            {listo.whatsapp
              ? <a href={listo.whatsapp} target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm text-white hover:bg-green-700"><MessageCircle size={16} /> Mandar nota por WhatsApp</a>
              : <p className="text-xs text-amber-700">La clienta no tiene teléfono de 10 dígitos para mandarle la nota.</p>}
            <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:underline">Listo</button>
          </div>
        ) : (<>
          {/* Clienta */}
          {clienteId || nueva ? (
            nueva && !clienteId ? (
              <div className="grid grid-cols-2 gap-2">
                <input autoFocus className="rounded-lg border p-2 text-sm" placeholder="Nombre completo" value={nueva.nombre} onChange={e => setNueva({ ...nueva, nombre: e.target.value })} />
                <input className="rounded-lg border p-2 text-sm" type="tel" inputMode="tel" placeholder="Teléfono" value={nueva.telefono} onChange={e => setNueva({ ...nueva, telefono: e.target.value })} />
                <button onClick={() => setNueva(null)} className="col-span-2 text-left text-xs text-marca-dorado-prof hover:underline">Buscar una clienta registrada</button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{clienta?.nombre} · {clienta?.telefono}</span>
                <button onClick={() => { setClienteId(''); setServicioId(''); }} className="shrink-0 px-2 text-xs text-marca-dorado-prof hover:underline">Cambiar</button>
              </div>
            )
          ) : (
            <div>
              <input autoFocus className="w-full rounded-lg border p-2.5 text-sm" placeholder="Nombre o teléfono de la clienta" value={busca} onChange={e => setBusca(e.target.value)} />
              <div className="mt-1 divide-y">
                {encontradas.map(c => (
                  <button key={c.id} onClick={() => elegirClienta(c.id)} className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm hover:bg-gray-50">
                    <span className="truncate">{c.nombre}</span><span className="shrink-0 text-xs text-gray-500">{c.telefono}</span>
                  </button>
                ))}
                {q.length >= 3 && <button onClick={empezarNueva} className="w-full py-2.5 text-left text-sm text-marca-dorado-prof">+ Clienta nueva{digitos.length < 7 ? `: ${busca.trim()}` : ''}</button>}
              </div>
            </div>
          )}

          {/* Servicio */}
          {(clienteId || nueva) && (<>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Servicio</p>
              {recientes.length > 0 && <div className="flex flex-wrap gap-2">{recientes.map(s => <button key={s.id} onClick={() => { setServicioId(s.id); setHora(''); }} className={chip(servicioId === s.id)}>{s.nombre}</button>)}</div>}
              <select value={servicioId} onChange={e => { setServicioId(e.target.value); setHora(''); }} className="w-full rounded-lg border p-2 text-sm">
                <option value="">{recientes.length ? 'Otro servicio…' : 'Elige el servicio'}</option>
                {activos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Día</p>
              <div className="flex flex-wrap items-center gap-2">
                {[['Hoy', masDias(0)], ['Mañana', masDias(1)], ['Pasado', masDias(2)]].map(([t, f]) => (
                  <button key={f} onClick={() => { setFecha(f); setHora(''); }} className={chip(fecha === f)}>{t}</button>
                ))}
                <input type="date" value={fecha} min={masDias(0)} onChange={e => { setFecha(e.target.value); setHora(''); }} className="min-w-0 flex-1 rounded-lg border p-2 text-sm" />
              </div>
            </div>

            {servicioId && (
              <div className="space-y-2">
                <HorariosLibres fecha={fecha} servicioId={servicioId} horaElegida={hora} onElegir={(h, p) => { setHora(h); setAtiendeId(p); }} />
                <label className="flex items-center gap-2 text-xs text-gray-500">Otra hora <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="rounded border p-1.5 text-sm" /></label>
                <AvisosAgenda cita={{ fecha, hora, servicioId, atiendeId }} />
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setConfirmada(true)} className={chip(confirmada)}>Confirmada</button>
              <button onClick={() => setConfirmada(false)} className={chip(!confirmada)}>Por confirmar</button>
            </div>

            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button disabled={!servicioId || !hora || guardando} onClick={guardar}
              className="min-h-[48px] w-full rounded-lg bg-marca-negro text-sm text-white hover:bg-gray-800 disabled:opacity-40">
              {guardando ? 'Guardando…' : hora ? `Agendar ${diaCorto(fecha)} a las ${hora}` : 'Elige la hora'}
            </button>
          </>)}
          <button onClick={() => { onClose(); navigate('/citas?nueva=1'); }} className="w-full py-1 text-xs text-gray-500 hover:underline">
            Más opciones: quién apoya, servicio fuera del salón, notas
          </button>
        </>)}
      </div>
    </div>
  );
}
