// src/components/EmailConfig.tsx - Componente de configuración de EmailJS

import React, { useState } from 'react';
import { 
  Settings, 
  Mail, 
  Check, 
  X, 
  AlertCircle, 
  Send,
  Loader,
  Info,
  Eye,
  EyeOff,
  ExternalLink,
  Save
} from 'lucide-react';
import { useEmailConfig } from '../hooks/useEmailConfig';

export default function EmailConfig() {
  const {
    config,
    isConfigured,
    isInitialized,
    isTesting,
    testResult,
    updateConfig,
    testEmailConfig,
    clearTestResult,
    validateConfig,
    getConfigInstructions
  } = useEmailConfig();

  const [formData, setFormData] = useState(config);
  const [testEmail, setTestEmail] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const instructions = getConfigInstructions();

  const handleSaveConfig = async () => {
    setIsSaving(true);
    clearTestResult();

    const validation = validateConfig(formData);
    if (!validation.isValid) {
      alert('Errores en la configuración:\n' + validation.errors.join('\n'));
      setIsSaving(false);
      return;
    }

    const result = await updateConfig(formData);
    setIsSaving(false);

    if (result.success) {
      alert('Configuración guardada exitosamente');
    } else {
      alert('Error guardando configuración: ' + (result.error || 'Error desconocido'));
    }
  };

  const handleTestConfig = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Por favor ingresa un email válido para la prueba');
      return;
    }

    if (!isConfigured) {
      alert('Primero debes guardar la configuración');
      return;
    }

    await testEmailConfig(testEmail);
  };

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={24} />
            Configuración de Email
          </h1>
          <p className="text-gray-600 mt-1">
            Configura EmailJS para enviar emails automáticos y campañas
          </p>
        </div>
        
        {/* Estado actual */}
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <div className="flex items-center gap-1 text-green-600">
              <Check size={16} />
              <span className="text-sm">Configurado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <X size={16} />
              <span className="text-sm">No configurado</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de estado */}
      {!isConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">EmailJS no está configurado</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Para enviar emails automáticos y campañas, necesitas configurar EmailJS con tus credenciales.
              </p>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-yellow-600 hover:text-yellow-800 text-sm underline mt-2 flex items-center gap-1"
              >
                <Info size={14} />
                {showInstructions ? 'Ocultar' : 'Ver'} instrucciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-4 flex items-center gap-2">
            <Info size={18} />
            Cómo obtener las credenciales de EmailJS
          </h3>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-blue-800 text-sm">
                Necesitas una cuenta gratuita en EmailJS para enviar emails.
              </p>
              <a
                href="https://www.emailjs.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Ir a EmailJS <ExternalLink size={14} />
              </a>
            </div>

            {Object.entries(instructions).map(([key, instruction]) => (
              <div key={key} className="border-l-4 border-blue-300 pl-4">
                <h4 className="font-medium text-blue-900">{instruction.title}</h4>
                <p className="text-blue-700 text-sm mb-2">{instruction.description}</p>
                <div className="text-blue-600 text-sm">
                  {instruction.steps.map((step, index) => (
                    <div key={index} className="mb-1">{step}</div>
                  ))}
                </div>
                <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                  Ejemplo: {instruction.example}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de configuración */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Credenciales de EmailJS
        </h2>

        <div className="space-y-4">
          {/* Service ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service ID *
            </label>
            <input
              type="text"
              value={formData.serviceId}
              onChange={(e) => handleFormChange('serviceId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="service_tu_servicio"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID del servicio de email configurado en EmailJS
            </p>
          </div>

          {/* Template ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template ID *
            </label>
            <input
              type="text"
              value={formData.templateId}
              onChange={(e) => handleFormChange('templateId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="template_tu_plantilla"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID de la plantilla que incluye las variables necesarias
            </p>
          </div>

          {/* Public Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Public Key *
            </label>
            <div className="relative">
              <input
                type={showSecrets ? "text" : "password"}
                value={formData.publicKey}
                onChange={(e) => handleFormChange('publicKey', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="tu_clave_publica"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Clave pública de tu cuenta de EmailJS
            </p>
          </div>

          {/* Botón de guardar */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>

      {/* Prueba de configuración */}
      {isConfigured && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Probar Configuración
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de prueba
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="tu-email@ejemplo.com"
                />
                <button
                  onClick={handleTestConfig}
                  disabled={isTesting || !testEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTesting ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isTesting ? 'Enviando...' : 'Enviar Prueba'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Se enviará un email de prueba a esta dirección
              </p>
            </div>

            {/* Resultado de la prueba */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <Check size={20} className="text-green-600 mt-0.5" />
                  ) : (
                    <X size={20} className="text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'Email enviado exitosamente' : 'Error al enviar email'}
                    </h3>
                    {testResult.error && (
                      <p className="text-red-700 text-sm mt-1">{testResult.error}</p>
                    )}
                    {testResult.success && (
                      <p className="text-green-700 text-sm mt-1">
                        Revisa tu bandeja de entrada y spam. El email puede tardar unos minutos en llegar.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={clearTestResult}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Información importante</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• EmailJS permite enviar hasta 200 emails gratis al mes</li>
          <li>• Los emails se envían desde los servidores de EmailJS</li>
          <li>• Asegúrate de que tu plantilla incluya las variables necesarias</li>
          <li>• Los emails pueden tardar algunos minutos en llegar</li>
          <li>• Verifica que los emails no lleguen a spam</li>
        </ul>
      </div>
    </div>
  );
}
  