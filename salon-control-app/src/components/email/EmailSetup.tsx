// src/components/email/EmailSetup.tsx
import { useState } from 'react';
import { Settings, Mail, MessageCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface EmailSetupProps {
  onConfigUpdate: (config: any) => void;
}

export default function EmailSetup({ onConfigUpdate }: EmailSetupProps) {
  const [activeMethod, setActiveMethod] = useState<'emailjs' | 'whatsapp' | 'none'>('none');
  const [emailjsConfig, setEmailjsConfig] = useState({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });

  const [testEmail, setTestEmail] = useState('');
  const [isTestingSend, setIsTestingSend] = useState(false);

  const handleSaveConfig = () => {
    const config = {
      method: activeMethod,
      emailjs: emailjsConfig
    };
    
    localStorage.setItem('emailConfig', JSON.stringify(config));
    onConfigUpdate(config);
    alert('Configuración guardada exitosamente');
  };

  const testEmailSend = async () => {
    if (!testEmail) {
      alert('Por favor ingresa un email de prueba');
      return;
    }

    setIsTestingSend(true);
    
    try {
      if (activeMethod === 'emailjs') {
        // Cargar EmailJS
        if (!window.emailjs) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
          await new Promise((resolve) => {
            script.onload = resolve;
            document.head.appendChild(script);
          });
          window.emailjs.init(emailjsConfig.publicKey);
        }

        // Enviar email de prueba
        await window.emailjs.send(
          emailjsConfig.serviceId,
          emailjsConfig.templateId,
          {
            to_email: testEmail,
            to_name: 'Usuario de Prueba',
            subject: 'Email de Prueba - Beauty Salon',
            message: 'Este es un mensaje de prueba del sistema de email marketing.',
            from_name: 'Beauty Salon Total Control'
          }
        );
        
        alert('Email de prueba enviado exitosamente');
      }
    } catch (error) {
      console.error('Error enviando email de prueba:', error);
      alert('Error enviando email de prueba. Verifica la configuración.');
    } finally {
      setIsTestingSend(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} className="text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Configuración de Envío</h3>
      </div>

      {/* Selección de método */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Método de envío
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              activeMethod === 'emailjs' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveMethod('emailjs')}
          >
            <Mail size={24} className="text-purple-600 mb-2" />
            <h4 className="font-medium">EmailJS</h4>
            <p className="text-sm text-gray-600">Envío real de emails</p>
          </div>

          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              activeMethod === 'whatsapp' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveMethod('whatsapp')}
          >
            <MessageCircle size={24} className="text-green-600 mb-2" />
            <h4 className="font-medium">WhatsApp Web</h4>
            <p className="text-sm text-gray-600">Envío por WhatsApp</p>
          </div>

          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              activeMethod === 'none' ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveMethod('none')}
          >
            <AlertTriangle size={24} className="text-gray-600 mb-2" />
            <h4 className="font-medium">Solo Simulación</h4>
            <p className="text-sm text-gray-600">Para desarrollo</p>
          </div>
        </div>
      </div>

      {/* Configuración EmailJS */}
      {activeMethod === 'emailjs' && (
        <div className="border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-purple-800 mb-4">Configuración EmailJS</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service ID
              </label>
              <input
                type="text"
                value={emailjsConfig.serviceId}
                onChange={(e) => setEmailjsConfig(prev => ({ ...prev, serviceId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="service_xxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template ID
              </label>
              <input
                type="text"
                value={emailjsConfig.templateId}
                onChange={(e) => setEmailjsConfig(prev => ({ ...prev, templateId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="template_xxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Public Key
              </label>
              <input
                type="text"
                value={emailjsConfig.publicKey}
                onChange={(e) => setEmailjsConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="xxxxxxxxxx"
              />
            </div>

            {/* Prueba de envío */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-2">Probar Envío</h5>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2"
                  placeholder="tu-email@ejemplo.com"
                />
                <button
                  onClick={testEmailSend}
                  disabled={isTestingSend || !emailjsConfig.serviceId || !emailjsConfig.templateId || !emailjsConfig.publicKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isTestingSend ? 'Enviando...' : 'Probar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información WhatsApp */}
      {activeMethod === 'whatsapp' && (
        <div className="border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-green-800 mb-2">WhatsApp Web</h4>
          <p className="text-sm text-green-700">
            Los mensajes se abrirán en WhatsApp Web. Asegúrate de que tus clientes tengan números de teléfono registrados.
          </p>
        </div>
      )}

      {/* Información de simulación */}
      {activeMethod === 'none' && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-800 mb-2">Modo Simulación</h4>
          <p className="text-sm text-gray-700">
            Los emails no se enviarán realmente. Útil para desarrollo y pruebas.
          </p>
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-yellow-800 mb-2">📋 Instrucciones para EmailJS:</h4>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Crea una cuenta gratuita en <a href="https://www.emailjs.com" target="_blank" className="underline">emailjs.com</a></li>
          <li>Configura un servicio de email (Gmail, Outlook, etc.)</li>
          <li>Crea un template con las variables: to_email, to_name, subject, message, from_name</li>
          <li>Copia los IDs y la clave pública aquí</li>
          <li>Prueba el envío antes de usar</li>
        </ol>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <CheckCircle size={16} />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}