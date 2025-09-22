// src/pages/EmailCampaignsPage.tsx - Página completa con todas las secciones
import React, { useState } from 'react';
import { Mail, FileText, Bot } from 'lucide-react';
import CampaignsTab from '../components/email/CampaignsTab';
import TemplatesTab from '../components/email/TemplatesTab';
import CampaignModal from '../components/email/CampaignModal';

const EmailCampaignsPage = () => {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Datos mockeados para que funcione inmediatamente
  const mockClients = [
    {
      id: 'c1',
      nombre: 'Ana López',
      email: 'ana@example.com',
      activo: true
    },
    {
      id: 'c2',
      nombre: 'María García',
      email: 'maria@example.com',
      activo: true
    },
    {
      id: 'c3',
      nombre: 'Carmen Rodriguez',
      email: 'carmen@example.com',
      activo: true
    }
  ];

  const mockTemplates = [
    {
      id: 't1',
      tipo: 'promocional',
      nombre: 'Promoción General',
      asunto: '¡Oferta especial para ti {{NOMBRE}}!',
      activa: true
    },
    {
      id: 't2',
      tipo: 'cumpleanos',
      nombre: 'Feliz Cumpleaños',
      asunto: '🎂 ¡Feliz Cumpleaños {{NOMBRE}}!',
      activa: true
    },
    {
      id: 't3',
      tipo: 'recordatorio',
      nombre: 'Recordatorio de Cita',
      asunto: '⏰ Recordatorio: Tu cita es mañana',
      activa: true
    }
  ];

  // Manejar nueva campaña
  const handleNewCampaign = () => {
    console.log('Abriendo modal para nueva campaña');
    setEditingCampaign(null);
    setShowModal(true);
  };

  // Manejar edición de campaña
  const handleEditCampaign = (campaign) => {
    console.log('Editando campaña:', campaign);
    setEditingCampaign(campaign);
    setShowModal(true);
  };

  // Manejar eliminación de campaña
  const handleDeleteCampaign = (campaignId) => {
    console.log('Eliminando campaña:', campaignId);
    try {
      const campaigns = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
      localStorage.setItem('emailCampaigns', JSON.stringify(updatedCampaigns));
      
      // Recargar la página o actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error('Error eliminando campaña:', error);
    }
  };

  // Manejar guardado de campaña
  const handleSaveCampaign = (campaignData) => {
    console.log('Guardando campaña:', campaignData);
    
    try {
      const campaigns = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
      
      if (editingCampaign) {
        // Actualizar campaña existente
        const updatedCampaigns = campaigns.map(c => 
          c.id === editingCampaign.id ? { ...c, ...campaignData } : c
        );
        localStorage.setItem('emailCampaigns', JSON.stringify(updatedCampaigns));
        alert('Campaña actualizada exitosamente');
      } else {
        // Nueva campaña
        const newCampaign = {
          ...campaignData,
          id: `campaign_${Date.now()}`,
          fechaCreacion: new Date().toISOString(),
          estado: 'borrador'
        };
        campaigns.push(newCampaign);
        localStorage.setItem('emailCampaigns', JSON.stringify(campaigns));
        alert('Nueva campaña creada exitosamente');
      }
      
      // Cerrar modal
      setShowModal(false);
      setEditingCampaign(null);
      
      // Recargar para mostrar cambios
      window.location.reload();
      
    } catch (error) {
      console.error('Error guardando campaña:', error);
      alert('Error al guardar la campaña');
    }
  };

  // Manejar cierre de modal
  const handleCloseModal = () => {
    console.log('Cerrando modal');
    setShowModal(false);
    setEditingCampaign(null);
  };

  const tabs = [
    { id: 'campaigns', label: 'Campañas', icon: Mail },
    { id: 'templates', label: 'Plantillas', icon: FileText },
    { id: 'automation', label: 'Automatizaciones', icon: Bot }
  ];

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Email Marketing
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona campañas, plantillas y automatizaciones de email
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'campaigns' && (
          <CampaignsTab
            onNewCampaign={handleNewCampaign}
            onEditCampaign={handleEditCampaign}
            onDeleteCampaign={handleDeleteCampaign}
          />
        )}
        
        {activeTab === 'templates' && (
          <TemplatesTab />
        )}
        
        {activeTab === 'automation' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Automatizaciones</h3>
            <p className="text-gray-600">Sección de automatizaciones en desarrollo...</p>
          </div>
        )}
      </div>

      {/* Modal de Campaña */}
      {showModal && (
        <CampaignModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveCampaign}
          editingCampaign={editingCampaign}
          clients={mockClients}
          templates={mockTemplates}
        />
      )}

      {/* Debug info - remover en producción */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs">
          Modal: {showModal ? 'Abierto' : 'Cerrado'} | 
          Editando: {editingCampaign ? 'Sí' : 'No'}
        </div>
      )}
    </div>
  );
};

export default EmailCampaignsPage;