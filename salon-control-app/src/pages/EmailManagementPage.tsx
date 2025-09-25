// src/pages/EmailManagementPage.tsx - Página principal de gestión de emails

import React, { useState, useEffect } from 'react';
import { Mail, Settings, Users } from 'lucide-react';
import EmailCampaigns from '../components/email/EmailCampaigns';
import EmailConfig from '../components/email/EmailConfig';
import { useEmailConfig } from '../hooks/useEmailConfig';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  cumple: string;
  activo: boolean;
}

export default function EmailManagementPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'config'>('campaigns');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const { isConfigured } = useEmailConfig();

  // Cargar clientes desde localStorage
  useEffect(() => {
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    setClientes(clientesData.filter((c: Cliente) => c.activo));
  }, []);

  // Auto-redirect a configuración si no está configurado
  useEffect(() => {
    if (!isConfigured && activeTab === 'campaigns') {
      setActiveTab('config');
    }
  }, [isConfigured, activeTab]);

  const clientesConEmail = clientes.filter(c => c.email && c.email.trim() !== '');

  const tabs = [
    {
      id: 'campaigns' as const,
      label: 'Campañas',
      icon: Mail,
      disabled: !isConfigured
    },
    {
      id: 'config' as const,
      label: 'Configuración',
      icon: Settings,
      disabled: false
    }
  ];

  return (
    <div className="w-full max-w-none">
      {/* Header con pestañas */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Gestión de Email
        </h1>
        
        {/* Información rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
              </div>
              <Users size={24} className="text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Con Email</p>
                <p className="text-2xl font-bold text-blue-600">{clientesConEmail.length}</p>
              </div>
              <Mail size={24} className="text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">EmailJS</p>
                <p className={`text-sm font-medium ${isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {isConfigured ? 'Configurado' : 'No configurado'}
                </p>
              </div>
              <Settings size={24} className={isConfigured ? 'text-green-600' : 'text-red-600'} />
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : tab.disabled
                      ? 'border-transparent text-gray-300 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={tab.disabled}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="tab-content">
        {activeTab === 'campaigns' && (
          <EmailCampaigns clientes={clientes} />
        )}
        
        {activeTab === 'config' && (
          <EmailConfig />
        )}
      </div>

      {/* Mensaje de ayuda si no está configurado */}
      {!isConfigured && activeTab === 'campaigns' && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <Settings size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium text-sm">
                Configuración requerida
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Configura EmailJS para enviar campañas
              </p>
              <button
                onClick={() => setActiveTab('config')}
                className="text-yellow-600 hover:text-yellow-800 text-xs underline mt-1"
              >
                Ir a configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}