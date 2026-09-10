import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { emailMarketingService } from '../services/emailMarketingService';
import { whatsappService } from '../services/whatsappService';
import { googleCalendarService } from '../services/googleCalendar';
import RespaldosTab from '../components/configuracion/RespaldosTab';

export default function ConfiguracionPage() {
  const { settings, updateSettings, loading } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswords, setShowPasswords] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  // Local state for form handling
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (settings) {
      setFormData({
        nombreSalon: settings.nombreSalon,
        telefono: settings.telefono,
        direccion: settings.direccion,
        email: settings.email,
        emailConfig: settings.emailConfig || { serviceId: '', templateId: '', publicKey: '' },
        googleCredentials: settings.googleCredentials || { clientId: '', apiKey: '' }
      });
    }
  }, [settings]);

  const handleSaveGeneral = async () => {
    await updateSettings({
      nombreSalon: formData.nombreSalon,
      telefono: formData.telefono,
      direccion: formData.direccion,
      email: formData.email
    });
    showSavedMessage('Configuración General Guardada');
  };

  const handleSaveEmail = async () => {
    await updateSettings({
      emailConfig: formData.emailConfig
    });
    await emailMarketingService.saveConfiguration(formData.emailConfig);
    showSavedMessage('Configuración Email Guardada');
  };

  const handleSaveGoogle = async () => {
    await updateSettings({
      googleCredentials: formData.googleCredentials
    });
    showSavedMessage('Configuración Google Calendar Guardada');
  };

  const handleGoogleSignIn = async () => {
    const success = await googleCalendarService.signIn();
    if (success) showSavedMessage('Google Calendar Conectado');
    else alert('Error al conectar con Google Calendar');
  };

  const showSavedMessage = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const getEmailStatus = () => {
    const conf = formData.emailConfig;
    return conf?.serviceId && conf?.templateId && conf?.publicKey;
  };

  if (loading) return <div>Cargando configuración...</div>;

  return (
    <div className="w-full max-w-none space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">Configura integraciones y datos del salón</p>
        </div>
        {savedMessage && (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            <CheckCircle size={16} />
            <span className="text-sm">{savedMessage}</span>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('general')} className={`pb-2 border-b-2 ${activeTab === 'general' ? 'border-purple-600' : 'border-transparent'}`}>General</button>
          <button onClick={() => setActiveTab('email')} className={`pb-2 border-b-2 ${activeTab === 'email' ? 'border-purple-600' : 'border-transparent'}`}>Email Marketing</button>
          <button onClick={() => setActiveTab('whatsapp')} className={`pb-2 border-b-2 ${activeTab === 'whatsapp' ? 'border-purple-600' : 'border-transparent'}`}>WhatsApp</button>
          <button onClick={() => setActiveTab('google')} className={`pb-2 border-b-2 ${activeTab === 'google' ? 'border-purple-600' : 'border-transparent'}`}>Google Calendar</button>
          <button onClick={() => setActiveTab('respaldos')} className={`pb-2 border-b-2 ${activeTab === 'respaldos' ? 'border-purple-600' : 'border-transparent'}`}>Datos y respaldos</button>
        </nav>
      </div>

      {activeTab === 'respaldos' && <RespaldosTab />}

      {activeTab === 'general' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="font-semibold text-lg">Información del Negocio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Salón</label>
              <input
                className="w-full border rounded p-2"
                value={formData.nombreSalon || ''}
                onChange={e => setFormData({ ...formData, nombreSalon: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                className="w-full border rounded p-2"
                value={formData.telefono || ''}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <input
                className="w-full border rounded p-2"
                value={formData.direccion || ''}
                onChange={e => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email de contacto</label>
              <input
                className="w-full border rounded p-2"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <button onClick={handleSaveGeneral} className="bg-purple-600 text-white px-4 py-2 rounded">
            <Save size={16} className="inline mr-2" /> Guardar
          </button>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex justify-between">
            <h3 className="font-semibold text-lg">Configuración EmailJS</h3>
            {getEmailStatus() ?
              <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Configurado</span> :
              <span className="text-orange-600 flex items-center gap-1"><AlertCircle size={16} /> Sin Configurar</span>
            }
          </div>

          <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
            Crea una cuenta en <a href="https://emailjs.com" target="_blank" className="underline font-bold">emailjs.com</a> y obtén tus credenciales.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service ID</label>
              <input
                className="w-full border rounded p-2"
                value={formData.emailConfig?.serviceId || ''}
                onChange={e => setFormData({
                  ...formData,
                  emailConfig: { ...formData.emailConfig, serviceId: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Template ID</label>
              <input
                className="w-full border rounded p-2"
                value={formData.emailConfig?.templateId || ''}
                onChange={e => setFormData({
                  ...formData,
                  emailConfig: { ...formData.emailConfig, templateId: e.target.value }
                })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Public Key</label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  className="w-full border rounded p-2 pr-10"
                  value={formData.emailConfig?.publicKey || ''}
                  onChange={e => setFormData({
                    ...formData,
                    emailConfig: { ...formData.emailConfig, publicKey: e.target.value }
                  })}
                />
                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-2.5 text-gray-400">
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button onClick={handleSaveEmail} className="bg-purple-600 text-white px-4 py-2 rounded">
            <Save size={16} className="inline mr-2" /> Guardar Email Config
          </button>
        </div>
      )}

      {activeTab === 'whatsapp' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="font-semibold text-lg">WhatsApp</h3>
          <p className="text-gray-600">Actualmente el sistema usa WhatsApp Web para enviar mensajes directamente desde tu navegador.</p>
          <div className="bg-green-50 p-4 rounded flex items-center gap-2 text-green-800">
            <CheckCircle size={20} />
            <span>WhatsApp Web está activo y listo para usar.</span>
          </div>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Prueba de Envío</h4>
            <div className="flex gap-2 max-w-md">
              <input
                placeholder="+52..."
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                className="border rounded p-2 flex-1"
              />
              <button
                onClick={() => whatsappService.sendTestMessage(testPhone)}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Test
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'google' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-gray-800">Sincronización con Google Calendar</h3>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${googleCalendarService.getSignInStatus() ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm font-medium">{googleCalendarService.getSignInStatus() ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-sm text-purple-800 space-y-2">
            <p className="font-bold">¿Cómo activar esta integración?</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Ve a <a href="https://console.cloud.google.com/" target="_blank" className="underline font-bold">Google Cloud Console</a>.</li>
              <li>Crea un proyecto y habilita la <strong>Google Calendar API</strong>.</li>
              <li>En "APIs & Services &gt; Credentials", crea una <strong>API Key</strong> y un <strong>OAuth 2.0 Client ID</strong> (Web application).</li>
              <li>Añade la URL de este sistema a los "Authorized JavaScript origins".</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="text"
                placeholder="Introducir API Key..."
                className="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.googleCredentials?.apiKey || ''}
                onChange={e => setFormData({
                  ...formData,
                  googleCredentials: { ...formData.googleCredentials, apiKey: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                placeholder="xxxxxx.apps.googleusercontent.com"
                className="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.googleCredentials?.clientId || ''}
                onChange={e => setFormData({
                  ...formData,
                  googleCredentials: { ...formData.googleCredentials, clientId: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={handleSaveGoogle}
              className="bg-purple-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-all font-bold"
            >
              <Save size={18} /> Guardar Credenciales
            </button>

            <button
              onClick={handleGoogleSignIn}
              className="bg-white text-gray-700 border-2 border-gray-200 px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all font-bold"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
              Conectar con Google
            </button>
          </div>

          <div className="pt-6 border-t">
            <h4 className="font-bold text-gray-800 mb-2">Información sobre Cristina y Auxiliares</h4>
            <p className="text-sm text-gray-500">
              Al conectar tu cuenta de Google, tus citas personales se sincronizarán con el calendario de **cristinaeborquez@gmail.com**.
              Para las auxiliares, puedes especificar un ID de calendario diferente en la sección de gestión de empleados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}