// src/components/email/CampaignModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import TemplatePreview from './TemplatePreview';
import ClientSelector from './ClientSelector';
import { Campaign, CampaignFormData } from '../../types/campaigns';

interface CampaignModalProps {
  campaign?: Campaign | null;
  clients: any[];
  onClose: () => void;
  onSave: () => void;
}

const PLANTILLAS_INICIALES = [
  {
    id: 'tpl_recordatorio_1',
    nombre: 'Recordatorio Básico',
    tipo: 'recordatorio',
    asunto: '⏰ Recordatorio: Tu cita es mañana - {{clienteName}}',
    contenido: 'Hola {{clienteName}}, este es un recordatorio...'
  },
  // Más plantillas...
];

export default function CampaignModal({ 
  campaign, 
  clients, 
  onClose, 
  onSave 
}: CampaignModalProps) {
  const [templates] = useState(PLANTILLAS_INICIALES);
  const [formData, setFormData] = useState<CampaignFormData>({
    nombre: '',
    tipo: 'promocional',
    asunto: '',
    plantilla: '',
    envioAutomatico: false,
    diasAntes: 1,
    horaEnvio: '10:00',
    filtroClientes: 'todos'
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  useEffect(() => {
    if (campaign) {
      setFormData({
        nombre: campaign.nombre,
        tipo: campaign.tipo,
        asunto: campaign.asunto,
        plantilla: campaign.plantilla,
        envioAutomatico: campaign.configuracion.envioAutomatico,
        diasAntes: campaign.configuracion.diasAntes || 1,
        horaEnvio: campaign.configuracion.horaEnvio || '10:00',
        filtroClientes: campaign.configuracion.filtroClientes || 'todos'
      });
    }
  }, [campaign]);

  const handleSave = () => {
    if (!formData.nombre || !formData.plantilla) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const newCampaign: Campaign = {
      id: campaign?.id || `camp_${Date.now()}`,
      nombre: formData.nombre,
      tipo: formData.tipo,
      estado: 'borrador',
      plantilla: formData.plantilla,
      asunto: formData.asunto,
      fechaCreacion: campaign?.fechaCreacion || new Date().toISOString(),
      destinatarios: getFilteredClientsCount(),
      enviadoA: campaign?.enviadoA || 0,
      tasaApertura: campaign?.tasaApertura || 0,
      configuracion: {
        envioAutomatico: formData.envioAutomatico,
        diasAntes: formData.diasAntes,
        horaEnvio: formData.horaEnvio,
        filtroClientes: formData.filtroClientes
      }
    };

    // Guardar en localStorage
    const campaigns = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
    const existingIndex = campaigns.findIndex((c: Campaign) => c.id === newCampaign.id);
    
    if (existingIndex >= 0) {
      campaigns[existingIndex] = newCampaign;
    } else {
      campaigns.push(newCampaign);
    }
    
    localStorage.setItem('emailCampaigns', JSON.stringify(campaigns));
    onSave();
  };

  const getFilteredClientsCount = () => {
    switch (formData.filtroClientes) {
      case 'cumpleanos':
        return clients.filter(c => {
          const mesActual = new Date().getMonth() + 1;
          const clientMonth = new Date(c.cumple).getMonth() + 1;
          return clientMonth === mesActual;
        }).length;
      case 'nuevos':
        const treintaDias = new Date();
        treintaDias.setDate(treintaDias.getDate() - 30);
        return clients.filter(c => 
          new Date(c.fechaRegistro || c.fechaCreacion || new Date()) > treintaDias
        ).length;
      case 'manual':
        return selectedClients.length;
      default:
        return clients.length;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {campaign ? 'Editar Campaña' : 'Nueva Campaña'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la campaña *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: Promoción de verano"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="promocional">Promocional</option>
                    <option value="recordatorio">Recordatorio</option>
                    <option value="confirmacion">Confirmación</option>
                    <option value="cumpleanos">Cumpleaños</option>
                    <option value="seguimiento">Seguimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plantilla *
                  </label>
                  <select
                    value={formData.plantilla}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      setFormData({
                        ...formData, 
                        plantilla: e.target.value,
                        asunto: template?.asunto || ''
                      });
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Seleccionar plantilla</option>
                    {templates
                      .filter(t => t.tipo === formData.tipo)
                      .map(template => (
                        <option key={template.id} value={template.id}>
                          {template.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto personalizado (opcional)
                </label>
                <input
                  type="text"
                  value={formData.asunto}
                  onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Dejar vacío para usar el asunto de la plantilla"
                />
              </div>

              <ClientSelector
                filtroTipo={formData.filtroClientes}
                onFiltroChange={(filtro) => setFormData({...formData, filtroClientes: filtro})}
                clients={clients}
                selectedClients={selectedClients}
                onSelectionChange={setSelectedClients}
              />

              {/* Configuración de envío */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.envioAutomatico}
                    onChange={(e) => setFormData({...formData, envioAutomatico: e.target.checked})}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Programar envío automático
                  </span>
                </label>
                
                {formData.envioAutomatico && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Días antes del evento
                      </label>
                      <input
                        type="number"
                        value={formData.diasAntes}
                        onChange={(e) => setFormData({...formData, diasAntes: Number(e.target.value)})}
                        className="w-full border rounded-lg px-3 py-2"
                        min="0"
                        max="30"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora de envío
                      </label>
                      <input
                        type="time"
                        value={formData.horaEnvio}
                        onChange={(e) => setFormData({...formData, horaEnvio: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vista previa */}
            <div>
              {formData.plantilla && (
                <TemplatePreview
                  templateId={formData.plantilla}
                  templates={templates}
                  customSubject={formData.asunto}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.nombre || !formData.plantilla}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
            >
              {campaign ? 'Actualizar' : 'Crear'} Campaña
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}