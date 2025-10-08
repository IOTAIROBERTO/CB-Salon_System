// src/components/email/config/EmailIntegration.tsx
// CONSOLIDADO: EmailConfig + EmailIntegration + EmailSetup
import { useState, useEffect } from 'react';
import { 
  Mail, Settings, AlertTriangle, CheckCircle, 
  RefreshCw, Eye, EyeOff, Save, TestTube, ExternalLink 
} from 'lucide-react';

interface EmailIntegrationProps {
  onClose?: () => void;
}

interface EmailConfig {
  provider: 'emailjs' | 'resend' | 'whatsapp' | 'none';
  emailjs?: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  resend?: {
    apiKey: string;
    from: string;
  };
}

export default function EmailIntegration({ onClose }: EmailIntegrationProps) {
  const [config, setConfig] = useState<EmailConfig>({ provider: 'none' });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testEmailValue, setTestEmailValue] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = () => {
    const savedConfig = localStorage.getItem('emailConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        checkConfiguration(parsedConfig);
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  };

  const checkConfiguration = (configToCheck: EmailConfig) => {
    let configured = false;
    
    if (configToCheck.provider === 'emailjs' && configToCheck.emailjs) {
      configured = !!(
        configToCheck.emailjs.serviceId && 
        configToCheck.emailjs.templateId && 
        configToCheck.emailjs.publicKey
      );
    }
    
    if (configToCheck.provider === 'resend' && configToCheck.resend) {
      configured = !!(
        configToCheck.resend.apiKey && 
        configToCheck.resend.from
      );
    }
    
    setIsConfigured(configured);
  };

  const saveConfiguration = async () => {
    try {
      if (config.provider === 'emailjs') {
        if (!config.emailjs?.serviceId || !config.emailjs?.templateId || !config.emailjs?.publicKey) {
          setTestResult('❌ Error: Todos los campos de EmailJS son obligatorios');
          return;
        }
        
        if (window.emailjs) {
          window.emailjs.init(config.emailjs.publicKey);
        } else {
          await loadEmailJS();
          if (window.emailjs) {
            window.emailjs.init(config.emailjs.publicKey);
          }
        }
      }

      localStorage.setItem('emailConfig', JSON.stringify(config));
      checkConfiguration(config);
      setTestResult('✅ Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setTestResult('❌ Error al guardar la configuración');
    }
  };

  const loadEmailJS = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.emailjs) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error cargando EmailJS'));
      document.head.appendChild(script);
    });
  };

  const testEmailFunction = async () => {
    if (!testEmailValue) {
      setTestResult('❌ Por favor ingresa un email para la prueba');
      return;
    }

    if (!isConfigured) {
      setTestResult('❌ Primero guarda una configuración válida');
      return;
    }

    setIsTesting(true);
    setTestResult('📧 Enviando email de prueba...');

    try {
      if (config.provider === 'emailjs' && config.emailjs) {
        await loadEmailJS();
        
        if (!window.emailjs) {
          throw new Error('EmailJS no pudo cargarse');
        }

        window.emailjs.init(config.emailjs.publicKey);

        const templateParams = {
          to_email: testEmailValue,
          to_name: 'Cliente de Prueba',
          subject: 'Prueba de Configuración - Beauty Salon',
          message: `Este es un email de prueba para verificar la configuración.`,
          html_message: `<h2>Prueba de Configuración</h2>
<p>Hola <strong>Cliente de Prueba</strong>,</p>
<p>Este es un email de prueba para verificar que la configuración está funcionando correctamente.</p>
<p><strong>Beauty Salon Total Control</strong></p>`
        };

        const result = await window.emailjs.send(
          config.emailjs.serviceId,
          config.emailjs.templateId,
          templateParams
        );

        if (result.status === 200) {
          setTestResult('✅ Email enviado! Revisa tu bandeja de entrada (y spam).');
        } else {
          setTestResult(`❌ Error. Status: ${result.status}`);
        }
      } else if (config.provider === 'resend') {
        setTestResult('ℹ️ Prueba con Resend no implementada. Configuración guardada.');
      }
    } catch (error: any) {
      console.error('Error:', error);
      
      if (error.message?.includes('422')) {
        setTestResult('❌ Error 422: Template mal configurado. Verifica las variables: to_email, to_name, subject, message, html_message');
      } else if (error.message?.includes('401')) {
        setTestResult('❌ Error 401: Public Key inválido.');
      } else {
        setTestResult(`❌ Error: ${error.message || 'Error desconocido'}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mail size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Configuración de Email
              </h2>
            </div>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            )}
          </div>

          {/* Estado */}
          <div className={`mb-6 p-4 rounded-lg border ${
            isConfigured 
              ? 'bg-green-50 border-green-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-2">
              {isConfigured ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <AlertTriangle size={20} className="text-orange-600" />
              )}
              <span className={`font-medium ${
                isConfigured ? 'text-green-800' : 'text-orange-800'
              }`}>
                {isConfigured ? 'Email configurado correctamente' : 'Email no configurado'}
              </span>
            </div>
          </div>

          {/* Selector de proveedor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Proveedor de Email
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfig({ ...config, provider: 'emailjs' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  config.provider === 'emailjs'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Mail size={24} className="text-purple-600 mb-2" />
                <h4 className="font-medium">EmailJS</h4>
                <p className="text-sm text-gray-600">Gratuito</p>
              </button>

              <button
                onClick={() => setConfig({ ...config, provider: 'resend' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  config.provider === 'resend'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Mail size={24} className="text-green-600 mb-2" />
                <h4 className="font-medium">Resend</h4>
                <p className="text-sm text-gray-600">Premium</p>
              </button>
            </div>
          </div>

          {/* EmailJS Config */}
          {config.provider === 'emailjs' && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Configuración EmailJS</h3>
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  {showInstructions ? 'Ocultar' : 'Ver'} instrucciones
                </button>
              </div>

              {showInstructions && (
                <div className="bg-blue-50 p-4 rounded-lg text-sm">
                  <h4 className="font-medium text-blue-900 mb-2">📋 Configuración requerida:</h4>
                  <ol className="text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Crea cuenta en <a href="https://emailjs.com" target="_blank" className="underline">emailjs.com</a></li>
                    <li>Template Subject: <code>{"{{subject}}"}</code></li>
                    <li>Template Content: <code>{"{{{html_message}}}"}</code></li>
                    <li>Variables: to_email, to_name, subject, message, html_message</li>
                  </ol>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service ID *
                </label>
                <input
                  type="text"
                  value={config.emailjs?.serviceId || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    emailjs: { 
                      ...config.emailjs, 
                      serviceId: e.target.value,
                      templateId: config.emailjs?.templateId || '',
                      publicKey: config.emailjs?.publicKey || ''
                    }
                  })}
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
                  value={config.emailjs?.templateId || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    emailjs: { 
                      ...config.emailjs, 
                      serviceId: config.emailjs?.serviceId || '',
                      templateId: e.target.value,
                      publicKey: config.emailjs?.publicKey || ''
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="template_xxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={config.emailjs?.publicKey || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      emailjs: { 
                        ...config.emailjs, 
                        serviceId: config.emailjs?.serviceId || '',
                        templateId: config.emailjs?.templateId || '',
                        publicKey: e.target.value
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                    placeholder="user_xxxxxxxxxxxxxxx"
                  />
                  <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test */}
          {config.provider !== 'none' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Probar configuración</h4>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={testEmailValue}
                  onChange={(e) => setTestEmailValue(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={testEmailFunction}
                  disabled={isTesting || !isConfigured}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isTesting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <TestTube size={16} />
                  )}
                  Probar
                </button>
              </div>
              {testResult && (
                <div className={`mt-2 p-3 rounded text-sm ${
                  testResult.includes('Error') || testResult.includes('❌')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : testResult.includes('✅')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {testResult}
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={saveConfiguration}
              disabled={config.provider === 'none'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    emailjs: any;
  }
}
