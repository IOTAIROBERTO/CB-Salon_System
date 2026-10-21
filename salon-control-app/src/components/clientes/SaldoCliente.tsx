import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Gift, Wallet } from 'lucide-react';
import { db } from '../../db/db';
import { useRolSalon } from '../../db/salon';
import { activarTarjeta, abonarSaldo } from '../../db/saldo';
import { saldoDe } from '../../utils/saldo';
import { formatCurrency } from '../../utils/financialUtils';

/** Saldo a favor de la clienta: activar tarjeta de regalo, abonos y movimientos */
export default function SaldoCliente({ clienteId }: { clienteId: string }) {
  const movimientos = useLiveQuery(() => db.movimientosSaldo.where('clienteId').equals(clienteId).reverse().sortBy('fecha'), [clienteId]) || [];
  const esDuena = useRolSalon() === 'duena';
  const [folio, setFolio] = useState('');
  const [abono, setAbono] = useState({ monto: '', concepto: '' });
  const saldo = saldoDe(movimientos, clienteId);

  const activar = async () => {
    try {
      const monto = await activarTarjeta(folio, clienteId);
      setFolio('');
      alert(`Tarjeta activada: ${formatCurrency(monto)} de saldo a favor.`);
    } catch (e) { alert((e as Error).message); }
  };
  const abonar = async () => {
    const monto = Number(abono.monto);
    if (!(monto > 0)) return alert('Escribe el monto');
    await abonarSaldo(clienteId, monto, abono.concepto || 'Abono');
    setAbono({ monto: '', concepto: '' });
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-2"><Wallet size={16} /> Saldo a favor: <span className="text-green-700">{formatCurrency(saldo)}</span></h4>
      <p className="text-xs text-gray-500 mb-2">No vence. Se usa en el cobro como anticipo o pago total o parcial.</p>
      <div className="flex gap-2 mb-2">
        <input value={folio} onChange={e => setFolio(e.target.value)} placeholder="Folio de la tarjeta de regalo" className="flex-1 border rounded px-2 py-1 text-sm" />
        <button type="button" onClick={activar} disabled={!folio.trim()} className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-gray-900 text-white disabled:opacity-40"><Gift size={14} /> Activar</button>
      </div>
      {esDuena && (
        <div className="flex gap-2 mb-2">
          <input type="number" min="0" value={abono.monto} onChange={e => setAbono({ ...abono, monto: e.target.value })} placeholder="Abono $" className="w-24 border rounded px-2 py-1 text-sm" />
          <input value={abono.concepto} onChange={e => setAbono({ ...abono, concepto: e.target.value })} placeholder="Motivo (pedido no recogido, ajuste…)" className="flex-1 border rounded px-2 py-1 text-sm" />
          <button type="button" onClick={abonar} className="text-sm px-3 py-1 rounded border">Abonar</button>
        </div>
      )}
      {movimientos.length > 0 && (
        <ul className="text-xs text-gray-600 divide-y max-h-28 overflow-y-auto">
          {movimientos.map(m => (
            <li key={m.id} className="flex justify-between py-1">
              <span>{new Date(m.fecha).toLocaleDateString('es-MX')} · {m.concepto}</span>
              <span className={m.monto < 0 ? 'text-red-600' : 'text-green-700'}>{m.monto < 0 ? '−' : '+'}{formatCurrency(Math.abs(m.monto))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
