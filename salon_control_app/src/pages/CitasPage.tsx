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
  Play,
  Pause,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

interface Servicio {
  id: string;
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
}

interface Cita {
  id: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'iniciada' | 'completada' | 'cancelada';
  notas?: string;
  
  // Campos de anticipo
  anticipoConfirmado: boolean;
  montoAnticipo: number;
  metodoPagoAnticipo?: string;
  
  // Campos de cobro final (cuando se completa)
  precioFinal?: number;
  saldoPendiente?: number;
  metodoPagoFinal?: string;
  fechaCompletada?: string;
  fechaCancelada?: string;
  fechaIniciada?: string;
}

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [isReagendarModalOpen, setIsReagendarModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [citaCobrar, setCitaCobrar] = useState<Cita | null>(null);
  const [citaReagendar, setCitaReagendar] = useState<Cita | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCompletadas, setShowCompletadas] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    clienteId: '',
    servicioId: '',
    fecha: '',
    hora: '',
    notas: '',
    anticipoConfirmado: false,
    montoAnticipo: 0,
    metodoPagoAnticipo: ''
  });

  const [cobroData, setCobroData] = useState({
    precioFinal: 0,
    metodoPagoFinal: '',
    notas: ''
  });

  const [reagendarData, setReagendarData] = useState({
    fecha: '',
    hora: ''
  });

  useEffect(() => {
    const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');

    // Migrar datos antiguos si es necesario
    const citasMigradas = citasData.map((cita: any) => ({
      ...cita,
      anticipoConfirmado: cita.anticipoConfirmado || false,
      montoAnticipo: cita.montoAnticipo || 0
    }));

    setCitas(citasMigradas);
    setClientes(clientesData.filter((c: Cliente) => c.activo));
    setServicios(serviciosData);
  }, []);

  // Funciones auxiliares
  const getCliente = (id: string) =>
    clientes.find(c => c.id === id)?.nombre || 'Cliente no encontrado';

  const getServicio = (id: string) => {
    const servicio = servicios.find(s => s.id === id);
    return servicio ? servicio : { nombre: 'Servicio no encontrado', precioSugerido: 0, anticipoSugerido: 0 };
  };

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

  const generateId = () =>
    `cita_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calcular estadísticas
  const citasPendientes = citas.filter(c => ['pendiente', 'confirmada'].includes(c.estado)).length;
  const citasEnProceso = citas.filter(c => c.estado === 'iniciada').length;
  const ingresosMes = citas
    .filter(c => c.estado === 'completada' && c.fechaCompletada && 
      new Date(c.fechaCompletada).getMonth() === new Date().getMonth())
    .reduce((sum, c) => sum + (c.precioFinal || 0), 0);
  const saldosPendientes = citas
    .filter(c => c.estado === 'iniciada' || (c.estado === 'completada' && (c.saldoPendiente || 0) > 0))
    .reduce((sum, c) => sum + (c.saldoPendiente || 0), 0);

  // Resetear formularios
  const resetForm = () => {
    setFormData({
      clienteId: '',
      servicioId: '',
      fecha: '',
      hora: '',
      notas: '',
      anticipoConfirmado: false,
      montoAnticipo: 0,
      metodoPagoAnticipo: ''
    });
    setEditingCita(null);
  };

  const resetCobroForm = () => {
    setCobroData({
      precioFinal: 0,
      metodoPagoFinal: '',
      notas: ''
    });
    setCitaCobrar(null);
  };

  // Modal handlers
  const openNewCitaModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditCitaModal = (cita: Cita) => {
    const servicio = getServicio(cita.servicioId);
    setFormData({
      clienteId: cita.clienteId,
      servicioId: cita.servicioId,
      fecha: cita.fecha,
      hora: cita.hora,
      notas: cita.notas || '',
      anticipoConfirmado: cita.anticipoConfirmado,
      montoAnticipo: cita.montoAnticipo || servicio.anticipoSugerido,
      metodoPagoAnticipo: cita.metodoPagoAnticipo || ''
    });
    setEditingCita(cita);
    setIsModalOpen(true);
  };

  const openCobroModal = (cita: Cita) => {
    const servicio = getServicio(cita.servicioId);
    const saldoPendiente = servicio.precioSugerido - (cita.montoAnticipo || 0);
    
    setCobroData({
      precioFinal: servicio.precioSugerido,
      metodoPagoFinal: '',
      notas: ''
    });
    setCitaCobrar(cita);
    setIsCobroModalOpen(true);
  };

  const openReagendarModal = (cita: Cita) => {
    setReagendarData({
      fecha: cita.fecha,
      hora: cita.hora
    });
    setCitaReagendar(cita);
    setIsReagendarModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCobroModalOpen(false);
    setIsReagendarModalOpen(false);
    resetForm();
    resetCobroForm();
    setCitaReagendar(null);
  };

  // Validaciones
  const isFormValid = () =>
    formData.clienteId && formData.servicioId && formData.fecha && formData.hora;

  const isCobroFormValid = () =>
    cobroData.precioFinal > 0 && cobroData.metodoPagoFinal;

  // CRUD operations
  const saveCita = () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedCitas;

    if (editingCita) {
      updatedCitas = citas.map(cita =>
        cita.id === editingCita.id 
          ? { 
              ...cita, 
              ...formData,
              estado: cita.estado === 'pendiente' && formData.anticipoConfirmado ? 'confirmada' : cita.estado
            }
          : cita
      );
    } else {
      const newCita: Cita = {
        id: generateId(),
        clienteId: formData.clienteId,
        servicioId: formData.servicioId,
        fecha: formData.fecha,
        hora: formData.hora,
        estado: formData.anticipoConfirmado ? 'confirmada' : 'pendiente',
        notas: formData.notas,
        anticipoConfirmado: formData.anticipoConfirmado,
        montoAnticipo: formData.anticipoConfirmado ? formData.montoAnticipo : 0,
        metodoPagoAnticipo: formData.metodoPagoAnticipo
      };
      updatedCitas = [...citas, newCita];
    }

    setCitas(updatedCitas);
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
    closeModal();
  };

  const changeEstadoCita = (id: string, newEstado: Cita['estado']) => {
    const now = new Date().toISOString();
    
    const updatedCitas = citas.map(cita =>
      cita.id === id 
        ? { 
            ...cita, 
            estado: newEstado,
            fechaIniciada: newEstado === 'iniciada' ? now : cita.fechaIniciada,
            fechaCancelada: newEstado === 'cancelada' ? now : cita.fechaCancelada
          } 
        : cita
    );
    
    setCitas(updatedCitas);
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
  };

  const completarCita = () => {
    if (!citaCobrar || !isCobroFormValid()) {
      alert('Por favor completa todos los campos');
      return;
    }

    const saldoPendiente = Math.max(0, cobroData.precioFinal - (citaCobrar.montoAnticipo || 0));
    const now = new Date().toISOString();

    const updatedCitas = citas.map(cita =>
      cita.id === citaCobrar.id
        ? {
            ...cita,
            estado: 'completada' as const,
            precioFinal: cobroData.precioFinal,
            saldoPendiente,
            metodoPagoFinal: cobroData.metodoPagoFinal,
            fechaCompletada: now,
            notas: cita.notas ? `${cita.notas}\n${cobroData.notas}` : cobroData.notas
          }
        : cita
    );

    setCitas(updatedCitas);
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
    closeModal();
    
    alert('¡Cita completada exitosamente!');
  };

  const reagendarCita = () => {
    if (!citaReagendar || !reagendarData.fecha || !reagendarData.hora) {
      alert('Por favor completa fecha y hora');
      return;
    }

    const updatedCitas = citas.map(cita =>
      cita.id === citaReagendar.id
        ? {
            ...cita,
            fecha: reagendarData.fecha,
            hora: reagendarData.hora,
            estado: 'pendiente' as const
          }
        : cita
    );

    setCitas(updatedCitas);
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
    closeModal();
    
    alert('Cita reagendada exitosamente');
  };

  const deleteCita = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      const updatedCitas = citas.filter(cita => cita.id !== id);
      setCitas(updatedCitas);
      localStorage.setItem('citas', JSON.stringify(updatedCitas));
    }
  };

  // Actualizar anticipo en línea
  const updateAnticipo = (citaId: string, anticipoConfirmado: boolean, monto?: number) => {
    const servicio = servicios.find(s => s.id === citas.find(c => c.id === citaId)?.servicioId);
    const montoFinal = monto !== undefined ? monto : (servicio?.anticipoSugerido || 0);

    const updatedCitas = citas.map(cita =>
      cita.id === citaId
        ? {
            ...cita,
            anticipoConfirmado,
            montoAnticipo: anticipoConfirmado ? montoFinal : 0,
            estado: (cita.estado === 'pendiente' && anticipoConfirmado) ? 'confirmada' as const : cita.estado
          }
        : cita
    );

    setCitas(updatedCitas);
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
  };

  // Filtros
  const filteredCitas = useMemo(() => {
    return citas.filter(cita => {
      const searchMatch =
        !searchTerm ||
        getCliente(cita.clienteId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getServicio(cita.servicioId).nombre.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all' || cita.estado === statusFilter;
      const completadasMatch = showCompletadas || cita.estado !== 'completada';

      return searchMatch && statusMatch && completadasMatch;
    }).sort((a, b) => {
      // Ordenar por fecha y hora
      const dateA = new Date(`${a.fecha}T${a.hora}`);
      const dateB = new Date(`${b.fecha}T${b.hora}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [citas, searchTerm, statusFilter, showCompletadas]);

  const getEstadoColor = (estado: Cita['estado']) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'iniciada': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completada': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: Cita['estado']) => {
    switch (estado) {
      case 'pendiente': return <Clock size={16} />;
      case 'confirmada': return <CheckCircle size={16} />;
      case 'iniciada': return <Play size={16} />;
      case 'completada': return <CheckCircle size={16} />;
      case 'cancelada': return <XCircle size={16} />;
      default: return <Clock size={16} />;
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
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 justify-center"
          >
            <Plus size={20} />
            <span>Nueva Cita</span>
          </button>
        </div>

        {/* Estadísticas */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Citas Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{citasPendientes}</p>
              </div>
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-purple-600">{citasEnProceso}</p>
              </div>
              <Play size={24} className="text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-green-600">
                  ${ingresosMes.toLocaleString()}
                </p>
              </div>
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldos Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${saldosPendientes.toLocaleString()}
                </p>
              </div>
              <CreditCard size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="iniciada">Iniciadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>

            <button
              onClick={() => setShowCompletadas(!showCompletadas)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                showCompletadas
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showCompletadas ? 'Ocultar Completadas' : 'Mostrar Completadas'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      {filteredCitas.length > 0 ? (
        <div className="space-y-4">
          {filteredCitas.map(cita => {
            const servicio = getServicio(cita.servicioId);
            return (
              <div key={cita.id} className="bg-white rounded-lg shadow border p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Información principal */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {getCliente(cita.clienteId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scissors size={16} className="text-gray-400" />
                        <span className="text-gray-700">{servicio.nombre}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-gray-600 text-sm">
                          {formatDate(cita.fecha)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-600 text-sm">
                          {formatTime(cita.hora)}
                        </span>
                      </div>
                    </div>

                    {/* Información de precios y anticipo */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Precio sugerido:</span>
                          <div className="font-semibold text-green-600">
                            ${servicio.precioSugerido}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Anticipo sugerido:</span>
                          <div className="font-semibold text-blue-600">
                            ${servicio.anticipoSugerido}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Anticipo recibido:</span>
                          <div className={`font-semibold ${cita.anticipoConfirmado ? 'text-green-600' : 'text-gray-400'}`}>
                            ${cita.montoAnticipo || 0}
                          </div>
                        </div>
                        {/* Saldo pendiente calculado */}
                        {cita.estado !== 'completada' && (
                          <div>
                            <span className="text-gray-600">Saldo pendiente:</span>
                            <div className="font-semibold text-orange-600">
                              ${Math.max(0, servicio.precioSugerido - (cita.montoAnticipo || 0))}
                            </div>
                          </div>
                        )}
                        {cita.estado === 'completada' && (
                          <div>
                            <span className="text-gray-600">Precio final:</span>
                            <div className="font-semibold text-purple-600">
                              ${cita.precioFinal || 0}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Control de anticipo en línea */}
                      {!['completada', 'cancelada'].includes(cita.estado) && (
                        <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={cita.anticipoConfirmado}
                              onChange={(e) => updateAnticipo(cita.id, e.target.checked)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-700">
                              Anticipo confirmado
                            </label>
                          </div>
                          
                          {cita.anticipoConfirmado && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Monto:</span>
                              <input
                                type="number"
                                value={cita.montoAnticipo || 0}
                                onChange={(e) => updateAnticipo(cita.id, true, Number(e.target.value))}
                                className="w-24 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                min="0"
                                step="0.01"
                              />
                              <span className="text-sm text-gray-600">$</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {cita.notas && (
                      <p className="text-gray-600 text-sm italic bg-blue-50 p-2 rounded">
                        "{cita.notas}"
                      </p>
                    )}
                  </div>

                  {/* Estado y acciones */}
                  <div className="flex flex-col gap-3">
                    {/* Estado */}
                    <div className="flex items-center justify-center sm:justify-start">
                      <span className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${getEstadoColor(cita.estado)}`}>
                        {getEstadoIcon(cita.estado)}
                        {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                      </span>
                    </div>

                    {/* Acciones principales */}
                    <div className="flex flex-col gap-2">
                      {cita.estado === 'pendiente' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => changeEstadoCita(cita.id, 'cancelada')}
                            className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            title="Cancelar cita"
                          >
                            <XCircle size={14} className="inline mr-1" />
                            Cancelar
                          </button>
                          <button
                            onClick={() => openReagendarModal(cita)}
                            className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title="Reagendar cita"
                          >
                            <RefreshCw size={14} className="inline mr-1" />
                            Reagendar
                          </button>
                        </div>
                      )}

                      {cita.estado === 'confirmada' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => changeEstadoCita(cita.id, 'iniciada')}
                            className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                            title="Iniciar cita"
                          >
                            <Play size={16} className="inline mr-1" />
                            Iniciar
                          </button>
                        </div>
                      )}

                      {cita.estado === 'iniciada' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openCobroModal(cita)}
                            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            title="Terminar y cobrar"
                          >
                            <CheckCircle size={16} className="inline mr-1" />
                            Terminar
                          </button>
                        </div>
                      )}

                      {cita.estado === 'completada' && cita.saldoPendiente && cita.saldoPendiente > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                          <div className="flex items-center gap-1 text-orange-700 text-xs">
                            <AlertTriangle size={12} />
                            <span>Saldo pendiente: ${cita.saldoPendiente}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Acciones secundarias */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => openEditCitaModal(cita)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title="Editar cita"
                        disabled={cita.estado === 'completada'}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteCita(cita.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                        title="Eliminar cita"
                        disabled={cita.estado === 'iniciada'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay citas programadas
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza agregando tu primera cita.
          </p>
          <button 
            onClick={openNewCitaModal}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Programar Primera Cita
          </button>
        </div>
      )}

      {/* Modal para nueva/editar cita */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCita ? 'Editar Cita' : 'Nueva Cita'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    onChange={e => {
                      const servicioId = e.target.value;
                      const servicio = servicios.find(s => s.id === servicioId);
                      setFormData({ 
                        ...formData, 
                        servicioId,
                        montoAnticipo: servicio?.anticipoSugerido || 0
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar servicio</option>
                    {servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre} - ${servicio.precioSugerido}
                      </option>
                    ))}
                  </select>
                  {formData.servicioId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Anticipo sugerido: ${servicios.find(s => s.id === formData.servicioId)?.anticipoSugerido || 0}
                    </p>
                  )}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas adicionales sobre la cita..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Anticipo */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={formData.anticipoConfirmado}
                      onChange={e => setFormData({ ...formData, anticipoConfirmado: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Se recibió anticipo
                    </label>
                  </div>
                  
                  {formData.anticipoConfirmado && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Monto del anticipo
                        </label>
                        <input
                          type="number"
                          value={formData.montoAnticipo}
                          onChange={e => setFormData({ ...formData, montoAnticipo: Number(e.target.value) })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Método de pago del anticipo
                        </label>
                        <select
                          value={formData.metodoPagoAnticipo}
                          onChange={e => setFormData({ ...formData, metodoPagoAnticipo: e.target.value })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Seleccionar método</option>
                          <option value="efectivo">Efectivo</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Si se recibe anticipo, la cita se marcará automáticamente como "Confirmada"
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCita}
                  disabled={!isFormValid()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isFormValid()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingCita ? 'Actualizar' : 'Programar'} Cita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cobro final */}
      {isCobroModalOpen && citaCobrar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Finalizar y Cobrar Servicio
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Resumen de la cita */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Resumen del Servicio</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{getCliente(citaCobrar.clienteId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-medium">{getServicio(citaCobrar.servicioId).nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Anticipo pagado:</span>
                    <span className="font-medium text-blue-600">${citaCobrar.montoAnticipo || 0}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-2">
                    <span className="text-gray-600">Saldo a cobrar:</span>
                    <span className="font-bold text-orange-600">
                      ${Math.max(0, cobroData.precioFinal - (citaCobrar.montoAnticipo || 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Precio final */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Total del Servicio *
                  </label>
                  <input
                    type="number"
                    value={cobroData.precioFinal}
                    onChange={e => setCobroData({ ...cobroData, precioFinal: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio sugerido: ${getServicio(citaCobrar.servicioId).precioSugerido}
                  </p>
                </div>

                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago Final *
                  </label>
                  <select
                    value={cobroData.metodoPagoFinal}
                    onChange={e => setCobroData({ ...cobroData, metodoPagoFinal: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar método</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="mixto">Pago mixto</option>
                    <option value="pendiente">Queda pendiente</option>
                  </select>
                </div>

                {/* Notas adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas del Servicio
                  </label>
                  <textarea
                    value={cobroData.notas}
                    onChange={e => setCobroData({ ...cobroData, notas: e.target.value })}
                    placeholder="Observaciones del servicio realizado..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={completarCita}
                  disabled={!isCobroFormValid()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isCobroFormValid()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Completar Servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para reagendar */}
      {isReagendarModalOpen && citaReagendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reagendar Cita
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Información actual */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Cita actual:</h3>
                <p className="text-sm text-blue-700">
                  {getCliente(citaReagendar.clienteId)} - {getServicio(citaReagendar.servicioId).nombre}
                </p>
                <p className="text-sm text-blue-700">
                  {formatDate(citaReagendar.fecha)} a las {formatTime(citaReagendar.hora)}
                </p>
              </div>

              <div className="space-y-4">
                {/* Nueva fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Fecha *
                  </label>
                  <input
                    type="date"
                    value={reagendarData.fecha}
                    onChange={e => setReagendarData({ ...reagendarData, fecha: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Nueva hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Hora *
                  </label>
                  <input
                    type="time"
                    value={reagendarData.hora}
                    onChange={e => setReagendarData({ ...reagendarData, hora: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={reagendarCita}
                  disabled={!reagendarData.fecha || !reagendarData.hora}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    reagendarData.fecha && reagendarData.hora
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Reagendar Cita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}