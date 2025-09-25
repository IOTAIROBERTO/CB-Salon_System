// src/hooks/useEmailConfig.ts - Hook para gestionar configuración de EmailJS

import { useState, useEffect } from 'react';
import { emailService, type EmailJSConfig } from '../services/emailService';

interface EmailConfigState {
  config: EmailJSConfig;
  isConfigured: boolean;
  isInitialized: boolean;
  isTesting: boolean;
  testResult: { success: boolean; error?: string } | null;
}

export const useEmailConfig = () => {
  const [state, setState] = useState<EmailConfigState>({
    config: {
      serviceId: '',
      templateId: '',
      publicKey: ''
    },
    isConfigured: false,
    isInitialized: false,
    isTesting: false,
    testResult: null
  });

  // Cargar configuración inicial
  useEffect(() => {
    loadConfig();
    checkStatus();
  }, []);

  const loadConfig = () => {
    try {
      const savedConfig = JSON.parse(localStorage.getItem('emailJSConfig') || '{}');
      setState(prev => ({
        ...prev,
        config: {
          serviceId: savedConfig.serviceId || '',
          templateId: savedConfig.templateId || '',
          publicKey: savedConfig.publicKey || ''
        }
      }));
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  };

  const checkStatus = () => {
    const status = emailService.getStatus();
    setState(prev => ({
      ...prev,
      isConfigured: status.isConfigured,
      isInitialized: status.isInitialized
    }));
  };

  const updateConfig = async (newConfig: Partial<EmailJSConfig>) => {
    try {
      const updatedConfig = { ...state.config, ...newConfig };
      
      // Guardar en localStorage
      localStorage.setItem('emailJSConfig', JSON.stringify(updatedConfig));
      
      // Actualizar servicio de email
      emailService.updateConfig(updatedConfig);
      
      // Actualizar estado local
      setState(prev => ({
        ...prev,
        config: updatedConfig
      }));

      // Verificar status después de actualizar
      setTimeout(checkStatus, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating email config:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  };

  const testEmailConfig = async (testEmail: string) => {
    setState(prev => ({ ...prev, isTesting: true, testResult: null }));
    
    try {
      // Primero intentar inicializar
      const initialized = await emailService.initialize();
      if (!initialized) {
        throw new Error('No se pudo inicializar EmailJS. Verifica tu configuración.');
      }

      // Enviar email de prueba
      const result = await emailService.sendTestEmail(testEmail);
      
      setState(prev => ({
        ...prev,
        isTesting: false,
        testResult: result
      }));

      return result;
    } catch (error) {
      const errorResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
      
      setState(prev => ({
        ...prev,
        isTesting: false,
        testResult: errorResult
      }));

      return errorResult;
    }
  };

  const clearTestResult = () => {
    setState(prev => ({ ...prev, testResult: null }));
  };

  const validateConfig = (config: EmailJSConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.serviceId || config.serviceId.trim() === '') {
      errors.push('Service ID es requerido');
    }

    if (!config.templateId || config.templateId.trim() === '') {
      errors.push('Template ID es requerido');
    }

    if (!config.publicKey || config.publicKey.trim() === '') {
      errors.push('Public Key es requerido');
    }

    // Validaciones adicionales
    if (config.serviceId && !config.serviceId.startsWith('service_')) {
      errors.push('Service ID debe comenzar con "service_"');
    }

    if (config.templateId && !config.templateId.startsWith('template_')) {
      errors.push('Template ID debe comenzar con "template_"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const getConfigInstructions = () => {
    return {
      serviceId: {
        title: 'Service ID',
        description: 'Identificador del servicio de email en EmailJS',
        example: 'service_tu_servicio',
        steps: [
          '1. Ve a tu dashboard de EmailJS',
          '2. Selecciona o crea un servicio de email',
          '3. Copia el Service ID que aparece en la configuración'
        ]
      },
      templateId: {
        title: 'Template ID',
        description: 'Identificador de la plantilla de email',
        example: 'template_tu_plantilla',
        steps: [
          '1. Ve a la sección "Templates" en EmailJS',
          '2. Crea o selecciona una plantilla',
          '3. Asegúrate de incluir las variables: to_email, to_name, subject, message_html',
          '4. Copia el Template ID'
        ]
      },
      publicKey: {
        title: 'Public Key',
        description: 'Clave pública para autenticación',
        example: 'tu_clave_publica',
        steps: [
          '1. Ve a "Account" en tu dashboard de EmailJS',
          '2. En la sección "API Keys"',
          '3. Copia tu Public Key'
        ]
      }
    };
  };

  return {
    config: state.config,
    isConfigured: state.isConfigured,
    isInitialized: state.isInitialized,
    isTesting: state.isTesting,
    testResult: state.testResult,
    updateConfig,
    testEmailConfig,
    clearTestResult,
    validateConfig,
    getConfigInstructions,
    checkStatus
  };
};