import { Edit, Trash2, Package } from 'lucide-react';
import { Producto } from '../../types/inventario';
import { getStockColor } from '../../utils/inventarioUtils';

interface ProductosTableProps {
  productos: Producto[];
  onEdit: (producto: Producto) => void;
  onEditStock: (producto: Producto) => void;
  onDelete: (id: string) => void;
}

export default function ProductosTable({ productos, onEdit, onEditStock, onDelete }: ProductosTableProps) {
  const handleDelete = (producto: Producto) => {
    const success = onDelete(producto.id);
    if (success) {
      alert('Producto eliminado exitosamente');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
                    <div className="font-medium text-gray-900">{producto.nombre}</div>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStockColor(producto)}`}>
                      {producto.cantidad} unidades
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Mínimo: {producto.stockMinimo}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      ${producto.precio.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Protegido
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-green-600">
                  ${(producto.cantidad * producto.precio).toLocaleString()}
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
    </div>
  );
}