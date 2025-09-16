import { User } from 'lucide-react';

interface EmptyStateProps {
  hasClientes: boolean;
  onAddCliente: () => void;
  onShowInactivos: () => void;
}

export default function EmptyState({ hasClientes, onAddCliente, onShowInactivos }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <User size={48} className="mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasClientes ? 'No hay clientes activos' : 'No hay clientes registrados'}
      </h3>
      <p className="text-gray-600 mb-4">
        {hasClientes 
          ? 'Todos los clientes están marcados como inactivos.'
          : 'Comienza agregando tu primer cliente.'
        }
      </p>
      {hasClientes ? (
        <button
          onClick={onShowInactivos}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Mostrar Clientes Inactivos
        </button>
      ) : (
        <button 
          onClick={onAddCliente}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
        >
          Agregar Primer Cliente
        </button>
      )}
    </div>
  );
}