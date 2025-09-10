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

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Notificaciones
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');

  // Integraciones
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [emailConfig, setEmailConfig] = useState({ emailjs: false, resend: false });
  const [isInitializing, setIsInitializing] = useState(true);

  // Configuración WhatsApp
  const [whatsappConfig] = useState({
    twilio: false,
    whatsappBusiness: false,
    whatsappWeb: false
  });

  // Formulario
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

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
      const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
      const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');

      setCitas(citasData);
      setClientes(clientesData);
      setServicios(serviciosData);

      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

      try {
        const googleInitialized = await googleCalendarService.initialize();
        if (googleInitialized) {
          setIsGoogleSignedIn(googleCalendarService.getSignInStatus());
        }
      } catch (error) {
        console.error('Error initializing Google Calendar:', error);
      }

      setEmailConfig(emailService.isConfigured());
      setIsInitializing(false);
    };

    loadData();
  }, []);

  // Programar recordatorios por email
  useEffect(() => {
    citas.forEach(cita => {
      const cliente = clientes.find(c => c.id === cita.clienteId);
      const servicio = servicios.find(s => s.id === cita.servicioId);

      if (!cliente?.email || !servicio || cita.estado === 'cancelada' || cita.estado === 'completada') {
        return;
      }

      const citaDateTime = new Date(`${cita.fecha}T${cita.hora}`);
      const now = new Date();

      const reminderDate = new Date(citaDateTime.getTime() - 24 * 60 * 60 * 1000);

      if (reminderDate > now) {
        emailService.scheduleReminder(
          {
            to: cliente.email,
            clienteName: cliente.nombre,
            servicioNombre: servicio.nombre,
            fecha: cita.fecha,
            hora: cita.hora,
            notas: cita.notas,
            type: 'recordatorio'
          },
          reminderDate
        );
      }
    });
  }, [citas, clientes, servicios]);

  const handleGoogleSignIn = async () => {
    try {
      const success = await googleCalendarService.signIn();
      setIsGoogleSignedIn(success);
      if (success) {
        alert('¡Conectado con Google Calendar exitosamente!');
      }
    } catch (error) {
      alert('Error al conectar con Google Calendar.');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleCalendarService.signOut();
      setIsGoogleSignedIn(false);
      alert('Desconectado de Google Calendar');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const syncWithGoogleCalendar = async (cita: Cita, isUpdate = false): Promise<string | null> => {
    if (!isGoogleSignedIn) return null;

    try {
      const cliente = clientes.find(c => c.id === cita.clienteId);
      const servicio = servicios.find(s => s.id === cita.servicioId);

      if (!cliente || !servicio) return null;

      const calendarEvent = googleCalendarService.citaToCalendarEvent(cita, cliente, servicio);

      if (isUpdate && cita.googleEventId) {
        const success = await googleCalendarService.updateEvent(cita.googleEventId, calendarEvent);
        return success ? cita.googleEventId : null;
      } else {
        return await googleCalendarService.createEvent(calendarEvent);
      }
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      return null;
    }
  };

  const sendEmailNotification = async (cita: Cita, type: 'confirmacion' | 'cambio') => {
    const cliente = clientes.find(c => c.id === cita.clienteId);
    const servicio = servicios.find(s => s.id === cita.servicioId);

    if (!cliente?.email || !servicio) return false;

    try {
      return await emailService.sendReminder({
        to: cliente.email,
        clienteName: cliente.nombre,
        servicioNombre: servicio.nombre,
        fecha: cita.fecha,
        hora: cita.hora,
        notas: cita.notas,
        type
      });
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

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

  // **Función corregida**
  const saveCita = async () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedCitas;
    let googleEventId = null;

    try {
      if (editingCita) {
        const updatedCita = { ...editingCita, ...formData };

        if (formData.syncWithGoogle && isGoogleSignedIn) {
          googleEventId = await syncWithGoogleCalendar(updatedCita, true);
          if (googleEventId) {
            updatedCita.googleEventId = googleEventId;
          }
        }

        updatedCitas = citas.map(cita =>
          cita.id === editingCita.id ? updatedCita : cita
        );

        if (formData.sendEmailReminder && (emailConfig.emailjs || emailConfig.resend)) {
          await sendEmailNotification(updatedCita, 'cambio');
        }
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

        if (formData.syncWithGoogle && isGoogleSignedIn) {
          googleEventId = await syncWithGoogleCalendar(newCita);
          if (googleEventId) {
            newCita.googleEventId = googleEventId;
          }
        }

        updatedCitas = [...citas, newCita];

        if (formData.sendEmailReminder && (emailConfig.emailjs || emailConfig.resend)) {
          const emailSent = await sendEmailNotification(newCita, 'confirmacion');
          newCita.emailSent = emailSent;
        }
      }

      setCitas(updatedCitas);
      localStorage.setItem('citas', JSON.stringify(updatedCitas));
      closeModal();

      let successMessage = editingCita ? 'Cita actualizada' : 'Cita creada';
      if (googleEventId) successMessage += ' y sincronizada con Google Calendar';
      if (formData.sendEmailReminder) successMessage += ' y email enviado';

      alert(successMessage + ' exitosamente!');
    } catch (error) {
      console.error('Error saving cita:', error);
      alert('Error al guardar la cita. Intenta de nuevo.');
    }
  };

  // Cambiar estado
  const changeEstado = async (id: string, newEstado: Cita['estado']) => {
    try {
      const cita = citas.find(c => c.id === id);
      if (!cita) return;

      const updatedCita = { ...cita, estado: newEstado };

      if (cita.googleEventId && isGoogleSignedIn) {
        await syncWithGoogleCalendar(updatedCita, true);
      }

      const updatedCitas = citas.map(c =>
        c.id === id ? updatedCita : c
      );

      setCitas(updatedCitas);
      localStorage.setItem('citas', JSON.stringify(updatedCitas));

      if ((emailConfig.emailjs || emailConfig.resend) && newEstado === 'confirmada') {
        await sendEmailNotification(updatedCita, 'cambio');
      }
    } catch (error) {
      console.error('Error changing cita status:', error);
    }
  };

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
