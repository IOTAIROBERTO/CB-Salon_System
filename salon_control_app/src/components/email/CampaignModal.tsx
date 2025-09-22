// src/components/email/CampaignModal.tsx - Con carga de datos reales
import React, { useState, useEffect } from 'react';
import { X, Save, Mail, AlertCircle } from 'lucide-react';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingCampaign?: any;
  clients?: any[];
  templates?: any[];
}

const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCampaign
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'promocional',
    templateId: '',
    subject: '',
    recipients: []
  });
  
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos reales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadRealData();
    }
  }, [isOpen]);

  const loadRealData = () => {
    try {
      setLoading(true);
      
      // Cargar clientes reales desde localStorage
      const clientsData = JSON.parse(localStorage.getItem('clientes') || '[]');
      const clientsWithEmail = clientsData.filter(client => 
        client && client.email && client.email.trim() !== '' && client.activo !== false
      );
      setClients(clientsWithEmail);
      
      // Cargar plantillas reales desde localStorage
      const templatesData = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
      setTemplates(templatesData);
      
      console.log('Clientes cargados:', clientsWithEmail.length);
      console.log('Plantillas cargadas:', templatesData.length);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setClients([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Configurar formulario cuando cambia la campaña editada
  useEffect(() => {
    if (isOpen && editingCampaign) {
      setFormData({
        name: editingCampaign.name || editingCampaign.nombre || '',
        type: editingCampaign.type || editingCampaign.tipo || 'promocional',
        templateId: editingCampaign.templateId || editingCampaign.plantillaId || '',
        subject: editingCampaign.subject || editingCampaign.asunto || '',
        recipients: editingCampaign.recipients || editingCampaign.destinatarios || []
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        type: 'promocional',
        templateId: '',
        subject: '',
        recipients: []
      });
    }
  }, [isOpen, editingCampaign]);

  // Actualizar asunto cuando se selecciona una plantilla
  useEffect(() => {
    if (formData.templateId && templates.length > 0) {
      const selectedTemplate = templates.find(t => t.id === formData.templateId);
      if (selectedTemplate && selectedTemplate.asunto) {
        setFormData(prev => ({ ...prev, subject: selectedTemplate.asunto }));
      }
    }
  }, [formData.templateId, templates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor ingresa un nombre para la campaña');
      return;
    }
    
    if (!formData.subject.trim()) {
      alert('Por favor ingresa un asunto para el email');
      return;
    }

    if (formData.recipients.length === 0) {
      alert('Por favor selecciona al menos un destinatario');
      return;
    }

    const campaignData = {
      ...formData,
      nombre: formData.name,
      asunto: formData.subject,
      tipo: formData.type,
      plantillaId: formData.templateId,
      destinatarios: formData.recipients.map(clientId => {
        const client = clients.find(c => c.id === clientId);
        return {
          clienteId: clientId,
          email: client?.email || '',
          nombre: client?.nombre || '',
          estado: 'pendiente'
        };
      })
    };

    onSave(campaignData);
  };

  const handleClientToggle = (clientId: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(clientId)
        ? prev.recipients.filter(id => id !== clientId)
        : [...prev.recipients, clientId]
    }));
  };

  const selectAllClients = () => {
    setFormData(prev => ({
      ...prev,
      recipients: clients.map(c => c.id)
    }));
  };

  const clearSelection = () => {
    setFormData(prev => ({
      ...prev,
      recipients: []
    }));
  };

  // Obtener plantillas filtradas por tipo
  const availableTemplates = templates.filter(template => 
    template && template.tipo === formData.type && template.activa !== false
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail size={24} className="text-purple-600" />
            {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Campaña *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Promoción de Verano"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Campaña *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value,
                      templateId: '', // Reset template when type changes
                      subject: '' // Reset subject
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="promocional">Promocional</option>
                    <option value="cumpleanos">Cumpleaños</option>
                    <option value="recordatorio">Recordatorio</option>
                    <option value="seguimiento">Seguimiento</option>
                  </select>
                </div>
              </div>

              {/* Selección de Plantilla */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plantilla de Email *
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Seleccionar plantilla</option>
                  {availableTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.nombre}
                    </option>
                  ))}
                </select>
                {availableTemplates.length === 0 && (
                  <p className="text-orange-600 text-sm mt-1">
                    No hay plantillas disponibles para este tipo de campaña. 
                    <br />Ve a la pestaña "Plantillas" para crear una.
                  </p>
                )}
              </div>

              {/* Asunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto del Email *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: ¡Oferta especial solo para ti!"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Se actualizará automáticamente al seleccionar una plantilla
                </p>
              </div>

              {/* Destinatarios */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Destinatarios ({formData.recipients.length} de {clients.length} seleccionados)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllClients}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Seleccionar todos
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                
                {clients.length > 0 ? (
                  <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                    {clients.map(client => (
                      <label
                        key={client.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={formData.recipients.includes(client.id)}
                          onChange={() => handleClientToggle(client.id)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{client.nombre}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="border border-orange-300 rounded-lg p-4 text-center bg-orange-50">
                    <AlertCircle size={24} className="mx-auto text-orange-600 mb-2" />
                    <p className="text-orange-800 font-medium">No hay clientes con email</p>
                    <p className="text-orange-700 text-sm">
                      Agrega emails a tus clientes en la sección "Clientes" para poder enviar campañas.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={clients.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                {editingCampaign ? 'Actualizar' : 'Crear'} Campaña
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CampaignModal;