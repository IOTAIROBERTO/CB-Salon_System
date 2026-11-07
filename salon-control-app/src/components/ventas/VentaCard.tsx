// src/components/ventas/VentaCard.tsx
import { useState } from 'react';
import { Trash2, ShoppingBag, Calendar, User, Package, Pencil } from 'lucide-react';
import { type Venta, type Cliente, type Item } from '../../types/ventas';
import { getClienteName, formatPrice, formatDate } from '../../utils/ventasUtils';
import { confirmar } from '../Confirmar';
import { db } from '../../db/db';
import ElegirClienta from '../clientes/ElegirClienta';

const FORMAS_PAGO = [['efectivo', 'Efectivo'], ['tarjeta', 'Tarjeta'], ['transferencia', 'Transferencia'], ['deposito', 'Depósito / OXXO']];

interface VentaCardProps {
  venta: Venta;
  clientes: Cliente[];
  inventario: Item[];
  onDelete: (id: string) => boolean | Promise<boolean>;
}

export default function VentaCard({ venta, clientes, inventario, onDelete }: VentaCardProps) {
  const handleDelete = () => onDelete(venta.id);   // pide confirmación y regresa el stock
  // Editar: clienta y forma de pago (los productos cambian eliminándola y registrándola de nuevo: el stock regresa solo)
  const [edita, setEdita] = useState<{ clienteId: string; metodoPago: string } | null>(null);
  const guardar = async () => {
    if (!edita || !(await confirmar('¿Guardar los cambios de esta venta?'))) return;
    await db.ventas.update(venta.id, edita);
    setEdita(null);
  };

  // Obtener detalles de productos
  const getProductoDetails = (itemId: string, cantidad: number, precioVenta?: number) => {
    const producto = inventario.find(item => item.id === itemId);
    const precio = precioVenta ?? producto?.precio ?? 0;
    return { nombre: producto?.nombre ?? 'Producto ya no está en inventario', precio, subtotal: precio * cantidad };
  };

  const totalProductos = (venta.items || []).reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-green-600" />
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              {venta.concepto || getClienteName(venta.clienteId, clientes)}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(venta.fecha)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package size={14} />
                <span>{totalProductos} productos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          {!venta.concepto && (
            <button onClick={() => setEdita(edita ? null : { clienteId: venta.clienteId, metodoPago: venta.metodoPago || 'efectivo' })}
              className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded transition-colors" title="Editar venta" aria-label="Editar venta">
              <Pencil size={18} />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
            title="Eliminar venta"
            aria-label="Eliminar venta"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {edita && (
        <div className="mb-4 space-y-2 rounded-lg border p-3 text-sm">
          <ElegirClienta value={edita.clienteId} onChange={clienteId => setEdita({ ...edita, clienteId })} />
          <select value={edita.metodoPago} onChange={e => setEdita({ ...edita, metodoPago: e.target.value })} className="w-full rounded-lg border px-3 py-2">
            {FORMAS_PAGO.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            {!FORMAS_PAGO.some(([v]) => v === edita.metodoPago) && <option value={edita.metodoPago}>{edita.metodoPago}</option>}
          </select>
          <p className="text-xs text-gray-500">Para cambiar productos, elimínala y regístrala de nuevo: el stock regresa solo.</p>
          <div className="flex gap-2">
            <button onClick={() => setEdita(null)} className="min-h-[40px] flex-1 rounded-lg border hover:bg-gray-50">Cancelar</button>
            <button onClick={guardar} disabled={!edita.clienteId} className="min-h-[40px] flex-1 rounded-lg bg-marca-negro text-white hover:bg-gray-800 disabled:opacity-40">Guardar</button>
          </div>
        </div>
      )}

      {/* Descripción completa de la compra */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <ShoppingBag size={14} />
          Productos comprados:
        </h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          {(venta.items || []).map((item, index) => {
            const detalles = getProductoDetails(item.itemId, item.cantidad, item.precio);
            return (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{detalles.nombre}</span>
                  <span className="text-gray-600 ml-2">
                    x{item.cantidad} × {formatPrice(detalles.precio)}
                  </span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatPrice(detalles.subtotal)}
                </span>
              </div>
            );
          })}

          {(!venta.items || venta.items.length === 0) && (
            <div className="text-sm text-gray-500 italic pb-2">
              Venta de servicio o sin productos detallados
            </div>
          )}

          {/* Total */}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total:</span>
              <span className="font-bold text-green-600 text-lg">
                {formatPrice(venta.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notas adicionales */}
      {venta.notas && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Notas:</h4>
          <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded italic">
            {venta.notas}
          </p>
        </div>
      )}

      {/* Resumen inferior */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{totalProductos}</span> productos • <span className="font-medium">{formatDate(venta.fecha)}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {formatPrice(venta.total)}
          </div>
          <div className="text-xs text-gray-500">
            Total de la venta
          </div>
        </div>
      </div>
    </div>
  );
}