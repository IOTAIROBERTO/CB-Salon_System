// src/components/email/EmailConfigModal.tsx - COMPONENTE CONSOLIDADO

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Mail, 
  Send, 
  Check, 
  AlertCircle, 
  Info, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Loader,
  CheckCircle
} from 'lucide-react';
import { useEmailConfig } from '../../hooks/useEmail';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'modal' | 'page'; // Modal o página completa
}

const EmailConfigModal: React.FC<EmailConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  variant = 'modal' 
}) => {
  const {
    config,
    isConfigured,
    isTesting,
    testResult,
    updateConfig,
    testConfig,
    clearTestResult,
    validateConfig
  } = useEmailConfig();

  const [formData, setFormData] = useState(config);
  const [showInstructions, setShowInstructions] = useState(!isConfigured);
  const [showSecrets, setShowSecrets] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Sincronizar formData con config cuando cambie
  useEffect(() => {
    setFormData(config);
  }, [config]);

  // Auto-ocultar resultado después de 3 segundos
  useEffect(() => {
    if (saveResult?.success) {
      const timer = setTimeout(() => setSaveResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveResult]);

  if (!isOpen && variant === 'modal') return null;

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar resultados cuando se cambie la configuración
    if (saveResult) setSaveResult(null);
    if (testResult) clearTestResult();
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveResult(null);

    // Validar antes de guardar
    const validation = validateConfig(formData);
    if (!validation.isValid) {
      setSaveResult({
        success: false,
        error: 'Errores en la configuración:\n• ' + validation.errors.join('\n• ')
      });
      setIsSaving(false);
      return;
    }

    const result = await updateConfig(formData);
    setSaveResult(result);
    setIsSaving(false);

    if (result.success) {
      console.log('✅ Email configuration saved successfully');
    }
  };

  const handleTestConfig = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Por favor ingresa un email válido para la prueba');
      return;
    }

    if (!isConfigured) {
      alert('Primero debes guardar una configuración válida');
      return;
    }

    await testConfig(testEmail);
  };

  const isFormValid = () => {
    return formData.serviceId && formData.templateId && formData.publicKey;
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(config);
  };

  const instructions = [
    {
      step: '1',
      title: 'Crear cuenta en EmailJS',
      description: 'Ve a emailjs.com y crea una cuenta gratuita',
      link: 'https://www.emailjs.com/',
      details: 'EmailJS permite enviar hasta 200 emails gratis al mes'
    },
    {
      step: '2',
      title: 'Configurar servicio de email',
      description: 'Conecta tu Gmail, Outlook o otro proveedor',
      details: 'Esto permite que EmailJS envíe emails desde tu cuenta'
    },
    {
      step: '3',
      title: 'Crear plantilla de email',
      description: 'Crea una plantilla con las variables requeridas',
      details: 'Debe incluir: to_email, to_name, subject, message, html_message'
    },
    {
      step: '4',
      title: 'Copiar credenciales',
      description: 'Copia el Service ID, Template ID y Public Key aquí',
      details: 'Los encontrarás en tu dashboard de EmailJS'
    }
  ];

  const ConfigContent = () => (
    <div className="space-y-6">
      {/* Estado actual */}
      <div className={`p-4 rounded-lg border ${
        isConfigured 
          ? 'bg-green-50 border-green-200' 
          : 'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <>
              <CheckCircle size={20} className="text-green-600" />
              <span className="font-medium text-green-800">
                ✅ EmailJS configurado correctamente
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={20} className="text-orange-600" />
              <span className="font-medium text-orange-800">
                ⚠️ EmailJS no está configurado
              </span>
            </>
          )}
        </div>
        {isConfigured && (
          <p className="text-green-700 text-sm mt-1">
            El sistema puede enviar emails automáticos y campañas
          </p>
        )}
      </div>

      {/* Instrucciones */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-blue-900 flex items-center gap-2">
              <Info size={18} />
              Cómo configurar EmailJS
            </h3>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Ocultar
            </button>
          </div>
          
          <div className="space-y-4">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {instruction.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-blue-900">{instruction.title}</h4>
                    {instruction.link && (
                      <a
                        href={instruction.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <p className="text-blue-700 text-sm">{instruction.description}</p>
                  <p className="text-blue-600 text-xs mt-1">{instruction.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de configuración */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Credenciales de EmailJS
          </h3>
          {!showInstructions && (
            <button
              onClick={() => setShowInstructions(true)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <Info size={14} />
              Ver instrucciones
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service ID *
            </label>
            <input
              type="text"
              value={formData.serviceId}
              onChange={(e) => handleFormChange('serviceId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="service_xxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID del servicio de email en EmailJS
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template ID *
            </label>
            <input
              type="text"
              value={formData.templateId}
              onChange={(e) => handleFormChange('templateId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="template_xxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID de la plantilla con las variables requeridas
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Public Key *
          </label>
          <div className="relative">
            <input
              type={showSecrets ? "text" : "password"}
              value={formData.publicKey}
              onChange={(e) => handleFormChange('publicKey', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Resultado de guardado */}
        {saveResult && (
          <div className={`p-4 rounded-lg border ${
            saveResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {saveResult.success ? (
                <Check size={20} className="text-green-600 mt-0.5" />
              ) : (
                <X size={20} className="text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-medium ${
                  saveResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {saveResult.success ? 'Configuración guardada exitosamente' : 'Error en la configuración'}
                </h3>
                {saveResult.error && (
                  <p className="text-red-700 text-sm mt-1 whitespace-pre-line">{saveResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón de guardar */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={isSaving || !isFormValid() || !hasChanges()}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
              isSaving || !isFormValid() || !hasChanges()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
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

      {/* Prueba de configuración */}
      {isConfigured && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Send size={16} />
            Probar Configuración
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Envía un email de prueba para verificar que todo funciona correctamente.
          </p>
          
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu-email@ejemplo.com"
            />
            <button
              onClick={handleTestConfig}
              disabled={isTesting || !testEmail}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {isT