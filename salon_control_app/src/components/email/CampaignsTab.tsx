// src/components/email/CampaignsTab.tsx
import { useState, useEffect } from 'react';
import { Mail, Plus, Play, Send, Users, Edit, Trash2 } from 'lucide-react';
import CampaignModal from './CampaignModal';
import CampaignStats from './CampaignStats';
import { Campaign } from '../../types/campaigns';

interface CampaignsTabProps {
  clients: any[];
  isEmailConfigured: boolean;
  onReloadClients: () => void;
}

export default function CampaignsTab({ 
  clients, 
  isEmailConfigured, 
  onReloadClients 
}: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = () => {
    const campaignsData = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
    setCampaigns(campaignsData);
  };

  const deleteCampaign = (campaignId: string) => {
    if (!confirm('¿Eliminar esta campaña?')) return;
    
    const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
    setCampaigns(updatedCampaigns);
    localStorage.setItem('emailCampaigns', JSON.stringify(updatedCampaigns));
  };

  const editCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCampaign(null);
    loadCampaigns(); // Recargar después de crear/editar
  };

  const getTipoLabel = (tipo: Campaign['tipo']) => {
    const tipos = {
      recordatorio: 'Recordatorio',
      confirmacion: 'Confirmación',
      promocional: 'Promocional',
      cumpleanos: 'Cumpleaños',
      seguimiento: 'Seguimiento'
    };
    return tipos[tipo];
  };

  const getStatusColor = (estado: Campaign['estado']) => {
    switch (estado) {
      case 'activa': return 'text-green-600 bg-green-100';
      case 'pausada': return 'text-yellow-600 bg-yellow-100';
      case 'completada': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <CampaignStats campaigns={campaigns} clients={clients} />

      {/* Botón nueva campaña */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          disabled={!isEmailConfigured}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          title={!isEmailConfigured ? 'Configure EmailJS primero' : 'Crear nueva campaña'}
        >
          <Plus size={20} />
          Nueva Campaña
        </button>
      </div>

      {/* Lista de campañas */}
      <div className="bg-white rounded-lg shadow">
        {campaigns.length === 0 ? (
          <div className="p-8 text-center">
            <Mail size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay campañas creadas
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera campaña de email marketing
            </p>
            <button
              onClick={() => setShowModal(true)}
              disabled={!isEmailConfigured}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Crear primera campaña
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaña</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatarios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{campaign.nombre}</div>
                        <div className="text-sm text-gray-500">{campaign.plantilla}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {getTipoLabel(campaign.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.estado)}`}>
                        {campaign.estado.charAt(0).toUpperCase() + campaign.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.destinatarios}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => editCampaign(campaign)}
                          className="text-blue-600 hover:text-blue-900 p-1" 
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900 p-1" 
                          title="Eliminar"
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
        )}
      </div>

      {/* Modal de campaña */}
      {showModal && (
        <CampaignModal
          campaign={editingCampaign}
          clients={clients}
          onClose={handleModalClose}
          onSave={handleModalClose}
        />
      )}
    </div>
  );
}