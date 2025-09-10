import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Calendar, MessageCircle } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  cumple: string;
  comentarios: string;
  posibleBaja: boolean;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    setClientes(clientesData);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePosibleBaja = (id: string) => {
    const updated = clientes.map(cliente =>
      cliente.id === id ? { ...cliente, posibleBaja: !cliente.posibleBaja } : cliente
    );
    setClientes(updated);
    localStorage.setItem('clientes', JSON.stringify(updated));
  };

  const updateComentarios = (id: string, comentarios: string) => {
    const updated = clientes.map(c =>
      c.id === id ? { ...c, comentarios } : c
    );
    setClientes(updated);
    localStorage.setItem('clientes', JSON.stringify(updated));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Clientes
          </h1>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center">
            <Plus size={20} />
            <span>Nuevo Cliente</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Total Clientes</p>
            <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Posibles Bajas</p>
            <p className="text-2xl font-bold text-red-600">
              {clientes.filter(c => c.posibleBaja).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Activos</p>
            <p className="text-2xl font-bold text-green-600">
              {clientes.filter(c => !c.posibleBaja).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Con Comentarios</p>
            <p className="text-2xl font-bold text-blue-600">
              {clientes.filter(c => c.comentarios.trim() !== '').length}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle View Button - Solo visible en pantallas medianas */}
      <div className="mb-4 hidden md:block lg:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              viewMode === 'cards'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tarjetas
          </button>
        </div>
      </div>

      {/* Contenido */}
      {viewMode === 'table' ? (
        /* Vista de tabla - Desktop y tablet */
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
                      <div className="font-medium text-gray-900">{cliente.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {formatDate(cliente.cumple)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <textarea
                        className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        defaultValue={cliente.comentarios}
                        placeholder="Agregar comentarios..."
                        onBlur={(e) => updateComentarios(cliente.id, e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cliente.posibleBaja}
                          onChange={() => togglePosibleBaja(cliente.id)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className={`text-sm ${
                          cliente.posibleBaja ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {cliente.posibleBaja ? 'Posible Baja' : 'Activo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1">
                          <Edit size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-900 p-1">
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
      ) : (
        /* Vista de tarjetas - Móvil */
        <div className="grid gap-4">
          {clientes.map(cliente => (
            <div key={cliente.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-gray-900">{cliente.nombre}</h3>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-900 p-1">
                    <Edit size={18} />
                  </button>
                  <button className="text-red-600 hover:text-red-900 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span className="text-sm">Cumpleaños: {formatDate(cliente.cumple)}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MessageCircle size={14} className="inline mr-1" />
                    Comentarios
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    defaultValue={cliente.comentarios}
                    placeholder="Agregar comentarios..."
                    onBlur={(e) => updateComentarios(cliente.id, e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cliente.posibleBaja}
                      onChange={() => togglePosibleBaja(cliente.id)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className={`text-sm font-medium ${
                      cliente.posibleBaja ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {cliente.posibleBaja ? 'Posible Baja' : 'Activo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {clientes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
          <p className="text-gray-600 mb-4">Comienza agregando tu primer cliente.</p>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200">
            Agregar Cliente
          </button>
        </div>
      )}
    </div>
  );
}