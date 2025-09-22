// src/hooks/useEmailAutomation.ts - Versión actualizada integrada con el sistema

import { useState, useEffect, useCallback } from 'react';
import { emailAutomationIntegratedService } from '../services/emailAutomationIntegratedService';

interface AutomationConfig {
  confirmacionAutomatica: boolean;
  recordatorioAntes: boolean;
  recordatorioDespues: boolean;
  cumpleanosAutomatico: boolean;
  seguimientoAutomatico: boolean;
  diasAntesRecordatorio: number;
  horaEnvioRecordatorios: string;
  diasDespuesSeguimiento: number;
}

interface AutomationStats {
  cumpleaneros: number;
  recordatorios: number;
  seguimientos: number;
  totalClientes: number;
  isRunning: boolean;
}

export const useEmailAutomation = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<AutomationConfig>({
    confirmacionAutomatica: true,
    recordatorioAntes: true,
    recordatorioDespues: false,
    cumpleanosAutomatico: true,
    seguimientoAutomatico: false,
    diasAntesRecordatorio: 1,
    horaEnvioRecordatorios: '10:00',
    diasDespuesSeguimiento: 7
  });

  // Inicializar el servicio
  useEffect(() => {
    try {
      const currentConfig = emailAutomationIntegratedService.getConfig();
      setConfig(currentConfig);
      setIsInitialized(true);
      console.log('✅ Email automation service initialized');
    } catch (error) {
      console.error('❌ Error initializing email automation:', error);
      setIsInitialized(false);
    }
  }, []);

  // Actualizar configuración
  const updateConfig = useCallback((newConfig: Partial<AutomationConfig>) => {
    try {
      emailAutomationIntegratedService.updateConfig(newConfig);
      const updatedConfig = emailAutomationIntegratedService.getConfig();
      setConfig(updatedConfig);
      console.log('📝 Automation config updated:', newConfig);
    } catch (error) {
      console.error('❌ Error updating automation config:', error);
    }
  }, []);

  // Ejecutar verificación manual
  const executeManualCheck = useCallback(async () => {
    try {
      console.log('🔄 Executing manual automation check...');
      const stats = await emailAutomationIntegratedService.executeManualCheck();
      return stats;
    } catch (error) {
      console.error('❌ Error in manual automation check:', error);
      return null;
    }
  }, []);

  // Iniciar automatización
  const startAutomation = useCallback((intervalMinutes?: number) => {
    try {
      emailAutomationIntegratedService.startAutomation();
      console.log('▶️ Automation started');
    } catch (error) {
      console.error('❌ Error starting automation:', error);
    }
  }, []);

  // Detener automatización
  const stopAutomation = useCallback(() => {
    try {
      emailAutomationIntegratedService.stopAutomation();
      console.log('⏹️ Automation stopped');
    } catch (error) {
      console.error('❌ Error stopping automation:', error);
    }
  }, []);

  // Obtener estadísticas
  const getAutomationStats = useCallback((): AutomationStats => {
    try {
      return emailAutomationIntegratedService.getStats();
    } catch (error) {
      console.error('❌ Error getting automation stats:', error);
      return {
        cumpleaneros: 0,
        recordatorios: 0,
        seguimientos: 0,
        totalClientes: 0,
        isRunning: false
      };
    }
  }, []);

  // Verificar si está ejecutándose
  const isRunning = useCallback(() => {
    try {
      return emailAutomationIntegratedService.isAutomationRunning();
    } catch (error) {
      console.error('❌ Error checking automation status:', error);
      return false;
    }
  }, []);

  // Triggers específicos para eventos del sistema de citas

  // Trigger cuando se crea una cita
  const triggerCitaCreada = useCallback(async (citaId: string) => {
    if (!config.confirmacionAutomatica) return;
    
    try {
      console.log('📅 Nueva cita creada, enviando confirmación...', citaId);
      await emailAutomationIntegratedService.executeManualCheck();
    } catch (error) {
      console.error('❌ Error in cita creada trigger:', error);
    }
  }, [config.confirmacionAutomatica]);

  // Trigger cuando se confirma una cita
  const triggerCitaConfirmada = useCallback(async (citaId: string) => {
    try {
      console.log('✅ Cita confirmada:', citaId);
      // La automatización ya maneja esto en el check regular
    } catch (error) {
      console.error('❌ Error in cita confirmada trigger:', error);
    }
  }, []);

  // Trigger cuando se completa una cita
  const triggerCitaCompletada = useCallback(async (citaId: string) => {
    if (!config.seguimientoAutomatico) return;
    
    try {
      console.log('🏁 Cita completada, programando seguimiento...', citaId);
      // El seguimiento se enviará automáticamente después de los días configurados
    } catch (error) {
      console.error('❌ Error in cita completada trigger:', error);
    }
  }, [config.seguimientoAutomatico]);

  // Trigger para cumpleaños
  const triggerCumpleanos = useCallback(async () => {
    if (!config.cumpleanosAutomatico) return;
    
    try {
      console.log('🎂 Verificando cumpleaños del día...');
      await emailAutomationIntegratedService.executeManualCheck();
    } catch (error) {
      console.error('❌ Error in cumpleanos trigger:', error);
    }
  }, [config.cumpleanosAutomatico]);

  return {
    // Estado
    isInitialized,
    config,
    
    // Acciones
    updateConfig,
    executeManualCheck,
    startAutomation,
    stopAutomation,
    getAutomationStats,
    isRunning,
    
    // Triggers del sistema de citas
    triggerCitaCreada,
    triggerCitaConfirmada,
    triggerCitaCompletada,
    triggerCumpleanos
  };
};