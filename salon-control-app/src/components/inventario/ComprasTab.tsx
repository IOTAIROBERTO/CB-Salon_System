import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ShoppingCart } from 'lucide-react';
import { db } from '../../db/db';
import { haceUnAnio } from '../../utils/proveedores';
import { formatCurrency } from '../../utils/financialUtils';
import { fechaLocalISO } from '../../utils/dateValidation';

export default function ComprasTab({ onRegistrarCompra }: { onRegistrarCompra: () => void }) {
  const compras = (useLiveQuery(() => db.compras.toArray()) || []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const proveedores = useLiveQuery(() => db.proveedores.toArray()) || [];
  const gastos = useLiveQuery(() => db.gastos.toArray()) || [];
  const [filtro, setFiltro] = useState('');

  const nombre = (id: string) => proveedores.find(p => p.id === id)?.nombre || 'Proveedor eliminado';
  const lista = compras.filter(c => !filtro || c.proveedorId === filtro);
  const mes = fechaLocalISO().slice(0, 7);
  const delMes = lista.filter(c => c.fecha.startsWith(mes)).reduce((t, c) => t + c.total, 0);
  const anio = lista.filter(c => c.fecha >= haceUnAnio()).reduce((t, c) => t + c.total, 0);
  const porPagar = lista.filter(c => c.gastoId && gastos.find(g => String(g.id) === c.gastoId)?.pagado === false)
    .reduce((t, c) => t + c.total, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Compras del mes</div><div className="text-2xl font-semibold">{formatCurrency(delMes)}</div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Últimos 12 meses</div><div className="text-2xl font-semibold">{formatCurrency(anio)}</div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Por pagar a proveedores</div><div className="text-2xl font-semibold">{formatCurrency(porPagar)}</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <select value={filtro} onChange={e => setFiltro(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
          <option value="">Todos los proveedores</option>
          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <button onClick={onRegistrarCompra} className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
          <ShoppingCart size={18} /> Registrar compra
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Proveedor</th><th className="px-4 py-2">Productos</th><th className="px-4 py-2">Folio</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2">Pago</th></tr>
          </thead>
          <tbody>
            {lista.map(c => {
              const gasto = c.gastoId ? gastos.find(g => String(g.id) === c.gastoId) : undefined;
              return (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap">{c.fecha}</td>
                  <td className="px-4 py-2">{nombre(c.proveedorId)}</td>
                  <td className="px-4 py-2 text-gray-600">{c.items.map(i => `${i.nombre} ×${i.cantidad}`).join(', ')}</td>
                  <td className="px-4 py-2">{c.folio || '—'}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(c.total)}</td>
                  <td className="px-4 py-2">{gasto ? (gasto.pagado ? 'Pagada' : <span className="text-orange-700">Pendiente</span>) : <span className="text-gray-400">Sin gasto</span>}</td>
                </tr>
              );
            })}
            {lista.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Sin compras registradas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
