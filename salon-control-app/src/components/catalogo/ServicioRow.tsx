import { Edit2, Trash2 } from 'lucide-react';
import { type Servicio } from '../../types/catalogo';
import { formatPrice } from '../../utils/catalogoUtils';

interface ServicioRowProps {
  servicio: Servicio;
  onEdit: (servicio: Servicio) => void;
  onDelete: (id: string) => void;
}

export default function ServicioRow({ servicio, onEdit, onDelete }: ServicioRowProps) {
  const handleDelete = () => {
    if (confirm('¿Eliminar servicio? Esta accion no se puede deshacer.')) {
      onDelete(servicio.id);
    }
  };

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="p-4 font-medium">
        {servicio.nombre}
        {servicio.duracion ? (
          <div className="text-xs text-gray-500 font-normal">
            {servicio.duracion} min{servicio.tiempoProceso ? ` · ${servicio.tiempoProceso} de proceso` : ''}
          </div>
        ) : null}
      </td>
      <td className="p-4 text-green-600 font-semibold" data-label="Precio sugerido">
        {formatPrice(servicio.precioSugerido)}
      </td>
      <td className="p-4 text-blue-600 font-semibold" data-label="Anticipo sugerido">
        {formatPrice(servicio.anticipoSugerido)}
      </td>
      <td className="p-4 text-purple-600 font-semibold md:text-center" data-label="Comisión">
        {servicio.comision ? `${servicio.comision}%` : '-'}
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(servicio)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors duration-200 flex items-center gap-1"
          >
            <Edit2 size={14} />
            <span>Editar</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors duration-200 flex items-center gap-1"
          >
            <Trash2 size={14} />
            <span>Eliminar</span>
          </button>
        </div>
      </td>
    </tr>
  );
}