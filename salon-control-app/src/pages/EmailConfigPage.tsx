// src/pages/EmailConfigPage.tsx
import { useState } from 'react';
import { Mail, Bell, Settings as SettingsIcon } from 'lucide-react';
import EmailIntegration from '../components/email/EmailIntegration';
import EmailAutomationPanel from '../components/email/EmailAutomationPanel';

export default function EmailConfigPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'automation'>('config');

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Configuración de Email
        </h1>
        <p className="text-gray-600">
          Configura el envío automático de emails para confirmaciones y recordatorios
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail size={16} />
                Configuración de Proveedor
              </div>
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'automation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell size={16} />
                Automatización
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'config' && (
          <div>
            <EmailIntegration />
          </div>
        )}
        
        {activeTab === 'automation' && (
          <div>
            <EmailAutomationPanel />
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <SettingsIcon size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">
              Guía de Configuración
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>1. Configuración del Proveedor:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• <strong>EmailJS (Gratuito):</strong> Ideal para empezar, hasta 200 emails/mes</li>
                <li>• <strong>Resend (Profesional):</strong> Para uso intensivo, dominio personalizado</li>
              </ul>
              
              <p><strong>2. Automatización:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• <strong>Confirmación automática:</strong> Se envía al crear una cita</li>
                <li>• <strong>Recordatorio 24h:</strong> Se envía un día antes de la cita</li>
                <li>• <strong>Recordatorio 2h:</strong> Se envía 2 horas antes de la cita</li>
                <li>• <strong>Notificación de cambios:</strong> Se envía al modificar una cita</li>
              </ul>

              <p><strong>3. Requisitos:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Los clientes deben tener emails válidos registrados</li>
                <li>• Configura primero el proveedor antes de habilitar automatización</li>
                <li>• Prueba el envío antes de activar recordatorios automáticos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}