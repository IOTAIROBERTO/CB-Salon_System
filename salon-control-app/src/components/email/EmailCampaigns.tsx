// src/components/EmailCampaigns.tsx - Componente completo de campañas de email

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Send, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar,
  Gift,
  Star,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
import { emailService, type CampaignEmail } from '../services/emailService';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  cumple: string;
  activo: boolean;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  message: string;
  type: 'promocion' | 'cumpleanos' | 'recordatorio' | 'newsletter';
  recipients: Array<{
    clienteId: string;
    clienteName: string;
    email: string;
  }>;
  createdAt: string;
  sentAt?: string;
  status: 'draft' | 'sent' | 'sending';
  stats?: {
    sent: number;
    failed: number;
  };
}

interface EmailCampaignsProps {
  clientes: Cliente[];
}

const CAMPAIGN_TYPES = {
  promocion: { icon: Star, label: 'Promoción', color: 'bg-yellow-100 text-yellow-800' },
  cumpleanos: { icon: Gift, label: 'Cumpleaños', color: 'bg-pink-100 text-pink-800' },
  recordatorio: { icon: Calendar, label: 'Recordatorio', color: 'bg-blue-100 text-blue-800' },
  newsletter: { icon: Mail, label: 'Newsletter', color: 'bg-purple-100 text-purple-800' }
};

