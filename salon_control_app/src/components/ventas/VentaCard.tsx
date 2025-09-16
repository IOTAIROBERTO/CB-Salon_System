import { Trash2 } from 'lucide-react';
import { Venta, Cliente } from '../../types/ventas';
import { getClienteName, formatPrice, formatDate } from '../../utils/ventasUtils';

interface VentaCardProps {
  venta: Venta;
  clientes: Cliente[];
  onDelete: (id: string) => void;
}

export default function VentaCard({ venta, clientes, onDelete }: VentaCardProps) {
  const handleDelete = () => {
    const success = onDelete(venta.id);
    if (success) {
      alert('Venta eliminada exitosamente');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border p-4 flex justify-between items-center hover:shadow-md transition-shadow">
      <div className="flex-1">
        <p className="font-semibold text-gray-900">
          {getClienteName(venta.clienteId, clientes)}
        </p>
        <p className="text-sm text-gray-600">
          Total: {formatPrice(venta.total)}
        </p>
        <p className="text-xs text-gray-400">
          {formatDate(venta.fecha)}
        </p>
        {venta.notas && (
          <p className="text-xs text-gray-500 mt-1 italic">
            {venta.notas}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
          title="Eliminar venta"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}