import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  User,
  Scissors,
  X,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  cumple: string;
  comentarios: string;
  posibleBaja: boolean;
  email?: string;
  telefono?: string;
}

interface Servicio {
  id: string;
  nombre: string;
  precioActualizado: number;
  anticipo: number;
}

interface Cita {
  id: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas?: string;
}

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Formulario
  const [formData, setFormData] = useState({
    clienteId: '',
    servicioId: '',
    fecha: '',
    hora: '',
    estado: 'pendiente' as const,
    notas: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');

    setCitas(citasData);
    setClientes(clientesData);
    setServicios(serviciosData);
  }, []);

  // Detectar modo de vista según pantalla
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar citas
  const filteredCitas = useMemo(() => {
    return citas.filter(cita => {
      const cliente = clientes.find(c => c.id === cita.clienteId);
      const servicio = servicios.find(s => s.id === cita.servicioId);
      
      // Filtro de búsqueda
      const searchMatch = !searchTerm || 
        cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de fecha
      let dateMatch = true;
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        dateMatch = cita.fecha === today;
      } else if (dateFilter === 'week') {
        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const citaDate = new Date(cita.fecha);
        dateMatch = citaDate >= today && citaDate <= weekFromNow;
      }

      // Filtro de estado
      const statusMatch = statusFilter === 'all' || cita.estado === statusFilter;

      return searchMatch && dateMatch && statusMatch;
    });
  }, [citas, clientes, servicios, searchTerm, dateFilter, statusFilter]);

  const getCliente = (id: string) =>
    clientes.find(c => c.id === id)?.nombre || 'Cliente no encontrado';

  const getServicio = (id: string) =>
    servicios.find(s => s.id === id)?.nombre || 'Servicio no encontrado';

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const formatTime = (timeString: string) =>
    new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

  const isFormValid = () =>
    formData.clienteId && formData.servicioId && formData.fecha && formData.hora;

  const generateId = () =>
    `cita_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const resetForm = () => {
    setFormData({
      clienteId: '',
      servicioId: '',
      fecha: '',
      hora: '',
      estado: 'pendiente',
      notas: ''
    });
    setEditingCita(null);
  };

  const openNewCitaModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditCitaModal = (cita: Cita) => {
    setFormData({
      clienteId: cita.clienteId,
      servicioId: cita.servicioId,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      notas: cita.notas || ''
    });
    setEditingCita(cita);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const saveCita = async () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedCitas;

    try {
      if (editingCita) {
        const updatedCita = { ...editingCita, ...formData };
        updatedCitas = citas.map(cita =>
          cita.id === editingCita.id ? updatedCita : cita
        );
      } else {
        const newCita: Cita = {
          id: generateId(),
          clienteId: formData.clienteId,
          servicioId: formData.servicioId,
          fecha: formData.fecha,
          hora: formData.hora,
          estado: formData.estado,
          notas: formData.notas
        };
        updatedCitas = [...citas, newCita];
      }

      setCitas(updatedCitas);
      localStorage.setItem('citas', JSON.stringify(updatedCitas));
      closeModal();

      const message = editingCita ? 'Cita actualizada exitosamente!' : 'Cita creada exitosamente!';
      alert(message);
    } catch (error) {
      console.error('Error saving cita:', error);
      alert('Error al guardar la cita. Intenta de nuevo.');
    }
  };

  const changeEstado = (id: string, newEstado: Cita['estado']) => {
    const updatedCitas = citas.map(c =>
      c.id === id ? { ...c, estado: newEstado } : c
    );
    setCitas(updatedCitas);
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
  };

  const deleteCita = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      const updatedCitas = citas.filter(c => c.id !== id);
      setCitas(updatedCitas);
      localStorage.setItem('citas', JSON.stringify(updatedCitas));
    }
  };

  const getStatusColor = (estado: Cita['estado']) => {
    switch (estado) {
      case 'pendiente': return 'text-yellow-600 bg-yellow-100';
      case 'confirmada': return 'text-blue-600 bg-blue-100';
      case 'completada': return 'text-green-600 bg-green-100';
      case 'cancelada': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (estado: Cita['estado']) => {
    switch (estado) {
      case 'pendiente': return <Clock size={16} />;
      case 'confirmada': return <CheckCircle size={16} />;
      case 'completada': return <CheckCircle size={16} />;
      case 'cancelada': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Citas</h1>
          <button
            onClick={openNewCitaModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 justify-center w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Nueva Cita</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Total Citas</p>
            <p className="text-2xl font-bold text-gray-900">{citas.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {citas.filter(c => c.estado === 'pendiente').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Confirmadas</p>
            <p className="text-2xl font-bold text-blue-600">
              {citas.filter(c => c.estado === 'confirmada').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Completadas</p>
            <p className="text-2xl font-bold text-green-600">
              {citas.filter(c => c.estado === 'completada').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por cliente o servicio..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
            </select>

            <select
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
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
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
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
                {filteredCitas.map(cita => (
                  <tr key={cita.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 mr-3" />
                        <div className="font-medium text-gray-900">{getCliente(cita.clienteId)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Scissors className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{getServicio(cita.servicioId)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar size={14} className="mr-1" />
                          {new Date(cita.fecha).toLocaleDateString('es-ES')}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock size={14} className="mr-1" />
                          {formatTime(cita.hora)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          className={`text-sm px-2 py-1 rounded-full border-0 font-medium ${getStatusColor(cita.estado)}`}
                          value={cita.estado}
                          onChange={(e) => changeEstado(cita.id, e.target.value as Cita['estado'])}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditCitaModal(cita)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteCita(cita.id)}
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
          {filteredCitas.map(cita => {
            const cliente = clientes.find(c => c.id === cita.clienteId);
            const servicio = servicios.find(s => s.id === cita.servicioId);
            
            return (
              <div key={cita.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{cliente?.nombre}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Scissors size={14} className="mr-1" />
                        {servicio?.nombre}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditCitaModal(cita)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deleteCita(cita.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span className="text-sm">{formatDate(cita.fecha)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Clock size={16} className="mr-2" />
                    <span className="text-sm">{formatTime(cita.hora)}</span>
                  </div>
                  
                  {cita.notas && (
                    <div className="text-sm text-gray-600">
                      <strong>Notas:</strong> {cita.notas}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm font-medium text-gray-700">Estado:</span>
                    <select
                      className={`text-sm px-3 py-1 rounded-full border-0 font-medium ${getStatusColor(cita.estado)}`}
                      value={cita.estado}
                      onChange={(e) => changeEstado(cita.id, e.target.value as Cita['estado'])}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredCitas.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || dateFilter !== 'all' || statusFilter !== 'all' 
              ? 'No se encontraron citas' 
              : 'No hay citas programadas'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || dateFilter !== 'all' || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza programando tu primera cita'
            }
          </p>
          {(!searchTerm && dateFilter === 'all' && statusFilter === 'all') && (
            <button
              onClick={openNewCitaModal}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Programar Primera Cita
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
                  {editingCita ? 'Editar Cita' : 'Nueva Cita'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Servicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio *
                  </label>
                  <select
                    value={formData.servicioId}
                    onChange={e => setFormData({ ...formData, servicioId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar servicio</option>
                    {servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre} - ${servicio.precioActualizado}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={e => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value as Cita['estado'] })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Notas adicionales sobre la cita..."
                  />
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
                  onClick={saveCita}
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isFormValid()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingCita ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}