// src/components/email/EmailIntegration.tsx - CON DEBUGGING MEJORADO
import { useEffect, useState } from "react";
import { Mail, Settings, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface EmailIntegrationProps {
  onClose?: () => void;
}

interface EmailConfig {
  provider: 'emailjs' | 'resend' | 'none';
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

  useEffect(() => {
    // Load existing configuration
    const savedConfig = localStorage.getItem('emailConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        checkConfiguration(parsedConfig);
      } catch (error) {
        console.error('Error loading email config:', error);
      }
    }
  }, []);

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
      // Validar configuración antes de guardar
      if (config.provider === 'emailjs') {
        if (!config.emailjs?.serviceId || !config.emailjs?.templateId || !config.emailjs?.publicKey) {
          setTestResult('❌ Error: Todos los campos de EmailJS son obligatorios');
          return;
        }
        
        // Inicializar EmailJS con la nueva configuración
        if (window.emailjs) {
          window.emailjs.init(config.emailjs.publicKey);
        } else {
          // Cargar EmailJS si no está cargado
          await loadEmailJS();
          if (window.emailjs) {
            window.emailjs.init(config.emailjs.publicKey);
          }
        }
      }
      
      if (config.provider === 'resend') {
        if (!config.resend?.apiKey || !config.resend?.from) {
          setTestResult('❌ Error: Todos los campos de Resend son obligatorios');
          return;
        }
      }

      // Guardar configuración
      localStorage.setItem('emailConfig', JSON.stringify(config));
      checkConfiguration(config);
      setTestResult('✅ Configuración guardada exitosamente');
      
      console.log('Configuración guardada:', config);
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
      script.onload = () => {
        console.log('EmailJS cargado exitosamente');
        resolve();
      };
      script.onerror = () => {
        console.error('Error cargando EmailJS');
        reject(new Error('Error cargando EmailJS'));
      };
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

        // Asegurar que EmailJS esté inicializado
        window.emailjs.init(config.emailjs.publicKey);

        // Preparar datos del template - VERSIÓN SIMPLIFICADA
        const templateParams = {
          to_email: testEmailValue,
          to_name: 'Cliente de Prueba',
          subject: 'Prueba de Configuración - Beauty Salon',
          message: `Hola Cliente de Prueba,

Este es un email de prueba para verificar que la configuración de EmailJS está funcionando correctamente.

Tu configuración está lista para:
- Confirmaciones automáticas de citas
- Recordatorios antes de las citas  
- Notificaciones de cambios

Beauty Salon Total Control`,
          html_message: `<h2>Prueba de Configuración</h2>
<p>Hola <strong>Cliente de Prueba</strong>,</p>
<p>Este es un email de prueba para verificar que la configuración de EmailJS está funcionando correctamente.</p>
<div style="background: #f0f0f0; padding: 15px; margin: 20px 0;">
<h3>Tu configuración está lista para:</h3>
<ul>
<li>Confirmaciones automáticas de citas</li>
<li>Recordatorios antes de las citas</li>
<li>Notificaciones de cambios</li>
</ul>
</div>
<p><strong>Beauty Salon Total Control</strong></p>`
        };

        console.log('🔧 Datos enviados a EmailJS:', {
          serviceId: config.emailjs.serviceId,
          templateId: config.emailjs.templateId,
          templateParams
        });

        console.log('📤 Enviando con EmailJS...');

        const result = await window.emailjs.send(
          config.emailjs.serviceId,
          config.emailjs.templateId,
          templateParams
        );

        console.log('📨 Respuesta de EmailJS:', result);

        if (result.status === 200) {
          setTestResult('✅ Email de prueba enviado exitosamente! Revisa tu bandeja de entrada (y spam).');
        } else {
          setTestResult(`❌ Error en el envío. Status: ${result.status}. Revisa la configuración del template.`);
        }
      } else if (config.provider === 'resend') {
        setTestResult('ℹ️ Prueba con Resend no implementada aún. Configuración guardada correctamente.');
      } else {
        setTestResult('❌ Proveedor no configurado');
      }
    } catch (error) {
      console.error('💥 Error completo en prueba de email:', error);
      
      // Detectar tipos específicos de error
      if (error.message && error.message.includes('422')) {
        setTestResult(`❌ Error 422: El template de EmailJS no está configurado correctamente. 
        
Verifica que tu template tenga las variables: to_email, to_name, subject, message, html_message`);
      } else if (error.message && error.message.includes('401')) {
        setTestResult('❌ Error 401: Public Key inválido. Verifica tu Public Key en EmailJS.');
      } else if (error.message && error.message.includes('404')) {
        setTestResult('❌ Error 404: Service ID o Template ID no encontrado. Verifica tus credenciales.');
      } else {
        setTestResult(`❌ Error al enviar email: ${error.message || 'Error desconocido'}
        
Posibles causas:
- Template mal configurado
- Service ID/Template ID/Public Key incorrectos
- Cuenta EmailJS no verificada`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mail size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Configuración de Email
              </h2>
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

          {/* Estado actual */}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor de Email
            </label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({
                ...config,
                provider: e.target.value as EmailConfig['provider']
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">Sin configurar</option>
              <option value="emailjs">EmailJS (Gratuito)</option>
              <option value="resend">Resend (Premium)</option>
            </select>
          </div>

          {/* Configuración EmailJS */}
          {config.provider === 'emailjs' && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Configuración EmailJS</h3>
              
              {/* Instrucciones específicas para el template */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 Configuración de Template Requerida:</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>1. En EmailJS Dashboard → Templates → Create New Template</strong></p>
                  <p><strong>2. Subject:</strong> <code>{"{{subject}}"}</code></p>
                  <p><strong>3. Content:</strong> <code>{"{{{html_message}}}"}</code></p>
                  <p><strong>4. En Settings → Add estas variables:</strong></p>
                  <div className="bg-blue-100 p-2 rounded text-xs">
                    <div>• to_email</div>
                    <div>• to_name</div>
                    <div>• subject</div>
                    <div>• message</div>
                    <div>• html_message</div>
                  </div>
                  <p><strong>5. Guarda el template y copia el Template ID</strong></p>
                </div>
              </div>
              
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="template_xxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key *
                </label>
                <input
                  type="text"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user_xxxxxxxxxxxxxxx"
                />
              </div>
            </div>
          )}

          {/* Test de email */}
          {config.provider !== 'none' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Probar configuración</h4>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={testEmailValue}
                  onChange={(e) => setTestEmailValue(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={testEmailFunction}
                  disabled={isTesting || !isConfigured}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isTesting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  {isTesting ? 'Enviando...' : 'Probar'}
                </button>
              </div>
              {testResult && (
                <div className={`mt-2 p-3 rounded text-sm max-h-40 overflow-y-auto ${
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

          {/* Botones de acción */}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Settings size={16} />
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Declarar tipos para window
declare global {
  interface Window {
    emailjs: any;
  }
}