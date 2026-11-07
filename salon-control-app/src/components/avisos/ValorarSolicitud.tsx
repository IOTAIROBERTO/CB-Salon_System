import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Check, MessageCircle, X } from 'lucide-react';
import { db, type Cita } from '../../db/db';
import { enlaceWhatsApp } from '../../utils/lealtad';
import { formatCurrency } from '../../utils/financialUtils';
import { enlaceMiCita, urlMiCita, useFaltas } from '../../db/miCita';
import { useAgenda, nombrePersona } from '../../hooks/useAgenda';
import { porAsignar, resumenPreferencias, sugerirHorarios } from '../../utils/agenda';
import HorariosLibres, { AvisosAgenda } from '../citas/HorariosLibres';
import { confirmar } from '../Confirmar';

// Atender una solicitud de la app (proceso estándar): Cristina ve cómo trae el cabello la clienta y sus fotos, le pone la
// hora (con sugerencias y su porqué, o la que ella decida), fija el precio y el anticipo con su forma de pago y manda el
// WhatsApp ya escrito. La hora queda apartada un plazo; la clienta la acepta en «Mi cita» o se libera sola.
type Forma = NonNullable<Cita['formaAnticipo']>;
const FORMAS: Record<Forma, string> = {
  transferencia: 'Transferencia', deposito: 'Depósito (banco u OXXO)', salon: 'En el salón, el día de la cita',
  incluido: 'Incluido en el pago total', sin: 'Sin anticipo'
};

const fechaLarga = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

