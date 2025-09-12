import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Calendar, MessageCircle, User, X, Phone, Mail } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  cumple: string;
  comentarios: string;
  activo: boolean;
  email?: string;
  telefono?: string;
  fechaRegistro?: string;
  ultimaVisita?: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showInactivos, setShowInactivos] = useState(true);

  const [formData, setFormData] = useState({
    nombre: '',
    cumple: '',
    comentarios: '',
    activo: true,
    email: '',
    telefono: ''
  });

  useEffect(() => {
    // Inicializar con datos actualizados si no existen
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    if (clientesData.length === 0) {
      const clientesIniciales = [
        { 
          id: 'c1', 
          nombre: 'Ana López', 
          cumple: '1990-06-15', 
          comentarios: 'Prefiere cortes modernos', 
          activo: true,
          email: 'ana.lopez@email.com',
          telefono: '+5215512345678',
          fechaRegistro: '2024-01-15'
        },
        { 
          id: 'c2', 
          nombre: 'María García', 
          cumple: '1985-11-23', 
          comentarios: 'Cliente VIP', 
          activo: true,
          email: 'maria.garcia@email.com',
          telefono: '+5215587654321',
          fechaRegistro: '2024-02-10'
        }
      ];
      setClientes(clientesIniciales);
      localStorage.setItem('clientes', JSON.stringify(clientesIniciales));
    } else {
      // Migrar datos antiguos si es necesario
      const clientesMigrados = clientesData.map((cliente: any) => ({
        ...cliente,
        activo: cliente.posibleBaja !== undefined ? !cliente.posibleBaja : (cliente.activo ?? true),
        fechaRegistro: cliente.fechaRegistro || new Date().toISOString().split('T')[0]
      }));
      setClientes(clientesMigrados);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Obtener cumpleañeros del mes actual
  const getCumpleanerosMes = () => {
    const mesActual = new Date().getMonth();
    return clientes.filter(cliente => {
      const fechaCumple = new Date(cliente.cumple);
      return fechaCumple.getMonth() === mesActual && cliente.activo;
    }).sort((a, b) => {
      const fechaA = new Date(a.cumple).getDate();
      const fechaB = new Date(b.cumple).getDate();
      return fechaA - fechaB;
    });
  };

  const cumpleanerosMes = getCumpleanerosMes();
  const clientesFiltrados = showInactivos ? clientes : clientes.filter(c => c.activo);

  // Estadísticas
  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter(c => c.activo).length;
  const clientesInactivos = clientes.filter(c => !c.activo).length;
  const conEmail = clientes.filter(c => c.email && c.email.trim() !== '').length;
  const conTelefono = clientes.filter(c => c.telefono && c.telefono.trim() !== '').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Generar ID único
  const generateId = () => `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      cumple: '',
      comentarios: '',
      activo: true,
      email: '',
      telefono: ''
    });
    setEditingCliente(null);
  };

  // Abrir modal para nuevo cliente
  const openNewClienteModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Abrir modal para editar cliente
  const openEditClienteModal = (cliente: Cliente) => {
    setFormData({
      nombre: cliente.nombre,
      cumple: cliente.cumple,
      comentarios: cliente.comentarios,
      activo: cliente.activo,
      email: cliente.email || '',
      telefono: cliente.telefono || ''
    });
    setEditingCliente(cliente);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulario
  const isFormValid = () => {
    return formData.nombre.trim() !== '' && formData.cumple !== '';
  };

  // Guardar cliente
  const saveCliente = () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedClientes;

    if (editingCliente) {
      // Actualizar cliente existente
      updatedClientes = clientes.map(cliente =>
        cliente.id === editingCliente.id
          ? { 
              ...cliente, 
              ...formData,
              ultimaVisita: new Date().toISOString().split('T')[0]
            }
          : cliente
      );
    } else {
      // Crear nuevo cliente
      const newCliente: Cliente = {
        id: generateId(),
        nombre: formData.nombre.trim(),
        cumple: formData.cumple,
        comentarios: formData.comentarios.trim(),
        activo: formData.activo,
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        fechaRegistro: new Date().toISOString().split('T')[0]
      };
      updatedClientes = [...clientes, newCliente];
    }

    setClientes(updatedClientes);
    localStorage.setItem('clientes', JSON.stringify(updatedClientes));
    closeModal();
    
    alert((editingCliente ? 'Cliente actualizado' : 'Cliente agregado') + ' exitosamente!');
  };

  // Eliminar cliente
  const deleteCliente = (id: string) => {
    // Verificar si el cliente tiene citas o servicios
    const citas = JSON.parse(localStorage.getItem('citas') || '[]');
    const servicios = JSON.parse(localStorage.getItem('serviciosRealizados') || '[]');
    
    const tieneRegistros = citas.some((cita: any) => cita.clienteId === id) || 
                          servicios.some((servicio: any) => servicio.clienteId === id);
    
    if (tieneRegistros) {
      const confirmarEliminacion = confirm(
        'Este cliente tiene citas o servicios registrados. ¿Estás seguro de eliminarlo? ' +
        'Se recomienda marcarlo como inactivo en su lugar.'
      );
      if (!confirmarEliminacion) return;
    } else {
      if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
    }
    
    const updatedClientes = clientes.filter(cliente => cliente.id !== id);
    setClientes(updatedClientes);
    localStorage.setItem('clientes', JSON.stringify(updatedClientes));
    
    alert('Cliente eliminado exitosamente');
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Clientes
          </h1>
          <button 
            onClick={openNewClienteModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 justify-center"
          >
            <Plus size={20} />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Estadísticas */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Total Clientes</p>
            <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Activos</p>
            <p className="text-2xl font-bold text-green-600">{clientesActivos}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Inactivos</p>
            <p className="text-2xl font-bold text-red-600">{clientesInactivos}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Con Email</p>
            <p className="text-2xl font-bold text-blue-600">{conEmail}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Con Teléfono</p>
            <p className="text-2xl font-bold text-purple-600">{conTelefono}</p>
          </div>
        </div>

        {/* Controles */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {/* Toggle para mostrar inactivos */}
          <button
            onClick={() => setShowInactivos(!showInactivos)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              showInactivos ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showInactivos ? 'Ocultar Inactivos' : 'Mostrar Inactivos'}
          </button>

          {/* Toggle de vista (solo visible en pantallas medianas) */}
          <div className="hidden md:block lg:hidden">
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
                    Contacto
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
                {clientesFiltrados.map(cliente => (
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
                          onClick={() => openEditClienteModal(cliente)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Editar cliente"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteCliente(cliente.id)}
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
      ) : (
        /* Vista de tarjetas - Móvil */
        <div className="grid gap-4">
          {clientesFiltrados.map(cliente => (
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
                    onClick={() => openEditClienteModal(cliente)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deleteCliente(cliente.id)}
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
      )}

      {clientesFiltrados.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <User size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {clientes.length === 0 ? 'No hay clientes registrados' : 'No hay clientes activos'}
          </h3>
          <p className="text-gray-600 mb-4">
            {clientes.length === 0 
              ? 'Comienza agregando tu primer cliente.'
              : 'Todos los clientes están marcados como inactivos.'
            }
          </p>
          {clientes.length === 0 ? (
            <button 
              onClick={openNewClienteModal}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Agregar Primer Cliente
            </button>
          ) : (
            <button
              onClick={() => setShowInactivos(true)}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Mostrar Clientes Inactivos
            </button>
          )}
        </div>
      )}

      {/* Modal para agregar/editar cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
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
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Ej: María García López"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Fecha de cumpleaños */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Cumpleaños *
                  </label>
                  <input
                    type="date"
                    value={formData.cumple}
                    onChange={(e) => handleInputChange('cumple', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nos ayuda a enviar felicitaciones y ofertas especiales
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para recordatorios y confirmaciones por email
                  </p>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono/WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para recordatorios por WhatsApp (incluye código de país)
                  </p>
                </div>

                {/* Comentarios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentarios y Notas
                  </label>
                  <textarea
                    value={formData.comentarios}
                    onChange={(e) => handleInputChange('comentarios', e.target.value)}
                    placeholder="Preferencias, alergias, historial, etc..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Estado activo/inactivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Cliente
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="activo"
                        checked={formData.activo === true}
                        onChange={() => handleInputChange('activo', true)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Activo</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="activo"
                        checked={formData.activo === false}
                        onChange={() => handleInputChange('activo', false)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Inactivo</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Los clientes inactivos no aparecen en la selección de citas
                  </p>
                </div>

                {/* Información importante */}
                {!editingCliente && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                      💡 Información importante:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• El cliente estará disponible para crear citas una vez guardado</li>
                      <li>• El email y teléfono son opcionales pero recomendados</li>
                      <li>• Los comentarios te ayudan a brindar mejor servicio</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCliente}
                  disabled={!isFormValid()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isFormValid()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingCliente ? 'Actualizar' : 'Guardar'} Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}