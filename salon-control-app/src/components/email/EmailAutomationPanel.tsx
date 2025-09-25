// src/components/email/EmailAutomationPanel.tsx
import { useState, useEffect } from 'react';
import { Bell, Clock, Mail, Settings } from 'lucide-react';
import { emailService } from '../../services/emailService';

interface AutomationSettings {
  confirmacionAutomatica: boolean;
  recordatorio24h: boolean;
  recordatorio2h: boolean;
  notificacionCambios: boolean;
  horaEnvio: string;
}

interface EmailAutomationPanelProps {
  onClose?: () => void;
}

export default function EmailAutomationPanel({ onClose }: EmailAutomationPanelProps) {
  const [settings, setSettings] = useState<AutomationSettings>({
    confirmacionAutomatica: true,
    recordatorio24h: true,
    recordatorio2h: false,
    notificacionCambios: true,
    horaEnvio: '09:00'
  });

  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Cargar configuración guardada
    const savedSettings = localStorage.getItem('emailAutomationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading automation settings:', error);
      }
    }

    // Verificar si el email está configurado
    const emailConfig = emailService.isConfigured();
    setIsConfigured(emailConfig.emailjs || emailConfig.resend);
  }, []);

  const updateSetting = (key: keyof AutomationSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('emailAutomationSettings', JSON.stringify(newSettings));
  };

  const resetToDefaults = () => {
    const defaultSettings: AutomationSettings = {
      confirmacionAutomatica: true,
      recordatorio24h: true,
      recordatorio2h: false,
      notificacionCambios: true,
      horaEnvio: '09:00'
    };
    setSettings(defaultSettings);
    localStorage.setItem('emailAutomationSettings', JSON.stringify(defaultSettings));
  };

  if (!isConfigured) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail size={24} className="text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-800">
            Email no configurado
          </h3>
        </div>
        <p className="text-orange-700 mb-4">
          Para usar la automatización de emails, primero debes configurar un proveedor de email.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Configurar Email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Automatización de Emails
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Confirmación automática */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Confirmación automática</h4>
            <p className="text-sm text-gray-600">
              Enviar email de confirmación cuando se crea una nueva cita
            </p>
          </div>
          <button
            onClick={() => updateSetting('confirmacionAutomatica', !settings.confirmacionAutomatica)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.confirmacionAutomatica ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.confirmacionAutomatica ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Recordatorio 24h */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Recordatorio 24 horas</h4>
            <p className="text-sm text-gray-600">
              Enviar recordatorio un día antes de la cita
            </p>
          </div>
          <button
            onClick={() => updateSetting('recordatorio24h', !settings.recordatorio24h)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.recordatorio24h ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.recordatorio24h ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Recordatorio 2h */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Recordatorio 2 horas</h4>
            <p className="text-sm text-gray-600">
              Enviar recordatorio 2 horas antes de la cita
            </p>
          </div>
          <button
            onClick={() => updateSetting('recordatorio2h', !settings.recordatorio2h)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.recordatorio2h ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.recordatorio2h ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Notificación de cambios */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Notificar cambios</h4>
            <p className="text-sm text-gray-600">
              Enviar email cuando se modifique una cita
            </p>
          </div>
          <button
            onClick={() => updateSetting('notificacionCambios', !settings.notificacionCambios)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notificacionCambios ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notificacionCambios ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Hora de envío */}
        {(settings.recordatorio24h || settings.recordatorio2h) && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={20} className="text-blue-600" />
              <h4 className="font-medium text-blue-900">Hora de envío de recordatorios</h4>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-blue-800">
                Enviar recordatorios a las:
              </label>
              <input
                type="time"
                value={settings.horaEnvio}
                onChange={(e) => updateSetting('horaEnvio', e.target.value)}
                className="border border-blue-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Los recordatorios se programarán para enviarse a esta hora
            </p>
          </div>
        )}

        {/* Información adicional */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">📋 Información importante</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Los emails se envían automáticamente según la configuración</li>
            <li>• Asegúrate de que los clientes tengan emails válidos registrados</li>
            <li>• Los recordatorios se programan basándose en la fecha y hora de la cita</li>
            <li>• Puedes deshabilitar cualquier automatización en cualquier momento</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <Settings size={16} />
            Restaurar por defecto
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cerrar
            </button>
          )}
        </div>

        {/* Estado actual */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              Automatización activa
            </span>
          </div>
          <div className="text-xs text-green-700 space-y-1">
            {settings.confirmacionAutomatica && <div>✓ Confirmaciones automáticas habilitadas</div>}
            {settings.recordatorio24h && <div>✓ Recordatorios 24h habilitados</div>}
            {settings.recordatorio2h && <div>✓ Recordatorios 2h habilitados</div>}
            {settings.notificacionCambios && <div>✓ Notificaciones de cambios habilitadas</div>}
          </div>
        </div>
      </div>
    </div>
  );
}