export default function ValorarSolicitud({ citaId, onClose }: { citaId: string; onClose: () => void }) {
  const cita = useLiveQuery(() => db.citas.get(citaId), [citaId]);
  const cliente = useLiveQuery(() => (cita ? db.clientes.get(cita.clienteId) : undefined), [cita?.clienteId]);
  const servicio = useLiveQuery(() => (cita ? db.servicios.get(cita.servicioId) : undefined), [cita?.servicioId]);
  const fotos = useLiveQuery(() => db.fotos.where('citaId').equals(citaId).sortBy('orden'), [citaId]) || [];
  const datosPago = useLiveQuery(() => db.configuracion.get('settings').then(s => s?.datosPago || ''));

  const [precio, setPrecio] = useState(0);
  const [anticipo, setAnticipo] = useState(0);
  const [forma, setForma] = useState<Forma>('transferencia');
  const [recibido, setRecibido] = useState(false);
  const [resumen, setResumen] = useState('');   // «Lo que haremos»: lo ve y lo acepta la clienta en «Mi cita»
  const [mensaje, setMensaje] = useState('');
  const [editado, setEditado] = useState(false);
  const faltas = useFaltas(cita?.clienteId);
  const { config, personas } = useAgenda();
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  const [elegida, setElegida] = useState<{ fecha: string; hora: string; atiendeId: string } | null>(null);
  const [otraFecha, setOtraFecha] = useState('');
  const preferencias = cita?.preferencias?.length ? cita.preferencias : cita ? [{ fecha: cita.fecha, franja: 'cualquiera' as const }] : [];
  const fechasPedidas = preferencias.map(p => p.fecha).join();
  const citasDeEsosDias = useLiveQuery(() => db.citas.where('fecha').anyOf(fechasPedidas ? fechasPedidas.split(',') : []).toArray(), [fechasPedidas]) || [];
  const faltaHora = !!cita && porAsignar(cita);
  const sugerencias = useMemo(() => faltaHora && cita ? sugerirHorarios({ preferencias, servicioId: cita.servicioId, adicionales: (cita.serviciosAdicionales || []).map(a => a.servicioId),
    personas, citas: citasDeEsosDias, servicios: servicios as any, config, ignorarCitaId: cita.id }) : [], [faltaHora, cita, citasDeEsosDias, servicios, config, personas]);
  const iguales = (x: { fecha: string; hora: string; personaId?: string }) => elegida?.fecha === x.fecha && elegida.hora === x.hora && elegida.atiendeId === x.personaId;
  // Su enlace «Mi cita» va en el mensaje: ahí ve precio, anticipo y datos de pago, y la cambia o cancela sola
  useEffect(() => { if (cita && !cita.enlace) enlaceMiCita(cita); }, [cita?.id, cita?.enlace]);

  useEffect(() => {   // valores iniciales: lo ya acordado o lo del catálogo
    if (!cita || !servicio) return;
    setPrecio(cita.precioAcordado ?? servicio.precioSugerido);
    setAnticipo(cita.montoAnticipo ?? servicio.anticipoSugerido ?? 0);
    setForma(cita.formaAnticipo ?? ((cita.montoAnticipo ?? servicio.anticipoSugerido) ? 'transferencia' : 'sin'));
    setRecibido(!!cita.anticipoConfirmado);
    setResumen(cita.resumenClienta ?? '');
  }, [cita?.id, servicio?.id]);

  const sugerido = useMemo(() => {
    if (!cita || !servicio) return '';
    const nombre = (cliente?.nombre || '').split(' ')[0];
    const dia = elegida?.fecha || cita.fecha, hora = elegida?.hora || cita.hora;
    const base = `¡Hola, ${nombre}! Ya revisamos tu solicitud de ${servicio.nombre}. Te proponemos el ${hora ? `${fechaLarga(dia)} a las ${hora}` : '(elige la hora)'}. El precio de tu servicio es ${formatCurrency(precio)}.`;
    const plazo = cita.estado === 'solicitud' ? `Te guardamos este horario ${config.plazoPropuestaHoras ?? 24} horas. ` : '';
    const miCita = cita.enlace ? `\n\n${plazo}Revisa el resumen y acéptalo aquí (ahí también la cambias o cancelas tú misma): ${urlMiCita(cita.id, cita.enlace)}` : '';
    if (forma === 'transferencia' || forma === 'deposito')
      return `${base}\n\nPara confirmar tu cita, el anticipo es de ${formatCurrency(anticipo)} por ${forma === 'deposito' ? 'depósito' : 'transferencia'}:\n${datosPago || '(faltan los datos para el anticipo en Configuración → General)'}\n\nMándanos tu comprobante por aquí y tu cita queda confirmada. Cambios o cancelaciones con al menos 48 horas.${miCita}`;
    if (forma === 'salon') return `${base}\n\nTu cita queda confirmada. El anticipo de ${formatCurrency(anticipo)} lo pagas en el salón el día de tu cita. Cambios o cancelaciones con al menos 48 horas.${miCita}`;
    return `${base}\n\nTu cita queda confirmada; el pago lo haces completo el día de tu cita. Cambios o cancelaciones con al menos 48 horas.${miCita}`;
  }, [cita, servicio, cliente, precio, anticipo, forma, datosPago, elegida, config.plazoPropuestaHoras]);
  useEffect(() => { if (!editado) setMensaje(sugerido); }, [sugerido, editado]);

  if (!cita) return null;
  const pideAnticipo = forma === 'transferencia' || forma === 'deposito';
  const montoFinal = forma === 'incluido' || forma === 'sin' ? 0 : anticipo;
  // Si cambia lo que la clienta ya aceptó (precio, anticipo o resumen), tiene que volver a aceptarlo
  const cambioLoAceptado = !!cita.aceptacion && (cita.aceptacion.precio !== precio || cita.aceptacion.anticipo !== montoFinal || cita.aceptacion.resumen !== resumen.trim());
  const sinElegir = faltaHora && !elegida;
  // Solicitud nueva: la hora queda apartada un plazo para que la acepte. Clienta que pidió cambiar la suya: se mueve de una
  // vez, porque ella lo pidió (sigue como estaba) y sus avisos de WhatsApp salen de nuevo con la fecha nueva.
  const conHora = (): Partial<Cita> => {
    if (!elegida) return {};
    const lugar = { fecha: elegida.fecha, hora: elegida.hora, atiendeId: elegida.atiendeId, cambioPedido: undefined, recordatorio: undefined, avisoConfirmacion: undefined };
    if (cita.estado !== 'solicitud') return lugar;
    const plazo = Date.now() + (config.plazoPropuestaHoras ?? 24) * 3600000;
    return { ...lugar, estado: 'pendiente', propuestaVencida: undefined,
      propuestaVence: new Date(Math.min(plazo, new Date(`${elegida.fecha}T${elegida.hora}:00`).getTime())).toISOString() };
  };
  const guardar = (extra: Partial<Cita> = {}) => db.citas.update(citaId, {
    precioAcordado: precio, montoAnticipo: montoFinal, formaAnticipo: forma, resumenClienta: resumen.trim() || undefined,
    anticipoConfirmado: pideAnticipo ? recibido : cita.anticipoConfirmado, ...(cambioLoAceptado ? { aceptadaEn: undefined } : {}), ...conHora(), ...extra
  });
  const rechazar = async () => {
    if (!await confirmar(`¿Cancelar la solicitud de ${cliente?.nombre || 'esta clienta'}? Si apartó productos, vuelven a la venta. Avísale por WhatsApp.`)) return;
    await db.citas.update(citaId, { estado: 'cancelada', canceladaPor: 'salon', canceladaEn: new Date().toISOString() });
    const porPagar = await db.pedidos.where('citaId').equals(citaId).filter(p => p.estado === 'por_pagar').toArray();
    await Promise.all(porPagar.map(p => db.pedidos.update(p.id, { estado: 'cancelado', motivo: 'Se canceló su solicitud' })));
    onClose();
  };
  const whatsapp = enlaceWhatsApp(cliente?.telefono, mensaje);
  const v = cita.valoracion;
  const ver = (src: string) => { const w = window.open('', '_blank'); if (!w || !src.startsWith('data:image/')) return; const img = w.document.createElement('img'); img.src = src; img.style.maxWidth = '100%'; w.document.body.appendChild(img); };

  return (
    <div className="tocable fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-2 text-gray-900 sm:p-4" onClick={onClose}>
      <div className="max-h-[96dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-marca-dorado-prof">{faltaHora ? 'Asignar hora' : 'Valorar solicitud'}</p>
            <h3 className="text-xl text-gray-900">{cliente?.nombre || 'Clienta'}</h3>
            <p className="text-sm text-gray-600">{servicio?.nombre}{cita.hora ? ` · ${fechaLarga(cita.fecha)} ${cita.hora}` : ''}{servicio?.duracion ? ` · ${servicio.duracion} min` : ''}</p>
            {cita.propuestaVence && !cita.aceptadaEn && <p className="mt-1 text-sm text-gray-600">Se libera {new Date(cita.propuestaVence).toLocaleString('es-MX', { weekday: 'long', hour: 'numeric', minute: '2-digit' })} si no la acepta.</p>}
            {faltas > 0 && <p className="mt-1 text-sm font-medium text-red-700">No llegó a {faltas} {faltas === 1 ? 'cita' : 'citas'}: conviene pedirle anticipo.</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
          <p className="font-medium text-gray-900">Cómo trae su cabello</p>
          {v ? <>
            {v.largo && <p>Largo: {v.largo}</p>}
            {v.color && <p>Color actual: {v.color}</p>}
            {v.quimicos !== undefined && <p>Alaciado, keratina o permanente en 6 meses: {v.quimicos ? 'sí' : 'no'}</p>}
            {v.busca && <p>Busca: «{v.busca}»</p>}
          </> : <p className="text-gray-500">No contestó las preguntas.</p>}
          {cita.notas && <p>Notas: «{cita.notas}»</p>}
          {fotos.length > 0
            ? <div className="flex gap-2 pt-1">{fotos.map(f => <button key={f.id} onClick={() => ver(f.imagen)}><img src={f.imagen} alt="Foto del cabello" className="h-20 w-20 rounded object-cover" /></button>)}</div>
            : <p className="text-gray-500">Sin fotos: pídeselas por WhatsApp si las necesitas.</p>}
        </div>

        {faltaHora && (
          <div className="space-y-2 rounded-lg border border-marca-dorado/40 p-3 text-sm">
            <p className="font-medium text-gray-900">{cita.cambioPedido ? 'Pide cambiarla a' : 'Le acomoda'}: <span className="font-normal text-gray-700">{resumenPreferencias(preferencias)}</span></p>
            {sugerencias.length === 0 && <p className="text-gray-500">No hay hora libre esos días. Busca otra fecha abajo o escríbele.</p>}
            {sugerencias.map(s => (
              <button key={`${s.fecha}${s.hora}${s.personaId}`} type="button" onClick={() => { setElegida({ fecha: s.fecha, hora: s.hora, atiendeId: s.personaId }); setOtraFecha(''); }}
                className={`block w-full rounded-lg border p-2.5 text-left ${iguales(s) ? 'border-marca-negro bg-marca-negro text-white' : 'border-gray-300 bg-white hover:border-marca-dorado'}`}>
                <span className="block font-medium">{fechaLarga(s.fecha)} · {s.hora}{personas.length > 1 ? ` · ${nombrePersona(personas, s.personaId)}` : ''}</span>
                {s.motivos.length > 0 && <span className={`block text-xs ${iguales(s) ? 'text-white/80' : 'text-green-800'}`}>{s.motivos.join(' · ')}</span>}
                {s.avisos.length > 0 && <span className={`flex items-center gap-1 text-xs ${iguales(s) ? 'text-white/80' : 'text-amber-700'}`}><AlertTriangle size={12} className="shrink-0" /> {s.avisos.join(' · ')}</span>}
              </button>
            ))}
            <label className="block pt-1">Otra fecha
              <input type="date" value={otraFecha} onChange={e => { setOtraFecha(e.target.value); setElegida(null); }} className="mt-1 w-full rounded border p-2" />
            </label>
            {otraFecha && <HorariosLibres fecha={otraFecha} servicioId={cita.servicioId} ignorarCitaId={cita.id} horaElegida={elegida?.hora} atiendeId={elegida?.atiendeId}
              onElegir={(hora, atiendeId) => setElegida({ fecha: otraFecha, hora, atiendeId })} />}
            {elegida && <AvisosAgenda cita={{ id: cita.id, fecha: elegida.fecha, hora: elegida.hora, servicioId: cita.servicioId, atiendeId: elegida.atiendeId }} />}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="block">Precio acordado
            <input type="number" min={0} value={precio} onChange={e => setPrecio(Number(e.target.value))} className="mt-1 w-full rounded border p-2" />
            <span className="text-xs text-gray-500">Catálogo: desde {formatCurrency(servicio?.precioSugerido || 0)}</span>
          </label>
          <label className="block">Anticipo
            <input type="number" min={0} value={anticipo} disabled={forma === 'incluido' || forma === 'sin'} onChange={e => setAnticipo(Number(e.target.value))} className="mt-1 w-full rounded border p-2 disabled:bg-gray-100" />
          </label>
          <label className="col-span-2 block">Forma del anticipo
            <select value={forma} onChange={e => setForma(e.target.value as Forma)} className="mt-1 w-full rounded border p-2">
              {(Object.keys(FORMAS) as Forma[]).map(k => <option key={k} value={k}>{FORMAS[k]}</option>)}
            </select>
          </label>
          {pideAnticipo && (
            <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={recibido} onChange={e => setRecibido(e.target.checked)} /> Ya recibimos el anticipo</label>
          )}
        </div>

        <label className="block text-sm">Lo que haremos <span className="text-xs text-gray-500">(lo ve y lo acepta la clienta en su enlace)</span>
          <textarea value={resumen} onChange={e => setResumen(e.target.value)} rows={2} placeholder="Ej.: retoque de raíz con matiz frío y corte de puntas" className="mt-1 w-full rounded border p-2 text-sm" />
          {cita.aceptadaEn && !cambioLoAceptado && <span className="text-xs text-green-700">La clienta ya aceptó este resumen.</span>}
          {cambioLoAceptado && <span className="text-xs text-amber-700">Cambió lo que aceptó: tendrá que volver a aceptarlo.</span>}
        </label>

        <label className="block text-sm">Mensaje para la clienta
          <textarea value={mensaje} onChange={e => { setMensaje(e.target.value); setEditado(true); }} rows={8} className="mt-1 w-full rounded border p-2 text-sm" />
          {editado && <button type="button" onClick={() => setEditado(false)} className="text-xs text-marca-dorado-prof hover:underline">Volver al mensaje sugerido</button>}
        </label>

        <div className="flex flex-wrap gap-2">
          {sinElegir
            ? <span className="flex min-h-[40px] items-center rounded-md bg-green-600/40 px-3 py-2 text-sm text-white">Elige la hora para mandar el WhatsApp</span>
            : whatsapp
            ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => { guardar(); setElegida(null); }} className="flex min-h-[40px] items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"><MessageCircle size={15} /> Guardar y mandar WhatsApp</a>
            : <span className="text-xs text-amber-700">La clienta no tiene teléfono de 10 dígitos.</span>}
          <button onClick={async () => { await guardar({ estado: 'confirmada', propuestaVence: undefined }); onClose(); }}
            disabled={sinElegir || (pideAnticipo && !recibido)}
            title={sinElegir ? 'Primero elige la hora' : pideAnticipo && !recibido ? 'Primero marca que ya recibiste el anticipo' : undefined}
            className="flex items-center gap-1 rounded-md bg-marca-negro px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-40"><Check size={15} /> Confirmar cita</button>
          <button onClick={async () => { await guardar(); onClose(); }} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Guardar sin confirmar</button>
        </div>
        {cita.estado === 'solicitud'
          ? <button onClick={rechazar} className="min-h-[40px] text-sm text-red-700 hover:underline">Cancelar esta solicitud</button>
          : <p className="text-[11px] text-gray-400">Para cambiarla de hora o cancelarla, ábrela en Citas.</p>}
      </div>
    </div>
  );
}
