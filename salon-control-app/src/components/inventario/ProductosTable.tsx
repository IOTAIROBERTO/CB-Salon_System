import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Edit, Trash2, Package, Smartphone } from 'lucide-react';
import { db } from '../../db/db';
import { apartados } from '../../utils/pedidos';
import ProductoEnApp from './ProductoEnApp';
import { type Producto } from '../../types/inventario';
import { getStockColor, estadoPrecio, margenPorcentaje } from '../../utils/inventarioUtils';
import { formatCurrency } from '../../utils/financialUtils';

interface ProductosTableProps {
  productos: Producto[];
  onEdit: (producto: Producto) => void;
  onEditStock: (producto: Producto) => void;
  onDelete: (id: string) => boolean | Promise<boolean>;
}

export default function ProductosTable({ productos, onEdit, onEditStock, onDelete }: ProductosTableProps) {
  // Apartado en pedidos de la app: no se vende en la tienda hasta que se entregue o venza
  const aparts = apartados(useLiveQuery(() => db.pedidos.toArray()) || []);
  const [enApp, setEnApp] = useState<Producto | null>(null);
  const handleDelete = async (producto: Producto) => {
    const confirmed = await onDelete(producto.id);
    if (confirmed) {
      alert('Producto eliminado exitosamente');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="tabla-tarjetas min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productos.map(producto => (
              <tr key={producto.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{producto.nombre}{producto.enApp && <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-marca-negro px-2 py-0.5 align-middle text-[10px] uppercase tracking-[0.14em] text-marca-dorado">En la app</span>}</div>
                    {producto.proveedor && (
                      <div className="text-sm text-gray-500">Proveedor: {producto.proveedor}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {producto.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap" data-label="Stock">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStockColor(producto)}`}>
                      {producto.cantidad} unidades
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Mínimo: {producto.stockMinimo}
                    </div>
                    {aparts[producto.id] > 0 && (
                      <div className="text-xs text-amber-700 mt-1" title="Apartado en pedidos de la app: no se vende en la tienda">
                        {aparts[producto.id]} apartado{aparts[producto.id] === 1 ? '' : 's'} · {Math.max(0, producto.cantidad - aparts[producto.id])} para venta
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap" data-label="Precio">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(producto.precio)}
                  </div>
                  {(() => {
                    const estado = estadoPrecio(producto);
                    if (estado === 'sin-costo') {
                      return <div className="text-xs text-gray-400 mt-1">Sin costo capturado</div>;
                    }
                    const margen = Math.round((margenPorcentaje(producto) ?? 0) * 100);
                    const color = estado === 'perdida' ? 'bg-red-100 text-red-800'
                      : estado === 'subir' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';
                    return (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        Costo {formatCurrency(producto.costo!)}
                        <span className={`px-2 py-0.5 rounded-full font-medium ${color}`}>
                          {estado === 'perdida' ? 'Pérdida' : `Margen ${margen}%`}
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-green-600" data-label="Valor total">
                  {formatCurrency(producto.cantidad * producto.precio)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditStock(producto)}
                      className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                      title="Editar stock"
                    >
                      <Package size={16} />
                    </button>
                    <button
                      onClick={() => setEnApp(producto)}
                      className="text-gray-700 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                      title="Venta en la app de clientas"
                    >
                      <Smartphone size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(producto)}
                      className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                      title="Editar producto"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(producto)}
                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                      title="Eliminar producto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {enApp && <ProductoEnApp producto={enApp} onClose={() => setEnApp(null)} />}
    </div>
  );
}