// src/components/email/ClientSelector.tsx
import { CheckSquare, Square } from 'lucide-react';

interface ClientSelectorProps {
  filtroTipo: string;
  onFiltroChange: (filtro: string) => void;
  clients: any[];
  selectedClients: string[];
  onSelectionChange: (clients: string[]) => void;
}

export default function ClientSelector({
  filtroTipo,
  onFiltroChange,
  clients,
  selectedClients,
  onSelectionChange
}: ClientSelectorProps) {
  const getFilteredClients = () => {
    switch (filtroTipo) {
      case 'cumpleanos':
        const mesActual = new Date().getMonth() + 1;
        return clients.filter(client => {
          const clientMonth = new Date(client.cumple).getMonth() + 1;
          return clientMonth === mesActual;
        });
      case 'nuevos':
        const treintaDias = new Date();
        treintaDias.setDate(treintaDias.getDate() - 30);
        return clients.filter(client => 
          new Date(client.fechaRegistro || new Date()) > treintaDias
        );
      case 'manual':
        return clients;
      default:
        return clients;
    }
  };

  const toggleClientSelection = (clientId: string) => {
    const newSelection = selectedClients.includes(clientId)
      ? selectedClients.filter(id => id !== clientId)
      : [...selectedClients, clientId];
    onSelectionChange(newSelection);
  };

  const selectAllClients = () => {
    const filteredClients = getFilteredClients();
    onSelectionChange(filteredClients.map(c => c.id));
  };

  const clearClientSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Destinatarios *
      </label>
      <div className="space-y-3">
        <select
          value={filtroTipo}
          onChange={(e) => onFiltroChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="todos">Todos los clientes</option>
          <option value="activos">Clientes activos</option>
          <option value="cumpleanos">Cumpleañeros del mes</option>
          <option value="nuevos">Clientes nuevos (30 días)</option>
          <option value="manual">Selección manual</option>
        </select>

        {filtroTipo === 'manual' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Clientes seleccionados: {selectedClients.length}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllClients}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Seleccionar todos
                </button>
                <button
                  type="button"
                  onClick={clearClientSelection}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Limpiar selección
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
              {clients.map(client => (
                <label 
                  key={client.id} 
                  className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50"
                >
                  <button
                    type="button"
                    onClick={() => toggleClientSelection(client.id)}
                    className="text-purple-600"
                  >
                    {selectedClients.includes(client.id) ? 
                      <CheckSquare size={16} /> : 
                      <Square size={16} />
                    }
                  </button>
                  <span className="text-sm">{client.nombre}</span>
                  <span className="text-xs text-gray-500">({client.email})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          Destinatarios que recibirán el email: {
            filtroTipo === 'manual' 
              ? selectedClients.length 
              : getFilteredClients().length
          }
        </div>
      </div>
    </div>
  );
}