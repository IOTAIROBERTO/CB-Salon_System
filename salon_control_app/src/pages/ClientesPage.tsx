import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Calendar, MessageCircle, Search, Phone, Mail, X, User } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  cumple: string;
  comentarios: string;
  posibleBaja: boolean;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cumple: '',
    comentarios: '',
    posibleBaja: false
  });

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

  // Filtrar clientes
  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const searchMatch = !searchTerm || 
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefono?.includes(searchTerm);

      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'active' && !cliente.posibleBaja) ||
        (statusFilter === 'inactive' && cliente.posibleBaja);

      return searchMatch && statusMatch;
    });
  }, [clientes, searchTerm, statusFilter]);

  const generateId = () => `cliente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      cumple: '',
      comentarios: '',
      posibleBaja: false
    });
    setEditingClient(null);
  };

  const openNewClientModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditClientModal = (cliente: Cliente) => {
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      cumple: cliente.cumple,
      comentarios: cliente.comentarios,
      posibleBaja: cliente.posibleBaja
    });
    setEditingClient(cliente);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const isFormValid = () => formData.nombre.trim() && formData.cumple;

  const saveClient = () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedClients;

    if (editingClient) {
      const updatedClient = { ...editingClient, ...formData };
      updatedClients = clientes.map(c => c.id === editingClient.id ? updatedClient : c);
    } else {
      const newClient: Cliente = {
        id: generateId(),
        ...formData
      };
      updatedClients = [...clientes, newClient];
    }

    setClientes(updatedClients);
    localStorage.setItem('clientes', JSON.stringify(updatedClients));
    closeModal();

    const message = editingClient ? 'Cliente actualizado exitosamente!' : 'Cliente agregado exitosamente!';
    alert(message);
  };

  const deleteClient = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      const updatedClients = clientes.filter(c => c.id !== id);
      setClientes(updatedClients);
      localStorage.setItem('clientes', JSON.stringify(updatedClients));
    }
  };

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

  const getUpcomingBirthdays = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return clientes.filter(cliente => {
      const birthDate = new Date(cliente.cumple);
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      return thisYearBirthday <= nextWeek;
    });
  };

  const upcomingBirthdays = getUpcomingBirthdays();

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clientes</h1>
          <button
            onClick={openNewClientModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 justify-center w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Nuevo Cliente</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <p className="text-sm text-gray-600">Cumples Próximos</p>
            <p className="text-2xl font-bold text-blue-600">{upcomingBirthdays.length}</p>
          </div>
        </div>

        {/* Upcoming Birthdays Alert */}
        {upcomingBirthdays.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">
                Cumpleaños próximos (próximos 7 días)
              </h3>
            </div>
            <div className="text-sm text-blue-700">
              {upcomingBirthdays.map(cliente => (
                <span key={cliente.id} className="mr-4">
                  {cliente.nombre} - {formatDate(cliente.cumple)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <select
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Posibles bajas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
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
                    Contacto
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
                {filteredClientes.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 mr-3" />
                        <div className="font-medium text-gray-900">{cliente.nombre}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {cliente.email && (
                          <div className="flex items-center text-gray-600 mb-1">
                            <Mail size={14} className="mr-1" />
                            {cliente.email}
                          </div>
                        )}
                        {cliente.telefono && (
                          <div className="flex items-center text-gray-600">
                            <Phone size={14} className="mr-1" />
                            {cliente.telefono}
                          </div>
                        )}
                      </div>
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
                        <button
                          onClick={() => openEditClientModal(cliente)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteClient(cliente.id)}
                          className="text-red-600 hover:text-red-900 p-1"
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
      ) : (
        /* Vista de tarjetas - Móvil */
        <div className="grid gap-4">
          {filteredClientes.map(cliente => (
            <div key={cliente.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-gray-400 mr-3" />
                  <h3 className="font-semibold text-lg text-gray-900">{cliente.nombre}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditClientModal(cliente)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deleteClient(cliente.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Contacto */}
                <div>
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
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
                </div>

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

      {/* Empty State */}
      {filteredClientes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <User size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'No se encontraron clientes' 
              : 'No hay clientes registrados'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer cliente'
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <button
              onClick={openNewClientModal}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Agregar Primer Cliente
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: María García"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+52 555 123 4567"
                  />
                </div>

                {/* Fecha de Cumpleaños */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Cumpleaños *
                  </label>
                  <input
                    type="date"
                    value={formData.cumple}
                    onChange={e => setFormData({ ...formData, cumple: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Comentarios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentarios
                  </label>
                  <textarea
                    value={formData.comentarios}
                    onChange={e => setFormData({ ...formData, comentarios: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Notas sobre el cliente, preferencias, etc..."
                  />
                </div>

                {/* Posible Baja */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.posibleBaja}
                    onChange={e => setFormData({ ...formData, posibleBaja: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Marcar como posible baja
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveClient}
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isFormValid()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingClient ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}