export default function EmailCampaigns({ clientes }: EmailCampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [recipientsModal, setRecipientsModal] = useState<Campaign | null>(null);
  const [sendingStatus, setSendingStatus] = useState<{ [key: string]: boolean }>({});
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    type: 'promocion' as Campaign['type'],
    selectedClients: [] as string[]
  });

  // Cargar campañas desde localStorage
  useEffect(() => {
    const savedCampaigns = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
    setCampaigns(savedCampaigns);
  }, []);

  // Guardar campañas en localStorage
  const saveCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('emailCampaigns', JSON.stringify(newCampaigns));
  };

  // Filtrar clientes con email
  const clientesConEmail = clientes.filter(c => c.email && c.email.trim() !== '' && c.activo);

  // Crear nueva campaña
  const handleCreateCampaign = () => {
    if (!formData.name || !formData.subject || !formData.message || formData.selectedClients.length === 0) {
      alert('Por favor completa todos los campos y selecciona al menos un destinatario');
      return;
    }

    const recipients = formData.selectedClients.map(clienteId => {
      const cliente = clientes.find(c => c.id === clienteId);
      return {
        clienteId,
        clienteName: cliente?.nombre || '',
        email: cliente?.email || ''
      };
    });

    const newCampaign: Campaign = {
      id: `campaign_${Date.now()}`,
      name: formData.name,
      subject: formData.subject,
      message: formData.message,
      type: formData.type,
      recipients,
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    saveCampaigns([...campaigns, newCampaign]);
    resetForm();
    setIsCreating(false);
  };

  // Actualizar campaña existente
  const handleUpdateCampaign = () => {
    if (!editingCampaign || !formData.name || !formData.subject || !formData.message) {
      alert('Por favor completa todos los campos');
      return;
    }

    const recipients = formData.selectedClients.map(clienteId => {
      const cliente = clientes.find(c => c.id === clienteId);
      return {
        clienteId,
        clienteName: cliente?.nombre || '',
        email: cliente?.email || ''
      };
    });

    const updatedCampaigns = campaigns.map(c => 
      c.id === editingCampaign.id 
        ? {
            ...c,
            name: formData.name,
            subject: formData.subject,
            message: formData.message,
            type: formData.type,
            recipients
          }
        : c
    );

    saveCampaigns(updatedCampaigns);
    resetForm();
    setEditingCampaign(null);
  };

  // Enviar campaña
  const handleSendCampaign = async (campaign: Campaign) => {
    if (campaign.recipients.length === 0) {
      alert('No hay destinatarios para enviar la campaña');
      return;
    }

    const confirmSend = confirm(`¿Enviar campaña "${campaign.name}" a ${campaign.recipients.length} destinatario(s)?`);
    if (!confirmSend) return;

    setSendingStatus(prev => ({ ...prev, [campaign.id]: true }));

    // Actualizar estado de la campaña a "enviando"
    const updatedCampaigns = campaigns.map(c => 
      c.id === campaign.id ? { ...c, status: 'sending' as const } : c
    );
    saveCampaigns(updatedCampaigns);

    let sentCount = 0;
    let failedCount = 0;

    // Enviar emails a todos los destinatarios
    for (const recipient of campaign.recipients) {
      try {
        const emailData: CampaignEmail = {
          to: recipient.email,
          clienteName: recipient.clienteName,
          subject: campaign.subject,
          message: campaign.message,
          type: campaign.type
        };

        const result = await emailService.sendCampaignEmail(emailData);
        
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          console.error(`Error enviando a ${recipient.email}:`, result.error);
        }

        // Pequeña pausa entre envíos para no saturar
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failedCount++;
        console.error(`Error enviando a ${recipient.email}:`, error);
      }
    }

    // Actualizar campaña con resultados
    const finalCampaigns = campaigns.map(c => 
      c.id === campaign.id 
        ? {
            ...c,
            status: 'sent' as const,
            sentAt: new Date().toISOString(),
            stats: { sent: sentCount, failed: failedCount }
          }
        : c
    );
    
    saveCampaigns(finalCampaigns);
    setSendingStatus(prev => ({ ...prev, [campaign.id]: false }));

    alert(`Campaña enviada: ${sentCount} exitosos, ${failedCount} fallidos`);
  };

  // Reenviar campaña (duplicar y permitir editar)
  const handleResendCampaign = (campaign: Campaign) => {
    setFormData({
      name: `${campaign.name} (Copia)`,
      subject: campaign.subject,
      message: campaign.message,
      type: campaign.type,
      selectedClients: campaign.recipients.map(r => r.clienteId)
    });
    setIsCreating(true);
  };

  // Eliminar campaña
  const handleDeleteCampaign = (campaignId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) return;
    
    const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
    saveCampaigns(updatedCampaigns);
  };

  // Editar campaña
  const handleEditCampaign = (campaign: Campaign) => {
    if (campaign.status === 'sent') {
      alert('No se puede editar una campaña ya enviada. Usa "Reenviar" para crear una copia.');
      return;
    }

    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      message: campaign.message,
      type: campaign.type,
      selectedClients: campaign.recipients.map(r => r.clienteId)
    });
    setEditingCampaign(campaign);
    setIsCreating(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      message: '',
      type: 'promocion',
      selectedClients: []
    });
  };

  // Cerrar modales
  const handleCloseForm = () => {
    setIsCreating(false);
    setEditingCampaign(null);
    resetForm();
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Componente de tarjeta de campaña
  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const [showRecipients, setShowRecipients] = useState(false);
    const TypeIcon = CAMPAIGN_TYPES[campaign.type].icon;
    const isSending = sendingStatus[campaign.id];

    return (
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TypeIcon size={16} className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${CAMPAIGN_TYPES[campaign.type].color}`}>
                {CAMPAIGN_TYPES[campaign.type].label}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
            
            {/* Estado de la campaña */}
            <div className="flex items-center gap-2 mb-2">
              {campaign.status === 'draft' && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  Borrador
                </span>
              )}
              {campaign.status === 'sending' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1">
                  <Loader size={12} className="animate-spin" />
                  Enviando
                </span>
              )}
              {campaign.status === 'sent' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  Enviada
                </span>
              )}
            </div>

            {/* Información de destinatarios */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={14} />
              <span>{campaign.recipients.length} destinatario(s)</span>
              <button
                onClick={() => setShowRecipients(!showRecipients)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {showRecipients ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showRecipients ? 'Ocultar' : 'Ver'}
              </button>
            </div>

            {/* Lista desplegable de destinatarios */}
            {showRecipients && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Destinatarios:</span>
                  <button
                    onClick={() => setRecipientsModal(campaign)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Ver detalles
                  </button>
                </div>
                <div className="space-y-1">
                  {campaign.recipients.slice(0, 3).map((recipient, index) => (
                    <div key={index} className="text-gray-600">
                      • {recipient.clienteName}
                    </div>
                  ))}
                  {campaign.recipients.length > 3 && (
                    <div className="text-gray-500 italic">
                      ... y {campaign.recipients.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Estadísticas de envío */}
            {campaign.stats && (
              <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                <div className="flex justify-between">
                  <span>Enviados: {campaign.stats.sent}</span>
                  <span>Fallidos: {campaign.stats.failed}</span>
                </div>
              </div>
            )}

            {/* Fecha de creación y envío */}
            <div className="mt-2 text-xs text-gray-500">
              <div>Creada: {new Date(campaign.createdAt).toLocaleDateString('es-ES')}</div>
              {campaign.sentAt && (
                <div>Enviada: {new Date(campaign.sentAt).toLocaleDateString('es-ES')} a las {new Date(campaign.sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={() => setPreviewCampaign(campaign)}
              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
              title="Vista previa"
            >
              <Eye size={16} />
            </button>

            {campaign.status === 'draft' && (
              <>
                <button
                  onClick={() => handleEditCampaign(campaign)}
                  className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleSendCampaign(campaign)}
                  disabled={isSending}
                  className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded disabled:opacity-50"
                  title="Enviar"
                >
                  {isSending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </>
            )}

            {campaign.status === 'sent' && (
              <button
                onClick={() => handleResendCampaign(campaign)}
                className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded"
                title="Reenviar"
              >
                <RefreshCw size={16} />
              </button>
            )}

            <button
              onClick={() => handleDeleteCampaign(campaign.id)}
              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Campañas de Email
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona y envía campañas de email a tus clientes
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Campaña
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Campañas</div>
          <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Enviadas</div>
          <div className="text-2xl font-bold text-green-600">
            {campaigns.filter(c => c.status === 'sent').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Borradores</div>
          <div className="text-2xl font-bold text-yellow-600">
            {campaigns.filter(c => c.status === 'draft').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Clientes con Email</div>
          <div className="text-2xl font-bold text-blue-600">{clientesConEmail.length}</div>
        </div>
      </div>

      {/* Lista de campañas */}
      <div className="space-y-4">
        {campaigns.length > 0 ? (
          campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Mail size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay campañas creadas
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera campaña de email para comenzar
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Crear Primera Campaña
            </button>
          </div>
        )}
      </div>

      {/* Modal de creación/edición */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre de la campaña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Campaña *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Promoción de Verano 2024"
                  />
                </div>

                {/* Tipo de campaña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Campaña *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.entries(CAMPAIGN_TYPES).map(([key, type]) => (
                      <option key={key} value={key}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asunto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto del Email *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleFormChange('subject', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: ¡Oferta especial solo para ti!"
                  />
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleFormChange('message', e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Escribe tu mensaje aquí. Puedes usar HTML para formato..."
                  />
                </div>

                {/* Selección de destinatarios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatarios * ({formData.selectedClients.length} seleccionados)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {clientesConEmail.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <input
                            type="checkbox"
                            checked={formData.selectedClients.length === clientesConEmail.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleFormChange('selectedClients', clientesConEmail.map(c => c.id));
                              } else {
                                handleFormChange('selectedClients', []);
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Seleccionar todos
                          </span>
                        </div>
                        {clientesConEmail.map(cliente => (
                          <div key={cliente.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.selectedClients.includes(cliente.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleFormChange('selectedClients', [...formData.selectedClients, cliente.id]);
                                } else {
                                  handleFormChange('selectedClients', formData.selectedClients.filter(id => id !== cliente.id));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">{cliente.nombre}</span>
                            <span className="text-xs text-gray-500">({cliente.email})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle size={32} className="mx-auto text-yellow-500 mb-2" />
                        <p className="text-sm text-gray-600">
                          No hay clientes con email registrado
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingCampaign ? 'Actualizar' : 'Crear'} Campaña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vista previa */}
      {previewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Vista Previa: {previewCampaign.name}
                </h2>
                <button
                  onClick={() => setPreviewCampaign(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asunto:</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{previewCampaign.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje:</label>
                  <div 
                    className="border rounded-lg p-4 bg-gray-50 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewCampaign.message }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatarios ({previewCampaign.recipients.length}):
                  </label>
                  <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                    {previewCampaign.recipients.map((recipient, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        • {recipient.clienteName} ({recipient.email})
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setPreviewCampaign(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de destinatarios detallado */}
      {recipientsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Destinatarios de "{recipientsModal.name}"
                </h3>
                <button
                  onClick={() => setRecipientsModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recipientsModal.recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <Users size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{recipient.clienteName}</div>
                      <div className="text-sm text-gray-600">{recipient.email}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => setRecipientsModal(null)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}