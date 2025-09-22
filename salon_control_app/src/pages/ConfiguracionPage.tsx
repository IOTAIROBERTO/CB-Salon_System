// src/pages/ConfiguracionPage.tsx
import { useState, useEffect } from 'react';
import { Save, Mail, MessageCircle, Calendar, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { emailService } from '../services/emailService';
import { whatsappService } from '../services/whatsappService';

interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  fromEmail: string;
  fromName: string;
}

interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromWhatsApp: string;
}

interface GeneralConfig {
  salonName: string;
  salonPhone: string;
  salonAddress: string;
  timezone: string;
  currency: string;
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    serviceId: '',
    templateId: '',
    publicKey: '',
    fromEmail: '',
    fromName: ''
  });
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    accountSid: '',
    authToken: '',
    fromWhatsApp: ''
  });
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({
    salonName: 'Beauty Salon Total Control',
    salonPhone: '+52 55 1234-5678',
    salonAddress: 'Calle Principal 123, Col. Centro',
    timezone: 'America/Mexico_City',
    currency: 'MXN'
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = () => {
    // Cargar configuraciones desde localStorage
    const emailConf = JSON.parse(localStorage.getItem('emailConfig') || '{}');
    const whatsappConf = JSON.parse(localStorage.getItem('whatsappConfig') || '{}');
    const generalConf = JSON.parse(localStorage.getItem('generalConfig') || '{}');

    setEmailConfig({ ...emailConfig, ...emailConf });
    setWhatsappConfig({ ...whatsappConfig, ...whatsappConf });
    setGeneralConfig({ ...generalConfig, ...generalConf });
  };

  const saveEmailConfig = () => {
    localStorage.setItem('emailConfig', JSON.stringify(emailConfig));
    showSavedMessage('Configuración de email guardada');
  };

  const saveWhatsAppConfig = () => {
    localStorage.setItem('whatsappConfig', JSON.stringify(whatsappConfig));
    showSavedMessage('Configuración de WhatsApp guardada');
  };

  const saveGeneralConfig = () => {
    localStorage.setItem('generalConfig', JSON.stringify(generalConfig));
    showSavedMessage('Configuración general guardada');
  };

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const testEmailService = async () => {
    if (!testEmail) {
      alert('Por favor ingresa un email para la prueba');
      return;
    }

    try {
      const result = await emailService.sendTestMessage(testEmail);
      if (result) {
        alert('Email de prueba enviado exitosamente');
      } else {
        alert('Error al enviar email de prueba. Verifica tu configuración.');
      }
    } catch (error) {
      alert('Error al enviar email de prueba');
    }
  };

  const testWhatsAppService = async () => {
    if (!testPhone) {
      alert('Por favor ingresa un número para la prueba');
      return;
    }

    try {
      const result = await whatsappService.sendTestMessage(testPhone);
      if (result.success) {
        alert(`Mensaje de prueba enviado usando ${result.method}`);
      } else {
        alert('Error al enviar mensaje de prueba');
      }
    } catch (error) {
      alert('Error al enviar mensaje de prueba');
    }
  };

  const getEmailStatus = () => {
    const isConfigured = emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey;
    return isConfigured;
  };

  const getWhatsAppStatus = () => {
    return true; // WhatsApp Web siempre está disponible
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 mt-1">
            Configura las integraciones y servicios del salón
          </p>
        </div>
        {savedMessage && (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            <CheckCircle size={16} />
            <span className="text-sm">{savedMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: Save },
            { id: 'email', label: 'Email Marketing', icon: Mail },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
          ].map((tab) => (
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
      <div className="bg-white rounded-lg shadow p-6">
        {/* General Configuration */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Salón</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Salón
                  </label>
                  <input
                    type="text"
                    value={generalConfig.salonName}
                    onChange={(e) => setGeneralConfig({...generalConfig, salonName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={generalConfig.salonPhone}
                    onChange={(e) => setGeneralConfig({...generalConfig, salonPhone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={generalConfig.salonAddress}
                    onChange={(e) => setGeneralConfig({...generalConfig, salonAddress: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona Horaria
                  </label>
                  <select
                    value={generalConfig.timezone}
                    onChange={(e) => setGeneralConfig({...generalConfig, timezone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="America/Mexico_City">Ciudad de México</option>
                    <option value="America/Tijuana">Tijuana</option>
                    <option value="America/Monterrey">Monterrey</option>
                    <option value="America/Cancun">Cancún</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    value={generalConfig.currency}
                    onChange={(e) => setGeneralConfig({...generalConfig, currency: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="MXN">Peso Mexicano (MXN)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={saveGeneralConfig}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Save size={16} />
                Guardar Configuración General
              </button>
            </div>
          </div>
        )}

        {/* Email Configuration */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Configuración de EmailJS</h3>
              <div className="flex items-center gap-2">
                {getEmailStatus() ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={16} />
                    <span className="text-sm">Configurado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle size={16} />
                    <span className="text-sm">Sin configurar</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Cómo configurar EmailJS:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Ve a <a href="https://emailjs.com" target="_blank" className="underline">emailjs.com</a> y crea una cuenta gratuita</li>
                <li>Crea un nuevo servicio de email (Gmail, Outlook, etc.)</li>
                <li>Crea una plantilla de email en EmailJS</li>
                <li>Copia el Service ID, Template ID y Public Key aquí abajo</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service ID *
                </label>
                <input
                  type="text"
                  value={emailConfig.serviceId}
                  onChange={(e) => setEmailConfig({...emailConfig, serviceId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="service_xxxxxxx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template ID *
                </label>
                <input
                  type="text"
                  value={emailConfig.templateId}
                  onChange={(e) => setEmailConfig({...emailConfig, templateId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="template_xxxxxxx"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={emailConfig.publicKey}
                    onChange={(e) => setEmailConfig({...emailConfig, publicKey: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                    placeholder="Tu public key de EmailJS"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del remitente
                </label>
                <input
                  type="email"
                  value={emailConfig.fromEmail}
                  onChange={(e) => setEmailConfig({...emailConfig, fromEmail: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="salon@tudominio.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del remitente
                </label>
                <input
                  type="text"
                  value={emailConfig.fromName}
                  onChange={(e) => setEmailConfig({...emailConfig, fromName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Beauty Salon"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={saveEmailConfig}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Save size={16} />
                Guardar Configuración
              </button>
              
              {getEmailStatus() && (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                    placeholder="email@prueba.com"
                  />
                  <button
                    onClick={testEmailService}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Mail size={16} />
                    Probar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Configuration */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Configuración de WhatsApp</h3>
              <div className="flex items-center gap-2">
                {getWhatsAppStatus() ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={16} />
                    <span className="text-sm">WhatsApp Web disponible</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle size={16} />
                    <span className="text-sm">Sin configurar</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-green-900 mb-2">📱 Opciones de WhatsApp:</h4>
              <div className="text-sm text-green-800 space-y-2">
                <div className="font-medium">1. WhatsApp Web (Disponible ahora):</div>
                <p>• Abre automáticamente WhatsApp Web con el mensaje predefinido</p>
                <p>• No requiere configuración adicional</p>
                <p>• Funciona desde cualquier dispositivo</p>
                
                <div className="font-medium mt-3">2. Twilio API (Opcional - Avanzado):</div>
                <p>• Envío automático de mensajes sin intervención manual</p>
                <p>• Requiere cuenta de Twilio y verificación de número</p>
                <p>• Ideal para automatización completa</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Configuración Avanzada - Twilio (Opcional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account SID
                  </label>
                  <input
                    type="text"
                    value={whatsappConfig.accountSid}
                    onChange={(e) => setWhatsappConfig({...whatsappConfig, accountSid: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="ACxxxxxxxxxxxxxxx"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auth Token
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={whatsappConfig.authToken}
                      onChange={(e) => setWhatsappConfig({...whatsappConfig, authToken: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                      placeholder="Tu auth token de Twilio"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de WhatsApp (Twilio)
                  </label>
                  <input
                    type="tel"
                    value={whatsappConfig.fromWhatsApp}
                    onChange={(e) => setWhatsappConfig({...whatsappConfig, fromWhatsApp: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="whatsapp:+14155238886"
                  />
                </div>
              </div>
              
              <button
                onClick={saveWhatsAppConfig}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Save size={16} />
                Guardar Configuración Twilio
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2 flex-1">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                  placeholder="+52 55 1234 5678"
                />
                <button
                  onClick={testWhatsAppService}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <MessageCircle size={16} />
                  Probar WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}