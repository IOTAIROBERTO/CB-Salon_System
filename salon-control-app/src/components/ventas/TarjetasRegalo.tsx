import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Gift } from 'lucide-react';
import { db } from '../../db/db';
import { venderTarjeta } from '../../db/saldo';
import { MONTOS_TARJETA, estadoTarjeta, venceActivacion } from '../../utils/saldo';
import { formatCurrency } from '../../utils/financialUtils';

const COLOR = { 'por activar': 'text-amber-700', activada: 'text-green-700', vencida: 'text-gray-400' } as const;

/** Tarjetas de regalo: registrar la venta (con su folio) y ver cuáles faltan por activar */
export default function TarjetasRegalo() {
  const tarjetas = useLiveQuery(() => db.tarjetasRegalo.orderBy('fechaVenta').reverse().toArray()) || [];
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const [f, setF] = useState({ folio: '', monto: MONTOS_TARJETA[1], compradora: '', metodoPago: 'efectivo' });
  const [abierto, setAbierto] = useState(false);

  const registrar = async () => {
    try {
      await venderTarjeta(f);
      setF({ ...f, folio: '', compradora: '' });
    } catch (e) { alert((e as Error).message); }
  };
  const porActivar = tarjetas.filter(t => estadoTarjeta(t) === 'por activar');

  return (
    <div className="bg-white rounded-lg shadow border p-4 mb-6">
      <button type="button" onClick={() => setAbierto(!abierto)} className="w-full flex justify-between items-center">
        <span className="font-semibold flex items-center gap-2"><Gift size={18} /> Tarjetas de regalo</span>
        <span className="text-sm text-gray-500">{porActivar.length} por activar · {formatCurrency(porActivar.reduce((s, t) => s + t.monto, 0))}</span>
      </button>
      {abierto && (
        <div className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-5 gap-2 text-sm">
            <input value={f.folio} onChange={e => setF({ ...f, folio: e.target.value })} placeholder="Folio impreso" className="border rounded px-2 py-1.5" />
            <select value={f.monto} onChange={e => setF({ ...f, monto: Number(e.target.value) })} className="border rounded px-2 py-1.5">
              {MONTOS_TARJETA.map(m => <option key={m} value={m}>{formatCurrency(m)}</option>)}
            </select>
            <input value={f.compradora} onChange={e => setF({ ...f, compradora: e.target.value })} placeholder="Quién la compra (opcional)" className="border rounded px-2 py-1.5" />
            <select value={f.metodoPago} onChange={e => setF({ ...f, metodoPago: e.target.value })} className="border rounded px-2 py-1.5">
              <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option>
            </select>
            <button type="button" onClick={registrar} className="rounded bg-gray-900 text-white px-3 py-1.5">Registrar venta</button>
          </div>
          <p className="text-xs text-gray-500">La venta cuenta como ingreso hoy. La clienta tiene 6 meses para activarla (en su ficha o, después, en la app); ya activada es saldo a favor que no vence.</p>
          {tarjetas.length > 0 && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="py-1">Folio</th><th>Monto</th><th>Vendida</th><th>Estado</th><th>Clienta</th></tr></thead>
              <tbody>
                {tarjetas.map(t => {
                  const estado = estadoTarjeta(t);
                  return (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-1 font-mono">{t.folio}</td>
                      <td>{formatCurrency(t.monto)}</td>
                      <td>{new Date(t.fechaVenta).toLocaleDateString('es-MX')}{t.compradora ? ` · ${t.compradora}` : ''}</td>
                      <td className={COLOR[estado]}>{estado}{estado === 'por activar' ? ` hasta ${venceActivacion(t.fechaVenta)}` : ''}</td>
                      <td>{clientes.find(c => c.id === t.activadaPor)?.nombre || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
