// src/components/email/CampaignsTab.tsx - Sección de campañas con botón arreglado
import React, { useState, useEffect } from 'react';
import { Plus, Mail, Send, Calendar, Users, TrendingUp, Trash2, Edit, Eye } from 'lucide-react';

interface CampaignsTabProps {
  onNewCampaign: () => void;
  onEditCampaign: (campaign: any) => void;
  onDeleteCampaign: (campaignId: string) => void;
}

const CampaignsTab: React.FC<CampaignsTabProps> = ({
  onNewCampaign,
  onEditCampaign,
  onDeleteCampaign
}) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Cargar campañas
      const campaignsData = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);

      // Cargar clientes
      const clientsData = JSON.parse(localStorage.getItem('clientes') || '[]');
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setCampaigns([]);
      setClients([]);
    }
  };

  // Calcular estadísticas con validaciones de seguridad
  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c && c.estado === 'activa').length,
    sentCampaigns: campaigns.filter(c => c && c.estado === 'enviada').length,
    scheduledCampaigns: campaigns.filter(c => c && c.estado === 'programada').length,
    totalRecipients: campaigns.reduce((total, c) => {
      if (!c) return total;
      const destinatarios = c.destinatarios || c.recipients || [];
      return total + (Array.isArray(destinatarios) ? destinatarios.length : 0);
    }, 0),
    clientsWithEmail: clients.filter(c => c && c.email && c.email.trim() !== '').length
  };

  // Calcular tasa de éxito con validaciones
  const totalSentEmails = campaigns.reduce((total, c) => {
    if (!c) return total;
    const destinatarios = c.destinatarios || c.recipients || [];
    if (!Array.isArray(destinatarios)) return total;
    
    return total + destinatarios.filter(d => d && d.estado === 'enviado').length;
  }, 0);
  const successRate = stats.totalRecipients > 0 ? Math.round((totalSentEmails / stats.totalRecipients) * 100) : 0;

  const handleDeleteCampaign = (campaignId: string, campaignName: string) => {
    if (confirm(`¿Estás seguro de eliminar la campaña "${campaignName}"?`)) {
      onDeleteCampaign(campaignId);
      loadData(); // Recargar datos después de eliminar
    }
  };

  const getCampaignTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'cumpleanos': return 'bg-pink-100 text-pink-800';
      case 'promocional': return 'bg-purple-100 text-purple-800';
      case 'recordatorio': return 'bg-blue-100 text-blue-800';
      case 'seguimiento': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'cumpleanos': return 'Cumpleaños';
      case 'promocional': return 'Promocional';
      case 'recordatorio': return 'Recordatorio';
      case 'seguimiento': return 'Seguimiento';
      default: return tipo;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'enviada': return 'bg-green-100 text-green-800';
      case 'activa': return 'bg-blue-100 text-blue-800';
      case 'programada': return 'bg-orange-100 text-orange-800';
      case 'completada': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campañas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Campañas Activas</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 rounded-full border-2 border-green-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enviadas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.sentCampaigns}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Programadas</p>
              <p className="text-2xl font-bold text-orange-600">{stats.scheduledCampaigns}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Destinatarios</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.totalRecipients}</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users size={24} className="text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes con Email</p>
              <p className="text-2xl font-bold text-cyan-600">{stats.clientsWithEmail}</p>
            </div>
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Users size={24} className="text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-emerald-600">{successRate}%</p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Botón Nueva Campaña - ARREGLADO */}
      <div className="flex justify-end">
        <button
          onClick={onNewCampaign}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200"
        >
          <Plus size={20} />
          Nueva Campaña
        </button>
      </div>

      {/* Lista de Campañas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-8 text-center">
            <Mail size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay campañas creadas
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera campaña de email marketing para comenzar
            </p>
            <button
              onClick={onNewCampaign}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              Crear Primera Campaña
            </button>
          </div>
        ) : (
          <>
            {/* Header de la tabla */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Campaña</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-2">Destinatarios</div>
                <div className="col-span-2">Fecha</div>
                <div className="col-span-1">Acciones</div>
              </div>
            </div>

            {/* Filas de campañas */}
            <div className="divide-y divide-gray-200">
              {campaigns.map((campaign, index) => (
                <div key={campaign.id || index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="font-medium text-gray-900">
                        {campaign.nombre || campaign.name || 'Sin nombre'}
                      </div>
                      {campaign.asunto && (
                        <div className="text-sm text-gray-500 truncate">
                          {campaign.asunto}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCampaignTypeColor(campaign.tipo || campaign.type)}`}>
                        {getCampaignTypeLabel(campaign.tipo || campaign.type)}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.estado || 'borrador')}`}>
                        {campaign.estado === 'enviada' ? 'Enviada' :
                         campaign.estado === 'activa' ? 'Activa' :
                         campaign.estado === 'programada' ? 'Programada' :
                         campaign.estado === 'completada' ? 'Completada' :
                         'Borrador'}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          const destinatarios = campaign.destinatarios || campaign.recipients || [];
                          return Array.isArray(destinatarios) ? destinatarios.length : 0;
                        })()}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {campaign.fechaCreacion ? 
                          new Date(campaign.fechaCreacion).toLocaleDateString('es-ES') :
                          campaign.createdAt ?
                          new Date(campaign.createdAt).toLocaleDateString('es-ES') :
                          'Sin fecha'
                        }
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditCampaign(campaign)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id, campaign.nombre || campaign.name)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignsTab;