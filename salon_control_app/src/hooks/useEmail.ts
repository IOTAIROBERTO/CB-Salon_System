// src/hooks/useEmail.ts - HOOKS CONSOLIDADOS PARA EMAIL

import { useState, useCallback, useEffect } from 'react';
import { emailService, EmailReminder, CampaignEmail, EmailJSConfig } from '../services/emailService';

// ============ HOOK PRINCIPAL PARA EMAIL ============
export interface UseEmailResult {
  // Estado
  isSending: boolean;
  result: { success: boolean; error?: string } | null;
  isConfigured: boolean;
  isInitialized: boolean;
  
  // Acciones
  sendEmail: (data: EmailReminder | CampaignEmail) => Promise<{ success: boolean; error?: string }>;
  sendReminder: (data: EmailReminder) => Promise<{ success: boolean; error?: string }>;
  sendCampaign: (data: CampaignEmail) => Promise<{ success: boolean; error?: string }>;
  sendTest: (email: string) => Promise<{ success: boolean; error?: string }>;
  clearResult: () => void;
  
  // Utilidades
  getStatus: () => { isConfigured: boolean; isInitialized: boolean };
}

export const useEmail = (): UseEmailResult => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [status, setStatus] = useState(emailService.getStatus());

  // Actualizar estado cuando cambie la configuración
  useEffect(() => {
    const updateStatus = () => setStatus(emailService.getStatus());
    
    // Escuchar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'emailJSConfig') {
        updateStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar eventos personalizados para cambios en la misma pestaña
    window.addEventListener('email-config-updated', updateStatus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('email-config-updated', updateStatus);
    };
  }, []);

  const sendEmail = useCallback(async (data: EmailReminder | CampaignEmail) => {
    setIsSending(true);
    setResult(null);
    
    try {
      const response = await emailService.sendEmail(data);
      setResult(response);
      return response;
    } catch (error) {
      const errorResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsSending(false);
    }
  }, []);

  const sendReminder = useCallback(async (data: EmailReminder) => {
    return sendEmail(data);
  }, [sendEmail]);

  const sendCampaign = useCallback(async (data: CampaignEmail) => {
    return sendEmail(data);
  }, [sendEmail]);

  const sendTest = useCallback(async (email: string) => {
    return sendEmail({
      to: email,
      clienteName: 'Cliente de Prueba',
      servicioNombre: 'Test de Configuración',
      fecha: new Date().toISOString().split('T')[0],
      hora: '10:00',
      type: 'confirmacion',
      notas: 'Este es un email de prueba del sistema'
    } as EmailReminder);
  }, [sendEmail]);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const getStatus = useCallback(() => {
    return emailService.getStatus();
  }, []);

  return {
    isSending,
    result,
    isConfigured: status.isConfigured,
    isInitialized: status.isInitialized,
    sendEmail,
    sendReminder,
    sendCampaign,
    sendTest,
    clearResult,
    getStatus
  };
};

// ============ HOOK PARA CONFIGURACIÓN DE EMAIL ============
export interface UseEmailConfigResult {
  config: EmailJSConfig;
  isConfigured: boolean;
  isTesting: boolean;
  testResult: { success: boolean; error?: string } | null;
  
  updateConfig: (newConfig: Partial<EmailJSConfig>) => Promise<{ success: boolean; error?: string }>;
  testConfig: (testEmail: string) => Promise<{ success: boolean; error?: string }>;
  clearTestResult: () => void;
  validateConfig: (config: EmailJSConfig) => { isValid: boolean; errors: string[] };
  resetConfig: () => void;
}

export const useEmailConfig = (): UseEmailConfigResult => {
  const [config, setConfig] = useState<EmailJSConfig>({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Cargar configuración inicial
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = useCallback(() => {
    try {
      const savedConfig = JSON.parse(localStorage.getItem('emailJSConfig') || '{}');
      const loadedConfig = {
        serviceId: savedConfig.serviceId || '',
        templateId: savedConfig.templateId || '',
        publicKey: savedConfig.publicKey || ''
      };
      
      setConfig(loadedConfig);
      setIsConfigured(!!(loadedConfig.serviceId && loadedConfig.templateId && loadedConfig.publicKey));
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<EmailJSConfig>) => {
    try {
      const result = emailService.updateConfig(newConfig);
      
      if (result.success) {
        loadConfig(); // Recargar desde el servicio
        
        // Disparar evento para notificar cambios
        window.dispatchEvent(new CustomEvent('email-config-updated'));
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando configuración'
      };
    }
  }, [loadConfig]);

  const testConfig = useCallback(async (testEmail: string) => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await emailService.sendTestEmail(testEmail);
      setTestResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Error en prueba de email'
      };
      setTestResult(errorResult);
      return errorResult;
    } finally {
      setIsTesting(false);
    }
  }, []);

  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  const validateConfig = useCallback((configToValidate: EmailJSConfig) => {
    return emailService.validateConfig(configToValidate);
  }, []);

  const resetConfig = useCallback(() => {
    const emptyConfig = { serviceId: '', templateId: '', publicKey: '' };
    setConfig(emptyConfig);
    setIsConfigured(false);
    setTestResult(null);
    localStorage.removeItem('emailJSConfig');
    window.dispatchEvent(new CustomEvent('email-config-updated'));
  }, []);

  return {
    config,
    isConfigured,
    isTesting,
    testResult,
    updateConfig,
    testConfig,
    clearTestResult,
    validateConfig,
    resetConfig
  };
};

// ============ HOOK PARA CITAS CON EMAIL ============
export interface UseCitaEmailOptions {
  cita: any;
  cliente: any;
  servicio: any;
  autoSend?: boolean;
}

export interface UseCitaEmailResult {
  canSendEmail: boolean;
  isConfigured: boolean;
  sendConfirmation: () => Promise<{ success: boolean; error?: string }>;
  sendReminder: () => Promise<{ success: boolean; error?: string }>;
  sendChange: () => Promise<{ success: boolean; error?: string }>;
  getEmailPreview: (type: 'confirmacion' | 'recordatorio' | 'cambio') => string;
}

export const useCitaEmail = ({ 
  cita, 
  cliente, 
  servicio, 
  autoSend = false 
}: UseCitaEmailOptions): UseCitaEmailResult => {
  const { sendReminder: sendReminderEmail, isConfigured } = useEmail();

  const canSendEmail = !!(cliente?.email && cliente.email.trim() !== '' && isConfigured);

  const buildEmailData = useCallback((type: 'confirmacion' | 'recordatorio' | 'cambio'): EmailReminder => ({
    to: cliente.email,
    clienteName: cliente.nombre,
    servicioNombre: servicio.nombre,
    fecha: cita.fecha,
    hora: cita.hora,
    notas: cita.notas,
    type
  }), [cita, cliente, servicio]);

  const sendConfirmation = useCallback(async () => {
    if (!canSendEmail) {
      return { success: false, error: 'No se puede enviar email: cliente sin email o EmailJS no configurado' };
    }

    const emailData = buildEmailData('confirmacion');
    const result = await sendReminderEmail(emailData);

    // Registrar en historial si fue exitoso
    if (result.success) {
      try {
        const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
        const updatedCitas = citasData.map((c: any) => {
          if (c.id === cita.id) {
            return {
              ...c,
              emailHistory: [
                ...(c.emailHistory || []),
                {
                  type: 'confirmacion',
                  sentAt: new Date().toISOString(),
                  success: true,
                  manual: true
                }
              ]
            };
          }
          return c;
        });
        localStorage.setItem('citas', JSON.stringify(updatedCitas));
      } catch (error) {
        console.error('Error updating cita email history:', error);
      }
    }

    return result;
  }, [canSendEmail, buildEmailData, sendReminderEmail, cita.id]);

  const sendReminder = useCallback(async () => {
    if (!canSendEmail) {
      return { success: false, error: 'No se puede enviar email: cliente sin email o EmailJS no configurado' };
    }

    const emailData = buildEmailData('recordatorio');
    return sendReminderEmail(emailData);
  }, [canSendEmail, buildEmailData, sendReminderEmail]);

  const sendChange = useCallback(async () => {
    if (!canSendEmail) {
      return { success: false, error: 'No se puede enviar email: cliente sin email o EmailJS no configurado' };
    }

    const emailData = buildEmailData('cambio');
    return sendReminderEmail(emailData);
  }, [canSendEmail, buildEmailData, sendReminderEmail]);

  const getEmailPreview = useCallback((type: 'confirmacion' | 'recordatorio' | 'cambio'): string => {
    const emailData = buildEmailData(type);
    
    // Generar preview básico
    return `Para: ${emailData.to}
Asunto: Email de ${type} - ${emailData.clienteName}
Cliente: ${emailData.clienteName}
Servicio: ${emailData.servicioNombre}
Fecha: ${emailData.fecha}
Hora: ${emailData.hora}
${emailData.notas ? `Notas: ${emailData.notas}` : ''}`;
  }, [buildEmailData]);

  // Auto-envío si está habilitado y las condiciones se cumplen
  useEffect(() => {
    if (autoSend && canSendEmail && cita.estado === 'confirmada') {
      sendConfirmation();
    }
  }, [autoSend, canSendEmail, cita.estado, sendConfirmation]);

  return {
    canSendEmail,
    isConfigured,
    sendConfirmation,
    sendReminder,
    sendChange,
    getEmailPreview
  };
};

