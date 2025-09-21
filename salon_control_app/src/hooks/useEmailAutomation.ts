// src/hooks/useEmailAutomation.ts - Versión corregida con importaciones correctas

import { useState, useEffect, useCallback, useRef } from 'react';
import { emailService, type EmailReminder } from '../services/emailService';

interface AutomationRule {
  id: string;
  name: string;
  type: 'reminder' | 'confirmation' | 'followup';
  triggerDays: number;
  enabled: boolean;
  template: string;
  createdAt: string;
}

interface PendingReminder {
  id: string;
  citaId: string;
  clienteId: string;
  scheduledDate: string;
  type: EmailReminder['type'];
  status: 'pending' | 'sent' | 'failed';
}

interface EmailAutomationState {
  rules: AutomationRule[];
  pendingReminders: PendingReminder[];
  isProcessing: boolean;
  lastProcessed: string | null;
}

export const useEmailAutomation = () => {
  const [state, setState] = useState<EmailAutomationState>({
    rules: [],
    pendingReminders: [],
    isProcessing: false,
    lastProcessed: null
  });

  const processingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar configuración inicial
  useEffect(() => {
    loadAutomationConfig();
    console.log('📧 Email automation initialized');
  }, []);

  // Configurar procesamiento automático cada hora
  useEffect(() => {
    const setupAutomaticProcessing = () => {
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Solo configurar si la automatización está habilitada
      if (!isAutomationEnabled()) {
        console.log('⏸️ Email automation disabled');
        return;
      }

      // Procesar inmediatamente al cargar
      processAutomaticReminders();

      // Configurar procesamiento cada hora
      const scheduleNext = () => {
        if (!isAutomationEnabled()) return;
        
        timeoutRef.current = setTimeout(() => {
          processAutomaticReminders();
          scheduleNext();
        }, 60 * 60 * 1000); // 1 hora
      };

      scheduleNext();
    };

    setupAutomaticProcessing();

    // Cleanup al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadAutomationConfig = useCallback(() => {
    try {
      const savedRules = JSON.parse(localStorage.getItem('emailAutomationRules') || '[]');
      const savedReminders = JSON.parse(localStorage.getItem('pendingEmailReminders') || '[]');
      const lastProcessed = localStorage.getItem('emailAutomationLastProcessed');

      setState(prev => ({
        ...prev,
        rules: savedRules,
        pendingReminders: savedReminders,
        lastProcessed
      }));

      console.log('✅ Email automation config loaded');
    } catch (error) {
      console.error('❌ Error loading automation config:', error);
    }
  }, []);

  const saveAutomationConfig = useCallback((newState: Partial<EmailAutomationState>) => {
    try {
      if (newState.rules) {
        localStorage.setItem('emailAutomationRules', JSON.stringify(newState.rules));
      }
      if (newState.pendingReminders) {
        localStorage.setItem('pendingEmailReminders', JSON.stringify(newState.pendingReminders));
      }
      if (newState.lastProcessed) {
        localStorage.setItem('emailAutomationLastProcessed', newState.lastProcessed);
      }
    } catch (error) {
      console.error('❌ Error saving automation config:', error);
    }
  }, []);

  const processAutomaticReminders = useCallback(async () => {
    // Verificar si la automatización está habilitada
    if (!isAutomationEnabled()) {
      console.log('⏸️ Automation disabled, skipping');
      return;
    }

    // Evitar procesamiento concurrente
    if (processingRef.current) {
      console.log('⏸️ Automation already processing, skipping');
      return;
    }

    // Verificar si EmailJS está configurado
    const status = emailService.getStatus();
    if (!status.isConfigured) {
      console.log('⚠️ EmailJS not configured, skipping automation');
      return;
    }

    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      console.log('🔄 Processing automatic email reminders...');

      // Cargar datos necesarios
      const citas = JSON.parse(localStorage.getItem('citas') || '[]');
      const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
      const servicios = JSON.parse(localStorage.getItem('servicios') || '[]');

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Buscar citas que necesiten recordatorios
      const citasParaRecordatorio = citas.filter((cita: any) => {
        // Solo citas confirmadas o pendientes
        if (!['confirmada', 'pendiente'].includes(cita.estado)) return false;

        // Solo citas futuras
        const citaDate = new Date(cita.fecha);
        if (citaDate < now) return false;

        const cliente = clientes.find((c: any) => c.id === cita.clienteId);
        // Solo si el cliente tiene email
        return cliente?.email && cliente.email.trim() !== '';
      });

      let recordatoriosEnviados = 0;
      let erroresEnvio = 0;

      for (const cita of citasParaRecordatorio) {
        try {
          const cliente = clientes.find((c: any) => c.id === cita.clienteId);
          const servicio = servicios.find((s: any) => s.id === cita.servicioId);

          if (!cliente?.email || !servicio) continue;

          const citaDate = new Date(cita.fecha);
          const daysDifference = Math.ceil((citaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Enviar recordatorio si es mañana (1 día antes)
          if (daysDifference === 1) {
            // Verificar si ya se envió recordatorio hoy
            const yaEnviado = cita.emailHistory?.some((email: any) => 
              email.type === 'recordatorio' && 
              email.sentAt.startsWith(today) &&
              email.success &&
              email.automated
            );

            if (yaEnviado) {
              console.log(`⏭️ Recordatorio ya enviado hoy para ${cliente.nombre}`);
              continue;
            }

            console.log(`📧 Enviando recordatorio a ${cliente.nombre} para cita del ${cita.fecha}`);

            const emailData: EmailReminder = {
              to: cliente.email,
              clienteName: cliente.nombre,
              servicioNombre: servicio.nombre,
              fecha: cita.fecha,
              hora: cita.hora,
              notas: cita.notas,
              type: 'recordatorio'
            };

            const result = await emailService.sendReminder(emailData);

            if (result.success) {
              recordatoriosEnviados++;

              // Actualizar historial de la cita
              const citasActualizadas = citas.map((c: any) => {
                if (c.id === cita.id) {
                  return {
                    ...c,
                    emailHistory: [
                      ...(c.emailHistory || []),
                      {
                        type: 'recordatorio',
                        sentAt: now.toISOString(),
                        success: true,
                        automated: true,
                        messageId: result.messageId
                      }
                    ]
                  };
                }
                return c;
              });

              localStorage.setItem('citas', JSON.stringify(citasActualizadas));
              console.log(`✅ Recordatorio enviado exitosamente a ${cliente.nombre}`);
            } else {
              erroresEnvio++;
              console.error(`❌ Error enviando recordatorio a ${cliente.nombre}:`, result.error);
              
              // Registrar error en historial
              const citasActualizadas = citas.map((c: any) => {
                if (c.id === cita.id) {
                  return {
                    ...c,
                    emailHistory: [
                      ...(c.emailHistory || []),
                      {
                        type: 'recordatorio',
                        sentAt: now.toISOString(),
                        success: false,
                        automated: true,
                        error: result.error
                      }
                    ]
                  };
                }
                return c;
              });

              localStorage.setItem('citas', JSON.stringify(citasActualizadas));
            }

            // Pausa entre envíos para no saturar
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          erroresEnvio++;
          console.error('❌ Error processing cita:', error);
        }
      }

      const lastProcessed = now.toISOString();
      setState(prev => ({ ...prev, lastProcessed }));
      saveAutomationConfig({ lastProcessed });

      const totalProcesadas = recordatoriosEnviados + erroresEnvio;
      if (totalProcesadas > 0) {
        console.log(`✅ Email automation completed. ${recordatoriosEnviados} exitosos, ${erroresEnvio} fallidos`);
      } else {
        console.log('✅ Email automation completed. No reminders needed today.');
      }

    } catch (error) {
      console.error('❌ Error in email automation:', error);
    } finally {
      processingRef.current = false;
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [saveAutomationConfig]);

  const isAutomationEnabled = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('emailAutomationEnabled') || 'true');
    } catch {
      return true;
    }
  }, []);

  const enableAutomation = useCallback((enabled: boolean) => {
    localStorage.setItem('emailAutomationEnabled', JSON.stringify(enabled));
    
    if (!enabled && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      console.log('⏸️ Email automation disabled');
    } else if (enabled) {
      console.log('▶️ Email automation enabled');
      // Reiniciar el procesamiento
      setTimeout(() => {
        processAutomaticReminders();
      }, 1000);
    }
  }, [processAutomaticReminders]);

  const manualProcessReminders = useCallback(async () => {
    if (state.isProcessing) {
      console.log('⏸️ Automation already running');
      return { success: false, message: 'Ya se está procesando' };
    }

    console.log('🔄 Manual processing triggered');
    await processAutomaticReminders();
    return { success: true, message: 'Procesamiento completado' };
  }, [state.isProcessing, processAutomaticReminders]);

  const getAutomationStats = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Contar emails enviados hoy
    const citas = JSON.parse(localStorage.getItem('citas') || '[]');
    const emailsHoy = citas.reduce((count: number, cita: any) => {
      const emailsDelDia = cita.emailHistory?.filter((email: any) => 
        email.sentAt.startsWith(today) && email.success && email.automated
      ) || [];
      return count + emailsDelDia.length;
    }, 0);

    return {
      rulesActive: state.rules.filter(r => r.enabled).length,
      rulesTotal: state.rules.length,
      emailsSentToday: emailsHoy,
      lastProcessed: state.lastProcessed,
      isProcessing: state.isProcessing,
      nextProcessing: timeoutRef.current && isAutomationEnabled() ? 'En 1 hora' : 'No programado',
      isEnabled: isAutomationEnabled(),
      emailJSConfigured: emailService.getStatus().isConfigured
    };
  }, [state, isAutomationEnabled]);

  return {
    // Estado
    rules: state.rules,
    pendingReminders: state.pendingReminders,
    isProcessing: state.isProcessing,
    lastProcessed: state.lastProcessed,

    // Métodos
    manualProcessReminders,
    getAutomationStats,
    enableAutomation,
    isAutomationEnabled,

    // Recargar configuración
    reloadConfig: loadAutomationConfig
  };
};