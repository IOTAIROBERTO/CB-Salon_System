import { Edit, Trash2, Calendar, MessageCircle, User, Mail, Phone } from 'lucide-react';
import { Cliente } from '../../types/clientes';
import { formatDate } from '../../utils/clientesUtils';

interface ClientesCardsProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => void;
}

export default function ClientesCards({ clientes, onEdit, onDelete }: ClientesCardsProps) {
  const handleDelete = (cliente: Cliente) => {
    onDelete(cliente.id);
  };

  return (
    <div className="grid gap-4">
      {clientes.map(cliente => (
        <div key={cliente.id} className={`p-4 rounded-lg shadow border ${
          cliente.activo ? 'bg-white' : 'bg-gray-50'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <User size={18} className="text-purple-600" />
              <h3 className="font-semibold text-lg text-gray-900">{cliente.nombre}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(cliente)}
                className="text-blue-600 hover:text-blue-900 p-1"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(cliente)}
                className="text-red-600 hover:text-red-900 p-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span className="text-sm">Cumpleaños: {formatDate(cliente.cumple)}</span>
            </div>

            {cliente.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} />
                <span className="text-sm">{cliente.email}</span>
              </div>
            )}

            {cliente.telefono && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <span className="text-sm">{cliente.telefono}</span>
              </div>
            )}

            {cliente.comentarios && (
              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <MessageCircle size={14} />
                  <span className="text-sm font-medium">Comentarios:</span>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {cliente.comentarios}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium text-gray-700">Estado:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                cliente.activo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {cliente.fechaRegistro && (
              <div className="text-xs text-gray-500">
                Cliente desde: {formatDate(cliente.fechaRegistro)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}