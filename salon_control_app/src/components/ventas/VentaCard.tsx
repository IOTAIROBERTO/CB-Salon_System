// src/components/ventas/VentaCard.tsx
import { Trash2, ShoppingBag, Calendar, User, Package } from 'lucide-react';
import { Venta, Cliente, Item } from '../../types/ventas';
import { getClienteName, formatPrice, formatDate } from '../../utils/ventasUtils';

interface VentaCardProps {
  venta: Venta;
  clientes: Cliente[];
  inventario: Item[];
  onDelete: (id: string) => void;
}

export default function VentaCard({ venta, clientes, inventario, onDelete }: VentaCardProps) {
  const handleDelete = () => {
    const success = onDelete(venta.id);
    if (success) {
      alert('Venta eliminada exitosamente');
    }
  };

  // Obtener detalles de productos
  const getProductoDetails = (itemId: string, cantidad: number) => {
    const producto = inventario.find(item => item.id === itemId);
    if (!producto) {
      return {
        nombre: 'Producto no encontrado',
        precio: 0,
        subtotal: 0
      };
    }
    return {
      nombre: producto.nombre,
      precio: producto.precio,
      subtotal: producto.precio * cantidad
    };
  };

  const totalProductos = venta.items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-green-600" />
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              {getClienteName(venta.clienteId, clientes)}
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

        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
          title="Eliminar venta"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Descripción completa de la compra */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <ShoppingBag size={14} />
          Productos comprados:
        </h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          {venta.items.map((item, index) => {
            const detalles = getProductoDetails(item.itemId, item.cantidad);
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