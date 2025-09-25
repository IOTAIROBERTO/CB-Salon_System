import { AlertTriangle } from 'lucide-react';
import { Producto } from '../../types/inventario';

interface StockBajoAlertProps {
  productosStockBajo: Producto[];
}

export default function StockBajoAlert({ productosStockBajo }: StockBajoAlertProps) {
  if (productosStockBajo.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={20} className="text-orange-600" />
        <h3 className="text-sm font-semibold text-orange-800">
          Productos con stock bajo
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {productosStockBajo.map(producto => (
          <span
            key={producto.id}
            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
          >
            {producto.nombre} ({producto.cantidad} unidades)
          </span>
        ))}
      </div>
    </div>
  );
}