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
  Filter,
  Bell,
  AlertCircle,
  Mail,
  CalendarPlus,
  Settings,
  MessageCircle
} from 'lucide-react';
import { googleCalendarService } from '../services/googleCalendar';
import { emailService } from '../services/emailService';

interface Cliente {
  id: string;
  nombre: string;
  cumple: string;
  comentarios: string;
  posibleBaja: boolean;
  email?: string;
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
  googleEventId?: string;
  emailSent?: boolean;
}

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCompletadas, setShowCompletadas] = useState(false);

  const [formData, setFormData] = useState({
    clienteId: '',
    servicioId: '',
    fecha: '',
    hora: '',
    estado: 'pendiente' as const,
    notas: '',
    syncWithGoogle: true,
    sendEmailReminder: true,
    sendWhatsAppReminder: false
  });

  useEffect(() => {
    const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');

    setCitas(citasData);
    setClientes(clientesData);
    setServicios(serviciosData);
  }, []);

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
      notas: '',
      syncWithGoogle: true,
      sendEmailReminder: true,
      sendWhatsAppReminder: false
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
      notas: cita.notas || '',
      syncWithGoogle: true,
      sendEmailReminder: true,
      sendWhatsAppReminder: false
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
        notas: formData.notas,
        emailSent: false
      };
      updatedCitas = [...citas, newCita];
    }

    setCitas(updatedCitas);
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
    closeModal();
  };

  const changeEstado = (id: string, newEstado: Cita['estado']) => {
    const updatedCitas = citas.map(cita =>
      cita.id === id ? { ...cita, estado: newEstado } : cita
    );
    setCitas(updatedCitas);
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
  };

  const deleteCita = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      const updatedCitas = citas.filter(cita => cita.id !== id);
      setCitas(updatedCitas);
      localStorage.setItem('citas', JSON.stringify(updatedCitas));
    }
  };

  const filteredCitas = useMemo(() => {
    return citas.filter(cita => {
      const searchMatch =
        !searchTerm ||
        getCliente(cita.clienteId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getServicio(cita.servicioId).toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all' || cita.estado === statusFilter;

      const completadasMatch = showCompletadas || cita.estado !== 'completada';

      return searchMatch && statusMatch && completadasMatch;
    });
  }, [citas, searchTerm, statusFilter, showCompletadas]);

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Citas</h1>
        <button
          onClick={openNewCitaModal}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 justify-center mt-4"
        >
          <Plus size={20} />
          <span>Agregar Cita</span>
        </button>
      </div>

      {/* Filtros y botón de completadas */}
      <div className="bg-white rounded-lg shadow border p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente o servicio..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                showFilters ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter size={20} />
              <span>Filtros</span>
            </button>

            <button
              onClick={() => setShowCompletadas(!showCompletadas)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                showCompletadas
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showCompletadas ? 'Ocultar Completadas' : 'Mostrar Completadas'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCitas.map(cita => (
                <tr key={cita.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{getCliente(cita.clienteId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getServicio(cita.servicioId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(cita.fecha)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatTime(cita.hora)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cita.estado === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : cita.estado === 'confirmada'
                          ? 'bg-blue-100 text-blue-800'
                          : cita.estado === 'completada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {cita.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditCitaModal(cita)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteCita(cita.id)}
                        className="text-red-600 hover:text-red-900"
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

      {/* Modal para nueva cita */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingCita ? 'Editar Cita' : 'Nueva Cita'}
              </h2>

              <div className="space-y-4">
                {/* Cliente */}
                <select
                  value={formData.clienteId}
                  onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>

                {/* Servicio */}
                <select
                  value={formData.servicioId}
                  onChange={e => setFormData({ ...formData, servicioId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar servicio</option>
                  {servicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre} - ${servicio.precioActualizado}
                    </option>
                  ))}
                </select>

                {/* Fecha */}
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  min={new Date().toISOString().split('T')[0]}
                />

                {/* Hora */}
                <input
                  type="time"
                  value={formData.hora}
                  onChange={e => setFormData({ ...formData, hora: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCita}
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg ${
                    isFormValid()
                      ? 'bg-purple-600 text-white'
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
