import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, MessageCircle, X } from 'lucide-react';
import { db, type Cita } from '../../db/db';
import { enlaceWhatsApp } from '../../utils/lealtad';
import { formatCurrency } from '../../utils/financialUtils';

// Valorar una solicitud de la app (proceso estándar): Cristina ve cómo trae el cabello la clienta y sus fotos, fija
// el precio acordado y el anticipo con su forma de pago, y manda el WhatsApp ya escrito. La cita se confirma aquí.
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
  const [mensaje, setMensaje] = useState('');
  const [editado, setEditado] = useState(false);

  useEffect(() => {   // valores iniciales: lo ya acordado o lo del catálogo
    if (!cita || !servicio) return;
    setPrecio(cita.precioAcordado ?? servicio.precioSugerido);
    setAnticipo(cita.montoAnticipo ?? servicio.anticipoSugerido ?? 0);
    setForma(cita.formaAnticipo ?? ((cita.montoAnticipo ?? servicio.anticipoSugerido) ? 'transferencia' : 'sin'));
    setRecibido(!!cita.anticipoConfirmado);
  }, [cita?.id, servicio?.id]);

  const sugerido = useMemo(() => {
    if (!cita || !servicio) return '';
    const nombre = (cliente?.nombre || '').split(' ')[0];
    const base = `¡Hola, ${nombre}! Ya revisamos tu solicitud de ${servicio.nombre} para el ${fechaLarga(cita.fecha)} a las ${cita.hora}. El precio de tu servicio es ${formatCurrency(precio)}.`;
    if (forma === 'transferencia' || forma === 'deposito')
      return `${base}\n\nPara confirmar tu cita, el anticipo es de ${formatCurrency(anticipo)} por ${forma === 'deposito' ? 'depósito' : 'transferencia'}:\n${datosPago || '(faltan los datos para el anticipo en Configuración → General)'}\n\nMándanos tu comprobante por aquí y tu cita queda confirmada. Cambios o cancelaciones con al menos 48 horas.`;
    if (forma === 'salon') return `${base}\n\nTu cita queda confirmada. El anticipo de ${formatCurrency(anticipo)} lo pagas en el salón el día de tu cita. Cambios o cancelaciones con al menos 48 horas.`;
    return `${base}\n\nTu cita queda confirmada; el pago lo haces completo el día de tu cita. Cambios o cancelaciones con al menos 48 horas.`;
  }, [cita, servicio, cliente, precio, anticipo, forma, datosPago]);
  useEffect(() => { if (!editado) setMensaje(sugerido); }, [sugerido, editado]);

  if (!cita) return null;
  const pideAnticipo = forma === 'transferencia' || forma === 'deposito';
  const guardar = (extra: Partial<Cita> = {}) => db.citas.update(citaId, {
    precioAcordado: precio, montoAnticipo: forma === 'incluido' || forma === 'sin' ? 0 : anticipo, formaAnticipo: forma,
    anticipoConfirmado: pideAnticipo ? recibido : cita.anticipoConfirmado, ...extra
  });
  const whatsapp = enlaceWhatsApp(cliente?.telefono, mensaje);
  const v = cita.valoracion;
  const ver = (src: string) => { const w = window.open('', '_blank'); if (!w || !src.startsWith('data:image/')) return; const img = w.document.createElement('img'); img.src = src; img.style.maxWidth = '100%'; w.document.body.appendChild(img); };

  return (
    <div className="tocable fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-2 text-gray-900 sm:p-4" onClick={onClose}>
      <div className="max-h-[96dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-marca-dorado-prof">Valorar solicitud</p>
            <h3 className="text-xl text-gray-900">{cliente?.nombre || 'Clienta'}</h3>
            <p className="text-sm text-gray-600">{servicio?.nombre} · {fechaLarga(cita.fecha)} {cita.hora}</p>
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

        <label className="block text-sm">Mensaje para la clienta
          <textarea value={mensaje} onChange={e => { setMensaje(e.target.value); setEditado(true); }} rows={8} className="mt-1 w-full rounded border p-2 text-sm" />
          {editado && <button type="button" onClick={() => setEditado(false)} className="text-xs text-marca-dorado-prof hover:underline">Volver al mensaje sugerido</button>}
        </label>

        <div className="flex flex-wrap gap-2">
          {whatsapp
            ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => guardar()} className="flex min-h-[40px] items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"><MessageCircle size={15} /> Guardar y mandar WhatsApp</a>
            : <span className="text-xs text-amber-700">La clienta no tiene teléfono de 10 dígitos.</span>}
          <button onClick={async () => { await guardar({ estado: 'confirmada' }); onClose(); }}
            disabled={pideAnticipo && !recibido}
            title={pideAnticipo && !recibido ? 'Primero marca que ya recibiste el anticipo' : undefined}
            className="flex items-center gap-1 rounded-md bg-marca-negro px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-40"><Check size={15} /> Confirmar cita</button>
          <button onClick={async () => { await guardar(); onClose(); }} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Guardar sin confirmar</button>
        </div>
        <p className="text-[11px] text-gray-400">Para cambiarla de hora o cancelarla, ábrela en Citas.</p>
      </div>
    </div>
  );
}
