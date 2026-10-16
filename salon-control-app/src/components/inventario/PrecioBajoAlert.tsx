import { TrendingDown } from 'lucide-react';
import type { Producto } from '../../types/inventario';
import { estadoPrecio, precioMinimo, MARGEN_MINIMO } from '../../utils/inventarioUtils';
import { formatCurrency } from '../../utils/financialUtils';

interface PrecioBajoAlertProps {
  productos: Producto[];
}

/** Productos que se venden con pérdida o por debajo de costo × 1.6 */
export default function PrecioBajoAlert({ productos }: PrecioBajoAlertProps) {
  if (productos.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingDown size={20} className="text-red-600" />
        <h3 className="text-sm font-semibold text-red-800">
          Precios por revisar (mínimo: costo × {MARGEN_MINIMO})
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {productos.map(producto => (
          <span
            key={producto.id}
            className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
          >
            {producto.nombre}: {formatCurrency(producto.precio)}
            {estadoPrecio(producto) === 'perdida' ? ' (pérdida)' : ''} → {formatCurrency(precioMinimo(producto.costo!))}
          </span>
        ))}
      </div>
    </div>
  );
}