// ============ HOOK PARA CAMPAÑAS DE EMAIL ============
export interface UseCampaignEmailOptions {
  campaigns?: any[];
  clients?: any[];
  templates?: any[];
}

export interface UseCampaignEmailResult {
  isSending: boolean;
  sendingProgress: number;
  sendCampaign: (campaign: any) => Promise<{ success: boolean; error?: string; stats?: any }>;
  sendBulkEmails: (emails: CampaignEmail[]) => Promise<{ success: boolean; stats: any }>;
  validateCampaign: (campaign: any) => { isValid: boolean; errors: string[] };
}

export const useCampaignEmail = ({ 
  campaigns = [], 
  clients = [], 
  templates = [] 
}: UseCampaignEmailOptions = {}): UseCampaignEmailResult => {
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const { sendCampaign: sendCampaignEmail, isConfigured } = useEmail();

  const sendCampaign = useCallback(async (campaign: any) => {
    if (!isConfigured) {
      return { success: false, error: 'EmailJS no está configurado' };
    }

    if (!campaign.destinatarios || campaign.destinatarios.length === 0) {
      return { success: false, error: 'La campaña no tiene destinatarios' };
    }

    setIsSending(true);
    setSendingProgress(0);

    let sentCount = 0;
    let failedCount = 0;
    const total = campaign.destinatarios.length;

    try {
      for (let i = 0; i < campaign.destinatarios.length; i++) {
        const destinatario = campaign.destinatarios[i];
        
        const emailData: CampaignEmail = {
          to: destinatario.email,
          clienteName: destinatario.nombre,
          subject: campaign.asunto || campaign.subject,
          message: campaign.contenido || campaign.message || 'Mensaje de campaña',
          type: campaign.tipo || campaign.type || 'promocional'
        };

        try {
          const result = await sendCampaignEmail(emailData);
          
          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
          }

          // Actualizar progreso
          setSendingProgress(Math.round(((i + 1) / total) * 100));
          
          // Pequeña pausa entre envíos para no saturar
          if (i < campaign.destinatarios.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          failedCount++;
          console.error(`Error enviando a ${destinatario.email}:`, error);
        }
      }

      const stats = { sent: sentCount, failed: failedCount, total };

      // Actualizar campaña con estadísticas
      try {
        const campaigns = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
        const updatedCampaigns = campaigns.map((c: any) => 
          c.id === campaign.id 
            ? {
                ...c,
                estado: 'enviada',
                fechaEnvio: new Date().toISOString(),
                estadisticas: {
                  totalEnviados: sentCount,
                  totalFallidos: failedCount,
                  totalAbiertos: 0,
                  tasaApertura: 0
                }
              }
            : c
        );
        localStorage.setItem('emailCampaigns', JSON.stringify(updatedCampaigns));
      } catch (error) {
        console.error('Error updating campaign:', error);
      }

      return { 
        success: sentCount > 0, 
        error: failedCount > 0 ? `${failedCount} emails fallaron` : undefined,
        stats 
      };

    } finally {
      setIsSending(false);
      setSendingProgress(0);
    }
  }, [isConfigured, sendCampaignEmail]);

  const sendBulkEmails = useCallback(async (emails: CampaignEmail[]) => {
    setIsSending(true);
    setSendingProgress(0);

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < emails.length; i++) {
      try {
        const result = await sendCampaignEmail(emails[i]);
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }

      setSendingProgress(Math.round(((i + 1) / emails.length) * 100));
      
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsSending(false);
    setSendingProgress(0);

    return {
      success: sentCount > 0,
      stats: { sent: sentCount, failed: failedCount, total: emails.length }
    };
  }, [sendCampaignEmail]);

  const validateCampaign = useCallback((campaign: any) => {
    const errors: string[] = [];

    if (!campaign.nombre && !campaign.name) {
      errors.push('El nombre de la campaña es obligatorio');
    }

    if (!campaign.asunto && !campaign.subject) {
      errors.push('El asunto del email es obligatorio');
    }

    if (!campaign.contenido && !campaign.message) {
      errors.push('El contenido del email es obligatorio');
    }

    if (!campaign.destinatarios || campaign.destinatarios.length === 0) {
      errors.push('Debe seleccionar al menos un destinatario');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    isSending,
    sendingProgress,
    sendCampaign,
    sendBulkEmails,
    validateCampaign
  };
};

// ============ EXPORTACIONES ADICIONALES ============
export default useEmail;