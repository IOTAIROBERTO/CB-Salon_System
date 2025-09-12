import { useEffect, useState } from 'react';
import { Plus, Calendar, Clock, User, Scissors, X, Edit, DollarSign, CreditCard, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
}

interface ServicioCatalogo {
  id: string;
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
}

interface ServicioRealizado {
  id: string;
  citaId: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  precioCobrado: number;
  anticipoPagado: number;
  saldoPendiente: number;
  metodoPago: string;
  metodoPagoAnticipo: string;
  estado: 'confirmada' | 'completada' | 'cancelada';
  notas?: string;
  fechaCompletado?: string;
  fechaCancelado?: string;
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<ServicioRealizado[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogoServicios, setCatalogoServicios] = useState<ServicioCatalogo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioRealizado | null>(null);
  const [isReagendarModalOpen, setIsReagendarModalOpen] = useState(false);
  const [servicioReagendar, setServicioReagendar] = useState<ServicioRealizado | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    precioCobrado: 0,
    anticipoPagado: 0,
    metodoPago: '',
    metodoPagoAnticipo: '',
    estado: 'confirmada' as const,
    notas: ''
  });

  // Estado para reagendar
  const [reagendarData, setReagendarData] = useState({
    fecha: '',
    hora: ''
  });

  useEffect(() => {
    const serviciosData = JSON.parse(localStorage.getItem('serviciosRealizados') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const catalogoData = JSON.parse(localStorage.getItem('servicios') || '[]');

    setServicios(serviciosData);
    setClientes(clientesData);
    setCatalogoServicios(catalogoData);
  }, []);

  // Funciones auxiliares
  const getCliente = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Cliente no encontrado';
  const getServicioCatalogo = (id: string) => catalogoServicios.find(s => s.id === id)?.nombre || 'Servicio no encontrado';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular estadísticas
  const totalServicios = servicios.length;
  const serviciosCompletados = servicios.filter(s => s.estado === 'completada').length;
  const ingresosTotales = servicios
    .filter(s => s.estado === 'completada')
    .reduce((sum, s) => sum + s.precioCobrado, 0);
  const saldosPendientes = servicios
    .filter(s => s.estado !== 'cancelada')
    .reduce((sum, s) => sum + s.saldoPendiente, 0);

  // Manejar cambios en formulario
  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  // Abrir modal para editar servicio
  const openEditModal = (servicio: ServicioRealizado) => {
    setFormData({
      precioCobrado: servicio.precioCobrado,
      anticipoPagado: servicio.anticipoPagado,
      metodoPago: servicio.metodoPago || '',
      metodoPagoAnticipo: servicio.metodoPagoAnticipo || '',
      estado: servicio.estado,
      notas: servicio.notas || ''
    });
    setEditingServicio(servicio);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServicio(null);
    setFormData({
      precioCobrado: 0,
      anticipoPagado: 0,
      metodoPago: '',
      metodoPagoAnticipo: '',
      estado: 'confirmada',
      notas: ''
    });
  };

  // Guardar cambios del servicio
  const saveServicio = () => {
    if (!editingServicio) return;

    const saldoPendiente = formData.precioCobrado - formData.anticipoPagado;
    const now = new Date().toISOString();

    const updatedServicio = {
      ...editingServicio,
      precioCobrado: formData.precioCobrado,
      anticipoPagado: formData.anticipoPagado,
      saldoPendiente: Math.max(0, saldoPendiente),
      metodoPago: formData.metodoPago,
      metodoPagoAnticipo: formData.metodoPagoAnticipo,
      estado: formData.estado,
      notas: formData.notas,
      fechaCompletado: formData.estado === 'completada' ? now : editingServicio.fechaCompletado,
      fechaCancelado: formData.estado === 'cancelada' ? now : editingServicio.fechaCancelado
    };

    const updatedServicios = servicios.map(s =>
      s.id === editingServicio.id ? updatedServicio : s
    );

    setServicios(updatedServicios);
    localStorage.setItem('serviciosRealizados', JSON.stringify(updatedServicios));
    closeModal();

    alert('Servicio actualizado exitosamente');
  };

  // Abrir modal de reagendar
  const openReagendarModal = (servicio: ServicioRealizado) => {
    setReagendarData({
      fecha: servicio.fecha,
      hora: servicio.hora
    });
    setServicioReagendar(servicio);
    setIsReagendarModalOpen(true);
  };

  // Reagendar servicio
  const reagendarServicio = () => {
    if (!servicioReagendar) return;

    const updatedServicio = {
      ...servicioReagendar,
      fecha: reagendarData.fecha,
      hora: reagendarData.hora
    };

    const updatedServicios = servicios.map(s =>
      s.id === servicioReagendar.id ? updatedServicio : s
    );

    const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
    const updatedCitas = citasData.map((cita: any) =>
      cita.id === servicioReagendar.citaId
        ? { ...cita, fecha: reagendarData.fecha, hora: reagendarData.hora }
        : cita
    );

    setServicios(updatedServicios);
    localStorage.setItem('serviciosRealizados', JSON.stringify(updatedServicios));
    localStorage.setItem('citas', JSON.stringify(updatedCitas));

    setIsReagendarModalOpen(false);
    setServicioReagendar(null);

    alert('Servicio reagendado exitosamente');
  };

  const getEstadoColor = (estado: ServicioRealizado['estado']) => {
    switch (estado) {
      case 'confirmada': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Gestión de Servicios
          </h1>
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

      {/* Lista de servicios */}
      {servicios.length > 0 ? (
        <div className="grid gap-4">
          {servicios.map(servicio => (
            <div key={servicio.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {getCliente(servicio.clienteId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scissors size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        {getServicioCatalogo(servicio.servicioId)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {formatDate(servicio.fecha)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {formatTime(servicio.hora)}
                      </span>
                    </div>
                  </div>

                  {/* Información de pago */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Precio: </span>
                        <span className="font-semibold text-green-600">
                          ${servicio.precioCobrado}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Anticipo: </span>
                        <span className="font-semibold text-blue-600">
                          ${servicio.anticipoPagado}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Saldo: </span>
                        <span className={`font-semibold ${
                          servicio.saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          ${servicio.saldoPendiente}
                        </span>
                      </div>
                    </div>

                    {(servicio.metodoPago || servicio.metodoPagoAnticipo) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {servicio.metodoPagoAnticipo && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Anticipo: {servicio.metodoPagoAnticipo}
                          </span>
                        )}
                        {servicio.metodoPago && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Total: {servicio.metodoPago}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {servicio.notas && (
                    <p className="text-gray-600 text-sm italic">
                      "{servicio.notas}"
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Estado */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(servicio.estado)}`}>
                    {servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)}
                  </span>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    {servicio.estado === 'confirmada' && (
                      <button
                        onClick={() => openReagendarModal(servicio)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title="Reagendar"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(servicio)}
                      className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                      title="Editar servicio"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Scissors size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay servicios registrados
          </h3>
          <p className="text-gray-600 mb-4">
            Los servicios se crean automáticamente al confirmar citas
          </p>
        </div>
      )}

      {/* Modal para editar servicio */}
      {isModalOpen && editingServicio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Editar Servicio
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Formulario de edición */}
              {/* ... */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveServicio}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para reagendar */}
      {isReagendarModalOpen && servicioReagendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reagendar Servicio</h2>
              <div className="space-y-4">
                <input
                  type="date"
                  value={reagendarData.fecha}
                  onChange={(e) => setReagendarData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full border px-3 py-2 rounded-lg"
                  min={new Date().toISOString().split('T')[0]}
                />
                <input
                  type="time"
                  value={reagendarData.hora}
                  onChange={(e) => setReagendarData(prev => ({ ...prev, hora: e.target.value }))}
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsReagendarModalOpen(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={reagendarServicio}
                  disabled={!reagendarData.fecha || !reagendarData.hora}
                  className={`px-4 py-2 rounded-lg ${
                    reagendarData.fecha && reagendarData.hora
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Reagendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
