// src/pages/EmailCampaignsPage.tsx
import { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Send, 
  Users, 
  Calendar, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Settings
} from 'lucide-react';
import EmailAutomationSettings from '../components/email/EmailAutomationSettings';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  activo: boolean;
  cumple: string;
}

interface Servicio {
  id: string;
  nombre: string;
  precioSugerido: number;
}

interface Campaign {
  id: string;
  nombre: string;
  asunto: string;
  contenido: string;
  tipo: 'promocional' | 'recordatorio' | 'cumpleanos' | 'seguimiento';
  destinatarios: string[];
  fechaCreacion: string;
  fechaEnvio?: string;
  estado: 'borrador' | 'programada' | 'enviada' | 'cancelada';
  estadisticas?: {
    enviados: number;
    abiertos: number;
    clicks: number;
  };
}

interface CampaignFormData {
  nombre: string;
  asunto: string;
  contenido: string;
  tipo: 'promocional' | 'recordatorio' | 'cumpleanos' | 'seguimiento';
  destinatarios: string[];
}

const INITIAL_FORM_DATA: CampaignFormData = {
  nombre: '',
  asunto: '',
  contenido: '',
  tipo: 'promocional',
  destinatarios: []
};

const CAMPAIGN_TEMPLATES = {
  promocional: {
    asunto: '🌟 Oferta especial solo para ti - Beauty Salon',
    contenido: `¡Hola [NOMBRE_CLIENTE]! 👋

🌟 Tenemos una oferta especial solo para ti:

💫 20% de descuento en todos nuestros servicios
📅 Válido hasta fin de mes
🎁 Incluye tratamientos premium

¡Agenda tu cita ahora y aprovecha esta oportunidad única!

📞 Teléfono: +52 55 1234-5678
📍 Dirección: Calle Principal 123

¡Te esperamos!
Beauty Salon Total Control ✨`
  },
  cumpleanos: {
    asunto: '🎂 ¡Feliz cumpleaños! Tenemos un regalo especial para ti',
    contenido: `¡Feliz cumpleaños [NOMBRE_CLIENTE]! 🎉

En tu día especial, queremos consentirte:

🎁 50% de descuento en tu servicio favorito
💆‍♀️ Tratamiento de regalo incluido
🎂 Sorpresa especial el día de tu cita

📅 Válido durante todo tu mes de cumpleaños

¡Ven a celebrar con nosotros!

📞 Agenda tu cita: +52 55 1234-5678

Con cariño,
Beauty Salon Total Control 💖`
  },
  recordatorio: {
    asunto: '⏰ Recordatorio: Tu cita está próxima',
    contenido: `Hola [NOMBRE_CLIENTE] 👋

Te recordamos tu próxima cita:

📅 Fecha: [FECHA_CITA]
🕐 Hora: [HORA_CITA]
💅 Servicio: [SERVICIO]

💡 Recomendaciones:
• Llega 10 minutos antes
• Trae una foto de referencia si tienes una idea específica

¿Necesitas cambiar tu cita? Contáctanos con 24h de anticipación.

📞 +52 55 1234-5678

¡Te esperamos!
Beauty Salon Total Control ✨`
  },
  seguimiento: {
    asunto: '💖 ¿Cómo te sentiste con tu último servicio?',
    contenido: `Hola [NOMBRE_CLIENTE] 👋

Esperamos que hayas disfrutado tu último servicio con nosotros.

💭 Tu opinión es muy importante:
• ¿Qué tal tu experiencia?
• ¿El resultado fue el esperado?
• ¿Algo que podamos mejorar?

🌟 Como agradecimiento por tu tiempo:
15% de descuento en tu próxima visita

📞 Contáctanos: +52 55 1234-5678

¡Gracias por elegirnos!
Beauty Salon Total Control 💖`
  }
};

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(INITIAL_FORM_DATA);
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'automation'>('campaigns');

  // Cargar datos
  useEffect(() => {
    const campaignsData = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');

    setCampaigns(campaignsData);
    setClientes(clientesData.filter((c: Cliente) => c.activo && c.email));
    setServicios(serviciosData);
  }, []);

  // Guardar campañas
  const saveCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('emailCampaigns', JSON.stringify(newCampaigns));
  };

  // Abrir modal
  const openModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        nombre: campaign.nombre || '',
        asunto: campaign.asunto || '',
        contenido: campaign.contenido || '',
        tipo: campaign.tipo || 'promocional',
        destinatarios: campaign.destinatarios || []
      });
      setSelectedClientes(campaign.destinatarios || []);
    } else {
      setEditingCampaign(null);
      setFormData({ ...INITIAL_FORM_DATA });
      setSelectedClientes([]);
    }
    setIsModalOpen(true);
    setPreviewMode(false);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
    setFormData(INITIAL_FORM_DATA);
    setSelectedClientes([]);
    setPreviewMode(false);
  };

  // Actualizar form data
  const updateFormData = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value ?? (field === 'destinatarios' ? [] : '') 
    }));
  };

  // Aplicar plantilla
  const applyTemplate = (tipo: keyof typeof CAMPAIGN_TEMPLATES) => {
    const template = CAMPAIGN_TEMPLATES[tipo];
    setFormData(prev => ({
      ...prev,
      asunto: template.asunto,
      contenido: template.contenido
    }));
  };

  // Guardar campaña
  const saveCampaign = () => {
    if (!formData.nombre.trim() || !formData.asunto.trim() || !formData.contenido.trim()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (selectedClientes.length === 0) {
      alert('Selecciona al menos un destinatario');
      return;
    }

    const campaignData: Campaign = {
      id: editingCampaign?.id || `campaign_${Date.now()}`,
      nombre: formData.nombre.trim(),
      asunto: formData.asunto.trim(),
      contenido: formData.contenido.trim(),
      tipo: formData.tipo,
      destinatarios: selectedClientes,
      fechaCreacion: editingCampaign?.fechaCreacion || new Date().toISOString(),
      estado: 'borrador'
    };

    const updatedCampaigns = editingCampaign
      ? campaigns.map(c => c.id === editingCampaign.id ? campaignData : c)
      : [...campaigns, campaignData];

    saveCampaigns(updatedCampaigns);
    closeModal();

    alert(editingCampaign ? 'Campaña actualizada exitosamente' : 'Campaña creada exitosamente');
  };

  // Eliminar campaña
  const deleteCampaign = (campaign: Campaign) => {
    const confirmMessage = campaign.estado === 'enviada' 
      ? `¿Estás seguro de eliminar la campaña "${campaign.nombre}"? Esta campaña ya fue enviada y se perderá el historial.`
      : `¿Estás seguro de eliminar la campaña "${campaign.nombre}"?`;

    if (confirm(confirmMessage)) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaign.id);
      saveCampaigns(updatedCampaigns);
      alert('Campaña eliminada exitosamente');
    }
  };

  // Enviar campaña (simulado)
  const sendCampaign = (campaign: Campaign) => {
    if (confirm(`¿Enviar campaña "${campaign.nombre}" a ${campaign.destinatarios.length} destinatarios?`)) {
      const updatedCampaign: Campaign = {
        ...campaign,
        estado: 'enviada',
        fechaEnvio: new Date().toISOString(),
        estadisticas: {
          enviados: campaign.destinatarios.length,
          abiertos: 0,
          clicks: 0
        }
      };

      const updatedCampaigns = campaigns.map(c => 
        c.id === campaign.id ? updatedCampaign : c
      );

      saveCampaigns(updatedCampaigns);
      alert('Campaña enviada exitosamente');
    }
  };

  // Toggle cliente seleccionado
  const toggleCliente = (clienteId: string) => {
    setSelectedClientes(prev => 
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  // Seleccionar todos los clientes
  const selectAllClientes = () => {
    setSelectedClientes(clientes.map(c => c.id));
  };

  // Deseleccionar todos
  const deselectAllClientes = () => {
    setSelectedClientes([]);
  };

  // Filtrar clientes por criterios
  const getClientesByFilter = (filter: string) => {
    switch (filter) {
      case 'cumpleanos':
        const mesActual = new Date().getMonth() + 1;
        return clientes.filter(c => {
          const mesCumple = new Date(c.cumple + 'T00:00:00').getMonth() + 1;
          return mesCumple === mesActual;
        });
      case 'todos':
      default:
        return clientes;
    }
  };

  // Aplicar filtro de clientes
  const applyClientFilter = (filter: string) => {
    const filteredClientes = getClientesByFilter(filter);
    setSelectedClientes(filteredClientes.map(c => c.id));
  };

  // Obtener estadísticas
  const getStats = () => {
    const total = campaigns.length;
    const borradores = campaigns.filter(c => c.estado === 'borrador').length;
    const enviadas = campaigns.filter(c => c.estado === 'enviada').length;
    const totalDestinatarios = campaigns.reduce((sum, c) => sum + c.destinatarios.length, 0);

    return { total, borradores, enviadas, totalDestinatarios };
  };

  const stats = getStats();

  // Renderizar contenido del preview
  const renderPreviewContent = () => {
    let content = formData.contenido || '';
    
    // Si no hay contenido, mostrar mensaje por defecto
    if (!content.trim()) {
      return (
        <p className="text-gray-500 italic">No hay contenido para mostrar</p>
      );
    }
    
    // Reemplazar variables de ejemplo
    content = content
      .replace(/\[NOMBRE_CLIENTE\]/g, 'María García')
      .replace(/\[FECHA_CITA\]/g, 'Viernes 25 de Octubre')
      .replace(/\[HORA_CITA\]/g, '2:30 PM')
      .replace(/\[SERVICIO\]/g, 'Corte y Peinado');

    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2">{line}</p>
    ));
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Email Marketing
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus campañas y automatización de emails
          </p>
        </div>
        {activeTab === 'campaigns' && (
          <button
            onClick={() => openModal()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Campaña
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'campaigns'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail size={16} />
                Campañas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'automation'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                Automatización
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido según la tab activa */}
      {activeTab === 'campaigns' ? (
        <div>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Campañas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Mail size={24} className="text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Borradores</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.borradores}</p>
                </div>
                <Edit size={24} className="text-yellow-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enviadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.enviadas}</p>
                </div>
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Destinatarios</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalDestinatarios}</p>
                </div>
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* Lista de campañas */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Campañas</h2>
            </div>
            
            {campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay campañas creadas
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando tu primera campaña de email
                </p>
                <button
                  onClick={() => openModal()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Crear Primera Campaña
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{campaign.nombre}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.estado === 'borrador' ? 'bg-yellow-100 text-yellow-800' :
                            campaign.estado === 'enviada' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.estado === 'borrador' ? 'Borrador' :
                             campaign.estado === 'enviada' ? 'Enviada' : campaign.estado}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {campaign.tipo}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{campaign.asunto}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{campaign.destinatarios.length} destinatarios</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>
                              {campaign.fechaEnvio ? 
                                `Enviada: ${new Date(campaign.fechaEnvio).toLocaleDateString('es-ES')}` :
                                `Creada: ${new Date(campaign.fechaCreacion).toLocaleDateString('es-ES')}`
                              }
                            </span>
                          </div>
                        </div>

                        {campaign.estadisticas && (
                          <div className="mt-2 flex gap-4 text-sm">
                            <span className="text-green-600">
                              Enviados: {campaign.estadisticas.enviados}
                            </span>
                            <span className="text-blue-600">
                              Abiertos: {campaign.estadisticas.abiertos}
                            </span>
                            <span className="text-purple-600">
                              Clicks: {campaign.estadisticas.clicks}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setFormData({
                              nombre: campaign.nombre || '',
                              asunto: campaign.asunto || '',
                              contenido: campaign.contenido || '',
                              tipo: campaign.tipo || 'promocional',
                              destinatarios: campaign.destinatarios || []
                            });
                            setSelectedClientes(campaign.destinatarios || []);
                            setPreviewMode(true);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Ver campaña"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {campaign.estado === 'borrador' && (
                          <>
                            <button
                              onClick={() => openModal(campaign)}
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                              title="Editar campaña"
                            >
                              <Edit size={16} />
                            </button>
                            
                            <button
                              onClick={() => sendCampaign(campaign)}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                              title="Enviar campaña"
                            >
                              <Send size={16} />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => deleteCampaign(campaign)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Eliminar campaña"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab de Automatización */
        <EmailAutomationSettings />
      )}

      {/* Modal (solo para campañas) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {previewMode ? 'Vista Previa de Campaña' :
                   editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>

              {previewMode ? (
                /* Vista Previa */
                <div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Información de la Campaña</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Nombre:</span>
                        <span className="ml-2 font-medium">{formData.nombre}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tipo:</span>
                        <span className="ml-2 font-medium capitalize">{formData.tipo}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Asunto:</span>
                        <span className="ml-2 font-medium">{formData.asunto}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Destinatarios:</span>
                        <span className="ml-2 font-medium">{formData.destinatarios.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Contenido del Email</h3>
                    <div className="prose prose-sm max-w-none">
                      {renderPreviewContent()}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario de Edición */
                <div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda: Formulario */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de la Campaña *
                        </label>
                        <input
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => updateFormData('nombre', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Ej: Promoción de Octubre"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Campaña
                        </label>
                        <select
                          value={formData.tipo}
                          onChange={(e) => {
                            const tipo = e.target.value as keyof typeof CAMPAIGN_TEMPLATES;
                            updateFormData('tipo', tipo);
                            if (confirm('¿Aplicar plantilla para este tipo de campaña?')) {
                              applyTemplate(tipo);
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="promocional">Promocional</option>
                          <option value="recordatorio">Recordatorio</option>
                          <option value="cumpleanos">Cumpleaños</option>
                          <option value="seguimiento">Seguimiento</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Asunto del Email *
                        </label>
                        <input
                          type="text"
                          value={formData.asunto}
                          onChange={(e) => updateFormData('asunto', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Asunto atractivo para el email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contenido del Email *
                        </label>
                        <textarea
                          value={formData.contenido}
                          onChange={(e) => updateFormData('contenido', e.target.value)}
                          rows={12}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                          placeholder="Escribe el contenido de tu email aquí..."
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          <p>Variables disponibles:</p>
                          <p>[NOMBRE_CLIENTE] - Nombre del cliente</p>
                          <p>[FECHA_CITA] - Fecha de la cita (para recordatorios)</p>
                          <p>[HORA_CITA] - Hora de la cita (para recordatorios)</p>
                        </div>
                      </div>
                    </div>

                    {/* Columna derecha: Destinatarios */}
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destinatarios ({selectedClientes.length} seleccionados)
                        </label>
                        
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={selectAllClientes}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Todos
                          </button>
                          <button
                            onClick={deselectAllClientes}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Ninguno
                          </button>
                          <button
                            onClick={() => applyClientFilter('cumpleanos')}
                            className="px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                          >
                            Cumpleañeros
                          </button>
                        </div>
                      </div>

                      <div className="border rounded-lg max-h-96 overflow-y-auto">
                        {clientes.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <AlertCircle size={24} className="mx-auto mb-2" />
                            <p>No hay clientes con email registrado</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {clientes.map(cliente => (
                              <label
                                key={cliente.id}
                                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedClientes.includes(cliente.id)}
                                  onChange={() => toggleCliente(cliente.id)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-3"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{cliente.nombre}</div>
                                  <div className="text-sm text-gray-500">{cliente.email}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Vista Previa
                    </button>
                    <button
                      onClick={saveCampaign}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      {editingCampaign ? 'Actualizar' : 'Guardar'} Campaña
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}