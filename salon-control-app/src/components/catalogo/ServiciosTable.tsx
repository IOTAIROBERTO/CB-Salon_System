import { Scissors } from 'lucide-react';
import { Servicio } from '../../types/catalogo';
import ServicioRow from './ServicioRow';

interface ServiciosTableProps {
  servicios: Servicio[];
  onEdit: (servicio: Servicio) => void;
  onDelete: (id: string) => void;
}

export default function ServiciosTable({ servicios, onEdit, onDelete }: ServiciosTableProps) {
  if (servicios.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">
          <Scissors size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No hay servicios registrados</p>
          <p className="text-sm">Agrega tu primer servicio para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4 text-left font-semibold text-gray-900">Servicio</th>
            <th className="p-4 text-left font-semibold text-gray-900">Precio Sugerido</th>
            <th className="p-4 text-left font-semibold text-gray-900">Anticipo Sugerido</th>
            <th className="p-4 text-left font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {servicios.map(servicio => (
            <ServicioRow
              key={servicio.id}
              servicio={servicio}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}