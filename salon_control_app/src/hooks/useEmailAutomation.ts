// src/hooks/useEmailAutomation.ts
import { useEffect } from 'react';
import { emailService } from '../services/emailService';

interface AutomationConfig {
  recordatoriosCitas: boolean;
  confirmacionCitas: boolean;
  felicitacionesCumpleanos: boolean;
  seguimientoClientes: boolean;
  diasAntesRecordatorio: number;
  horaEnvioRecordatorios: string;
}

export const useEmailAutomation = () => {
  
  useEffect(() => {
    // Verificar y ejecutar automatizaciones diarias
    const checkAutomations = () => {
      const config = getAutomationConfig();
      
      if (config.recordatoriosCitas) {
        scheduleAppointmentReminders(config);
      }
      
      if (config.felicitacionesCumpleanos) {
        scheduleBirthdayMessages();
      }
      
      if (config.seguimientoClientes) {
        scheduleFollowUpMessages();
      }
    };

    // Ejecutar inmediatamente y luego cada hora
    checkAutomations();
    const interval = setInterval(checkAutomations, 60 * 60 * 1000); // Cada hora

    return () => clearInterval(interval);
  }, []);

  const getAutomationConfig = (): AutomationConfig => {
    return JSON.parse(localStorage.getItem('emailAutomationConfig') || JSON.stringify({
      recordatoriosCitas: true,
      confirmacionCitas: true,
      felicitacionesCumpleanos: true,
      seguimientoClientes: false,
      diasAntesRecordatorio: 1,
      horaEnvioRecordatorios: '10:00'
    }));
  };

  const scheduleAppointmentReminders = (config: AutomationConfig) => {
    const citas = JSON.parse(localStorage.getItem('citas') || '[]');
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    const servicios = JSON.parse(localStorage.getItem('servicios') || '[]');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + config.diasAntesRecordatorio);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Buscar citas para mañana que necesiten recordatorio
    const citasParaRecordar = citas.filter((cita: any) => 
      cita.fecha === tomorrowStr && 
      ['confirmada', 'pendiente'].includes(cita.estado) &&
      !cita.recordatorioEnviado
    );

    citasParaRecordar.forEach((cita: any) => {
      const cliente = clientes.find((c: any) => c.id === cita.clienteId);
      const servicio = servicios.find((s: any) => s.id === cita.servicioId);
      
      if (cliente?.email && servicio) {
        // Programar envío para la hora configurada
        const sendDate = new Date();
        const [hour, minute] = config.horaEnvioRecordatorios.split(':');
        sendDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
        
        emailService.scheduleReminder({
          to: cliente.email,
          clienteName: cliente.nombre,
          servicioNombre: servicio.nombre,
          fecha: cita.fecha,
          hora: cita.hora,
          type: 'recordatorio',
          notas: cita.notas
        }, sendDate);

        // Marcar como recordatorio programado
        cita.recordatorioEnviado = true;
      }
    });

    // Guardar cambios
    localStorage.setItem('citas', JSON.stringify(citas));
  };

  const scheduleBirthdayMessages = () => {
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Buscar clientes que cumplen años hoy
    const cumpleaneros = clientes.filter((cliente: any) => {
      if (!cliente.email || !cliente.cumple || !cliente.activo) return false;
      
      const birthDate = new Date(cliente.cumple);
      const birthStr = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
      
      return birthStr === todayStr && !cliente.cumpleanosEnviado;
    });

    cumpleaneros.forEach((cliente: any) => {
      emailService.sendReminder({
        to: cliente.email,
        clienteName: cliente.nombre,
        servicioNombre: 'Felicitación de Cumpleaños',
        fecha: today.toISOString().split('T')[0],
        hora: '10:00',
        type: 'cumpleanos'
      });

      // Marcar como enviado
      cliente.cumpleanosEnviado = true;
    });

    // Guardar cambios
    localStorage.setItem('clientes', JSON.stringify(clientes));
  };

  const scheduleFollowUpMessages = () => {
    const citas = JSON.parse(localStorage.getItem('citas') || '[]');
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    const servicios = JSON.parse(localStorage.getItem('servicios') || '[]');
    
    // Buscar citas completadas hace 7 días que no han tenido seguimiento
    const seguimientoDate = new Date();
    seguimientoDate.setDate(seguimientoDate.getDate() - 7);
    const seguimientoStr = seguimientoDate.toISOString().split('T')[0];

    const citasParaSeguimiento = citas.filter((cita: any) =>
      cita.estado === 'completada' &&
      cita.fechaCompletada?.split('T')[0] === seguimientoStr &&
      !cita.seguimientoEnviado
    );

    citasParaSeguimiento.forEach((cita: any) => {
      const cliente = clientes.find((c: any) => c.id === cita.clienteId);
      const servicio = servicios.find((s: any) => s.id === cita.servicioId);
      
      if (cliente?.email && servicio) {
        emailService.sendReminder({
          to: cliente.email,
          clienteName: cliente.nombre,
          servicioNombre: servicio.nombre,
          fecha: cita.fecha,
          hora: cita.hora,
          type: 'promocional',
          notas: '¿Qué tal tu experiencia? ¡Nos encantaría verte de nuevo!'
        });

        // Marcar como seguimiento enviado
        cita.seguimientoEnviado = true;
      }
    });

    // Guardar cambios
    localStorage.setItem('citas', JSON.stringify(citas));
  };

  const triggerCitaConfirmada = async (citaId: string) => {
    const config = getAutomationConfig();
    if (!config.confirmacionCitas) return;

    const citas = JSON.parse(localStorage.getItem('citas') || '[]');
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    const servicios = JSON.parse(localStorage.getItem('servicios') || '[]');

    const cita = citas.find((c: any) => c.id === citaId);
    if (!cita) return;

    const cliente = clientes.find((c: any) => c.id === cita.clienteId);
    const servicio = servicios.find((s: any) => s.id === cita.servicioId);

    if (cliente?.email && servicio) {
      await emailService.sendReminder({
        to: cliente.email,
        clienteName: cliente.nombre,
        servicioNombre: servicio.nombre,
        fecha: cita.fecha,
        hora: cita.hora,
        type: 'confirmacion',
        notas: cita.notas
      });
    }
  };

  const updateAutomationConfig = (newConfig: Partial<AutomationConfig>) => {
    const currentConfig = getAutomationConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };
    localStorage.setItem('emailAutomationConfig', JSON.stringify(updatedConfig));
  };

  return {
    getAutomationConfig,
    updateAutomationConfig,
    triggerCitaConfirmada,
    scheduleAppointmentReminders,
    scheduleBirthdayMessages,
    scheduleFollowUpMessages
  };
};