import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Plus, Trash2 } from 'lucide-react';
import { db, type CompraItem } from '../../db/db';
import { registrarCompra } from '../../db/proveedores';
import { totalCompra } from '../../utils/proveedores';
import { formatCurrency } from '../../utils/financialUtils';
import { fechaLocalISO } from '../../utils/dateValidation';

const campo = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500';
const filaVacia = (): CompraItem => ({ productoId: '', nombre: '', cantidad: 1, costoUnitario: 0 });

export default function CompraModal({ proveedorId, onClose }: { proveedorId?: string; onClose: () => void }) {
  const proveedores = (useLiveQuery(() => db.proveedores.toArray()) || []).filter(p => p.activo || p.id === proveedorId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const inventario = (useLiveQuery(() => db.inventario.toArray()) || []).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const [provId, setProvId] = useState(proveedorId || '');
  const [fecha, setFecha] = useState(fechaLocalISO());
  const [folio, setFolio] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<CompraItem[]>([filaVacia()]);
  const [comoGasto, setComoGasto] = useState(true);
  const [pagado, setPagado] = useState<boolean | null>(null); // null = según el crédito del proveedor
  const [guardando, setGuardando] = useState(false);

  const proveedor = proveedores.find(p => p.id === provId);
  const pagadoEfectivo = pagado ?? !(proveedor?.diasCredito && proveedor.diasCredito > 0);
  const suyos = inventario.filter(x => x.proveedorId === provId);
  const otros = inventario.filter(x => x.proveedorId !== provId);
  const total = totalCompra(items);

  const cambiar = (i: number, cambio: Partial<CompraItem>) =>
    setItems(items.map((it, j) => (j === i ? { ...it, ...cambio } : it)));
  const elegirProducto = (i: number, id: string) => {
    const p = inventario.find(x => x.id === id);
    cambiar(i, { productoId: id, nombre: p?.nombre || '', costoUnitario: p?.costo || 0 });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedor) return alert('Elige el proveedor');
    setGuardando(true);
    try {
      const t = await registrarCompra({ proveedor, fecha, folio, notas, items, comoGasto, pagado: pagadoEfectivo });
      alert(`Compra registrada: ${formatCurrency(t)}. El stock ya se actualizó.`);
      onClose();
    } catch (err: any) {
      alert(err.message || 'No se pudo registrar la compra');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]" role="dialog" aria-modal="true" aria-label="Registrar compra">
      <form onSubmit={guardar} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl text-gray-900">Registrar compra</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {proveedores.length === 0 && <p className="text-sm text-amber-700">Primero da de alta un proveedor en la pestaña Proveedores.</p>}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select value={provId} onChange={e => setProvId(e.target.value)} className={campo} required>
                <option value="">Elegir proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={campo} required /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Folio o factura</label><input value={folio} onChange={e => setFolio(e.target.value)} className={campo} placeholder="Opcional" /></div>
          </div>

          <div>
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 mb-1"><span className="col-span-6">Producto</span><span className="col-span-2">Piezas</span><span className="col-span-3">Costo c/u</span></div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <select value={it.productoId} onChange={e => elegirProducto(i, e.target.value)} className={`${campo} col-span-6`}>
                  <option value="">Producto...</option>
                  {suyos.length > 0 && <optgroup label="De este proveedor">{suyos.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</optgroup>}
                  <optgroup label={suyos.length ? 'Otros productos' : 'Inventario'}>{otros.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</optgroup>
                </select>
                <input type="number" min="1" value={it.cantidad} onChange={e => cambiar(i, { cantidad: Number(e.target.value) })} className={`${campo} col-span-2`} aria-label="Piezas" />
                <input type="number" min="0" step="0.01" value={it.costoUnitario} onChange={e => cambiar(i, { costoUnitario: Number(e.target.value) })} className={`${campo} col-span-3`} aria-label="Costo por pieza" />
                <button type="button" onClick={() => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : [filaVacia()])} className="col-span-1 text-gray-400 hover:text-red-600" aria-label="Quitar renglón"><Trash2 size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setItems([...items, filaVacia()])} className="flex items-center gap-1 text-sm text-purple-700"><Plus size={14} /> Otro producto</button>
            {inventario.length === 0 && <p className="text-sm text-amber-700 mt-2">No hay productos en el inventario: agrégalos primero en Productos.</p>}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={comoGasto} onChange={e => setComoGasto(e.target.checked)} /> Anotar en Gastos</label>
            {comoGasto && (
              <label className="flex items-center gap-2 ml-6"><input type="checkbox" checked={pagadoEfectivo} onChange={e => setPagado(e.target.checked)} /> Ya está pagada {proveedor?.diasCredito ? <span className="text-gray-500">(crédito de {proveedor.diasCredito} días: queda pendiente de pago)</span> : null}</label>
            )}
            <p className="text-gray-500">Al guardar se suma al stock, se actualiza el costo de cada producto y se liga al proveedor si no tenía.</p>
          </div>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas (opcional)" className={`${campo} h-16 resize-none`} />
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border-2 border-gray-300 rounded-lg">Cancelar</button>
          <button type="submit" disabled={guardando || !total} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">Guardar compra</button>
        </div>
      </form>
    </div>
  );
}
