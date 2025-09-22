// src/pages/EmailCampaignsPage.tsx - Versión refactorizada
import { useState, useEffect } from 'react';
import { Mail, Settings, Bot, FileText, Plus } from 'lucide-react';
import CampaignsTab from '../components/email/CampaignsTab';
import TemplatesTab from '../components/email/TemplatesTab';
import AutomationsTab from '../components/email/AutomationsTab';
import { emailService } from '../services/emailService';

export default function EmailCampaignsPage() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [clients, setClients] = useState<any[]>([]);
  const [isEmailConfigured, setIsEmailConfigured] = useState(false);

  useEffect(() => {
    loadClients();
    checkEmailConfiguration();
  }, []);

  const loadClients = () => {
    const clientsData = JSON.parse(localStorage.getItem('clientes') || '[]');
    setClients(clientsData.filter((c: any) => c.activo && c.email));
  };

  const checkEmailConfiguration = () => {
    const config = emailService.isConfigured();
    setIsEmailConfigured(config.emailjs);
  };

  const tabs = [
    { id: 'campaigns', label: 'Campañas', icon: Mail },
    { id: 'templates', label: 'Plantillas', icon: FileText },
    { id: 'automations', label: 'Automatizaciones', icon: Bot }
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

      {/* Configuración requerida */}
      {!isEmailConfigured && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={20} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-800">
              Configuración requerida
            </h3>
          </div>
          <p className="text-orange-700 text-sm">
            Para enviar emails, configura EmailJS en Configuración → Email Marketing.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'campaigns' && (
        <CampaignsTab 
          clients={clients} 
          isEmailConfigured={isEmailConfigured}
          onReloadClients={loadClients}
        />
      )}

      {activeTab === 'templates' && (
        <TemplatesTab />
      )}

      {activeTab === 'automations' && (
        <AutomationsTab />
      )}
    </div>
  );
}