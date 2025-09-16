import { Edit, Trash2, Calendar, MessageCircle, User, Mail, Phone } from 'lucide-react';
import { Cliente } from '../../types/clientes';
import { formatDate } from '../../utils/clientesUtils';

interface ClientesTableProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => void;
}

export default function ClientesTable({ clientes, onEdit, onDelete }: ClientesTableProps) {
  const handleDelete = (cliente: Cliente) => {
    onDelete(cliente.id);
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cumpleaños
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comentarios
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.map(cliente => (
              <tr key={cliente.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User size={16} className="text-purple-600 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">{cliente.nombre}</div>
                      {cliente.fechaRegistro && (
                        <div className="text-sm text-gray-500">
                          Cliente desde: {formatDate(cliente.fechaRegistro)}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDate(cliente.cumple)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="space-y-1">
                    {cliente.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span className="truncate max-w-40">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <span>{cliente.telefono}</span>
                      </div>
                    )}
                    {!cliente.email && !cliente.telefono && (
                      <span className="text-gray-400">Sin contacto</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    {cliente.comentarios ? (
                      <div className="flex items-start gap-2">
                        <MessageCircle size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 line-clamp-2 leading-tight">
                          {cliente.comentarios}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Sin comentarios</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cliente.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(cliente)}
                      className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                      title="Editar cliente"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente)}
                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                      title="Eliminar cliente"
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