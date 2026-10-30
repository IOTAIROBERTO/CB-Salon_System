import { useState } from 'react';
import { X } from 'lucide-react';
import { type Cita, type Servicio } from '../../types/citas';
import { cobroExpres } from '../../utils/cobro';
import { formatCurrency } from '../../utils/financialUtils';

const METODOS = [['efectivo', 'Efectivo'], ['tarjeta', 'Tarjeta'], ['transferencia', 'Transferencia']] as const;

/** Cobro en un toque cuando nada cambió: precio acordado (o de catálogo) menos el anticipo recibido; tocar el método
 *  cobra. Adicionales, descuentos, Club, saldo a favor o propina: «Más opciones» abre el cobro completo. */
export default function CobroExpres({ cita, servicios, cliente, onCompletar, onMas, onClose }: {
  cita: Cita; servicios: Servicio[]; cliente: string;
  onCompletar: (citaId: string, precioFinal: number, metodoPago: string, notas: string, datos?: any[]) => Promise<void> | void;
  onMas: () => void; onClose: () => void;
}) {
  const [guardando, setGuardando] = useState(false);
  const c = cobroExpres(cita, servicios);
  const servicio = servicios.find(s => s.id === cita.servicioId);
  const cobrar = async (metodo: string) => {
    setGuardando(true);
    try { await onCompletar(cita.id, c.precioFinal, metodo, '', [c.datos]); onClose(); }
    finally { setGuardando(false); }
  };
  const renglon = 'flex justify-between text-sm text-gray-600';

  return (
    <div className="tocable fixed inset-0 z-[70] flex items-end justify-center bg-black/50 text-gray-900 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm space-y-4 rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-marca-dorado-prof">Cobrar</p>
            <h3 className="text-xl text-gray-900">{cliente}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="space-y-1.5 rounded-lg bg-gray-50 p-3">
          <div className={renglon}><span>{servicio?.nombre || 'Servicio'}{cita.precioAcordado != null ? ' (acordado)' : ''}</span><span>{formatCurrency(c.subtotal)}</span></div>
          {c.anticipo > 0 && <div className={renglon}><span>Anticipo recibido</span><span>−{formatCurrency(c.anticipo)}</span></div>}
          {c.redondeo > 0 && <div className={renglon}><span>Redondeo a decena</span><span>+{formatCurrency(c.redondeo)}</span></div>}
          <div className="flex items-baseline justify-between border-t pt-2">
            <span className="text-sm font-medium text-gray-700">A cobrar hoy</span>
            <span className="font-display text-3xl text-gray-900">{formatCurrency(c.aCobrar)}</span>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs text-gray-500">Toca cómo pagó y queda cobrada:</p>
          <div className="grid grid-cols-3 gap-2">
            {METODOS.map(([valor, texto]) => (
              <button key={valor} disabled={guardando} onClick={() => cobrar(valor)}
                className="min-h-[48px] rounded-lg bg-marca-negro px-2 text-sm text-white hover:bg-gray-800 disabled:opacity-40">{texto}</button>
            ))}
          </div>
        </div>
        <button onClick={onMas} className="w-full py-2 text-xs text-marca-dorado-prof hover:underline">
          Más opciones: otro servicio, adicionales, descuentos, Club, saldo a favor o propina
        </button>
      </div>
    </div>
  );
}
