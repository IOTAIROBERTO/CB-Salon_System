// src/services/emailService.tsx - VERSIÓN COMPLETA CORREGIDA

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailReminder {
  to: string;
  clienteName: string;
  servicioNombre: string;
  fecha: string;
  hora: string;
  notas?: string;
  type: 'confirmacion' | 'recordatorio' | 'cambio';
}

class EmailService {
  private isEmailJSLoaded = false;

  constructor() {
    this.initializeEmailJS();
  }

  private async initializeEmailJS() {
    try {
      // Cargar EmailJS automáticamente
      await this.loadEmailJS();
      
      // Obtener configuración guardada
      const emailConfig = this.getStoredConfig();
      if (emailConfig?.provider === 'emailjs' && emailConfig.emailjs?.publicKey) {
        if (window.emailjs) {
          window.emailjs.init(emailConfig.emailjs.publicKey);
          console.log('EmailJS inicializado automáticamente');
        }
      }
    } catch (error) {
      console.error('Error inicializando EmailJS:', error);
    }
  }

  private loadEmailJS(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.emailjs || this.isEmailJSLoaded) {
        this.isEmailJSLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => {
        this.isEmailJSLoaded = true;
        console.log('EmailJS library loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load EmailJS library');
        reject(new Error('Failed to load EmailJS'));
      };
      document.head.appendChild(script);
    });
  }

  private getStoredConfig() {
    try {
      const config = localStorage.getItem('emailConfig');
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error('Error reading email config:', error);
      return null;
    }
  }

  // Plantillas de email
  private getEmailTemplate(type: EmailReminder['type'], data: EmailReminder): EmailTemplate {
    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        return dateString;
      }
    };

    const formatTime = (timeString: string) => {
      try {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return timeString;
      }
    };

    const baseStyles = `
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .button { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    `;

    switch (type) {
      case 'confirmacion':
        return {
          subject: `✅ Confirmación de cita - ${data.clienteName}`,
          html: `
            ${baseStyles}
            <div class="email-container">
              <div class="header">
                <h1>✅ Cita Confirmada</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${data.clienteName}</strong>,</p>
                <p>Tu cita ha sido confirmada exitosamente:</p>
                
                <div class="appointment-card">
                  <h3>📅 Detalles de tu cita</h3>
                  <p><strong>Servicio:</strong> ${data.servicioNombre}</p>
                  <p><strong>Fecha:</strong> ${formatDate(data.fecha)}</p>
                  <p><strong>Hora:</strong> ${formatTime(data.hora)}</p>
                  ${data.notas ? `<p><strong>Notas:</strong> ${data.notas}</p>` : ''}
                </div>
                
                <p>Te esperamos puntualmente. Si necesitas cancelar o reprogramar, por favor contáctanos con al menos 24 horas de anticipación.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="tel:+525512345678" class="button">📞 Llamar al salón</a>
                </div>
              </div>
              <div class="footer">
                <p>¡Gracias por elegirnos!</p>
                <p>Beauty Salon Total Control</p>
              </div>
            </div>
          `,
          text: `
✅ Cita Confirmada

Hola ${data.clienteName},

Tu cita ha sido confirmada:

Servicio: ${data.servicioNombre}
Fecha: ${formatDate(data.fecha)}
Hora: ${formatTime(data.hora)}
${data.notas ? `Notas: ${data.notas}` : ''}

Te esperamos puntualmente.

Beauty Salon Total Control
          `.trim()
        };

      case 'recordatorio':
        return {
          subject: `⏰ Recordatorio: Tu cita es mañana - ${data.clienteName}`,
          html: `
            ${baseStyles}
            <div class="email-container">
              <div class="header">
                <h1>⏰ Recordatorio de Cita</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${data.clienteName}</strong>,</p>
                <p>Este es un recordatorio de que tienes una cita programada:</p>
                
                <div class="appointment-card">
                  <h3>📅 Tu cita</h3>
                  <p><strong>Servicio:</strong> ${data.servicioNombre}</p>
                  <p><strong>Fecha:</strong> ${formatDate(data.fecha)}</p>
                  <p><strong>Hora:</strong> ${formatTime(data.hora)}</p>
                  ${data.notas ? `<p><strong>Notas:</strong> ${data.notas}</p>` : ''}
                </div>
                
                <p><strong>💡 Recomendaciones:</strong></p>
                <ul>
                  <li>Llega 10 minutos antes de tu cita</li>
                  <li>Trae una foto de referencia si deseas un look específico</li>
                  <li>Si necesitas cancelar, hazlo con 24h de anticipación</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="tel:+525512345678" class="button">📞 Contactar salón</a>
                </div>
              </div>
              <div class="footer">
                <p>¡Te esperamos!</p>
                <p>Beauty Salon Total Control</p>
              </div>
            </div>
          `,
          text: `
⏰ Recordatorio de Cita

Hola ${data.clienteName},

Recordatorio de tu cita:

Servicio: ${data.servicioNombre}
Fecha: ${formatDate(data.fecha)}
Hora: ${formatTime(data.hora)}
${data.notas ? `Notas: ${data.notas}` : ''}

Llega 10 minutos antes.

Beauty Salon Total Control
          `.trim()
        };

      case 'cambio':
        return {
          subject: `📝 Cambio en tu cita - ${data.clienteName}`,
          html: `
            ${baseStyles}
            <div class="email-container">
              <div class="header">
                <h1>📝 Cambio de Cita</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${data.clienteName}</strong>,</p>
                <p>Hemos actualizado los detalles de tu cita:</p>
                
                <div class="appointment-card">
                  <h3>📅 Nueva información</h3>
                  <p><strong>Servicio:</strong> ${data.servicioNombre}</p>
                  <p><strong>Fecha:</strong> ${formatDate(data.fecha)}</p>
                  <p><strong>Hora:</strong> ${formatTime(data.hora)}</p>
                  ${data.notas ? `<p><strong>Notas:</strong> ${data.notas}</p>` : ''}
                </div>
                
                <p>Si tienes alguna pregunta sobre este cambio, no dudes en contactarnos.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="tel:+525512345678" class="button">📞 Llamar al salón</a>
                </div>
              </div>
              <div class="footer">
                <p>Gracias por tu comprensión</p>
                <p>Beauty Salon Total Control</p>
              </div>
            </div>
          `,
          text: `
📝 Cambio de Cita

Hola ${data.clienteName},

Hemos actualizado tu cita:

Servicio: ${data.servicioNombre}
Fecha: ${formatDate(data.fecha)}
Hora: ${formatTime(data.hora)}
${data.notas ? `Notas: ${data.notas}` : ''}

Beauty Salon Total Control
          `.trim()
        };

      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  // Enviar email usando EmailJS
  private async sendWithEmailJS(templateData: any): Promise<boolean> {
    try {
      // Asegurar que EmailJS esté cargado
      if (!window.emailjs) {
        await this.loadEmailJS();
      }

      if (!window.emailjs) {
        console.error('EmailJS no pudo cargarse');
        return false;
      }

      // Obtener configuración actual
      const config = this.getStoredConfig();
      if (!config?.emailjs?.serviceId || !config?.emailjs?.templateId) {
        console.error('Configuración de EmailJS incompleta');
        return false;
      }

      // Asegurar que EmailJS esté inicializado
      if (config.emailjs.publicKey) {
        window.emailjs.init(config.emailjs.publicKey);
      }

      console.log('Enviando email con EmailJS:', {
        serviceId: config.emailjs.serviceId,
        templateId: config.emailjs.templateId,
        templateData
      });

      const result = await window.emailjs.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        templateData
      );

      console.log('Resultado EmailJS:', result);
      return result.status === 200;
    } catch (error) {
      console.error('Error enviando email con EmailJS:', error);
      return false;
    }
  }

  // Método principal para enviar recordatorios
  async sendReminder(reminderData: EmailReminder): Promise<boolean> {
    try {
      const config = this.getStoredConfig();
      
      if (!config || config.provider === 'none') {
        console.log('No hay configuración de email');
        return false;
      }

      const template = this.getEmailTemplate(reminderData.type, reminderData);

      if (config.provider === 'emailjs') {
        const emailJSData = {
          to_email: reminderData.to,
          to_name: reminderData.clienteName,
          subject: template.subject,
          message: template.text,
          html_message: template.html
        };
        
        return await this.sendWithEmailJS(emailJSData);
      }

      if (config.provider === 'resend') {
        // Implementar Resend más tarde
        console.log('Resend no implementado aún');
        return false;
      }

      console.log('Proveedor de email no válido');
      return false;

    } catch (error) {
      console.error('Error enviando email reminder:', error);
      return false;
    }
  }

  // Programar recordatorios automáticos
  scheduleReminder(reminderData: EmailReminder, sendDate: Date): void {
    const now = new Date();
    const delay = sendDate.getTime() - now.getTime();

    if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Solo programar si es en las próximas 24 horas
      console.log(`Programando recordatorio para ${sendDate}`);
      setTimeout(async () => {
        console.log(`Enviando recordatorio programado para ${reminderData.clienteName}`);
        await this.sendReminder(reminderData);
      }, delay);
      
      // Guardar en localStorage para tracking
      try {
        const scheduledEmails = JSON.parse(localStorage.getItem('scheduledEmails') || '[]');
        scheduledEmails.push({
          ...reminderData,
          scheduledTime: sendDate.toISOString(),
          status: 'scheduled'
        });
        localStorage.setItem('scheduledEmails', JSON.stringify(scheduledEmails));
      } catch (error) {
        console.error('Error guardando email programado:', error);
      }
    } else {
      console.log(`No se puede programar: delay=${delay}ms`);
    }
  }

  // Verificar configuración
  isConfigured(): { emailjs: boolean; resend: boolean } {
    const config = this.getStoredConfig();
    
    const emailjsConfigured = !!(
      config?.provider === 'emailjs' &&
      config.emailjs?.serviceId && 
      config.emailjs?.templateId && 
      config.emailjs?.publicKey
    );
    
    const resendConfigured = !!(
      config?.provider === 'resend' &&
      config.resend?.apiKey && 
      config.resend?.from
    );

    return {
      emailjs: emailjsConfigured,
      resend: resendConfigured
    };
  }

  // Obtener estado de configuración
  getConfigurationStatus(): {
    isConfigured: boolean;
    provider: string;
    details: any;
  } {
    const config = this.getStoredConfig();
    const status = this.isConfigured();
    
    return {
      isConfigured: status.emailjs || status.resend,
      provider: config?.provider || 'none',
      details: {
        emailjs: status.emailjs,
        resend: status.resend
      }
    };
  }

  // Método para pruebas
  async testConfiguration(testEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const success = await this.sendReminder({
        to: testEmail,
        clienteName: 'Cliente de Prueba',
        servicioNombre: 'Prueba de Configuración',
        fecha: new Date().toISOString().split('T')[0],
        hora: '10:00',
        type: 'confirmacion',
        notas: 'Este es un email de prueba'
      });

      return {
        success,
        message: success ? 'Email enviado exitosamente' : 'Error al enviar email'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  // Limpiar emails programados antiguos
  cleanupScheduledEmails(): void {
    try {
      const scheduledEmails = JSON.parse(localStorage.getItem('scheduledEmails') || '[]');
      const now = new Date();
      
      const validEmails = scheduledEmails.filter((email: any) => {
        const scheduledTime = new Date(email.scheduledTime);
        return scheduledTime > now;
      });
      
      localStorage.setItem('scheduledEmails', JSON.stringify(validEmails));
      console.log(`Limpieza completada: ${scheduledEmails.length - validEmails.length} emails antiguos eliminados`);
    } catch (error) {
      console.error('Error limpiando emails programados:', error);
    }
  }

  // Obtener emails programados
  getScheduledEmails(): any[] {
    try {
      return JSON.parse(localStorage.getItem('scheduledEmails') || '[]');
    } catch (error) {
      console.error('Error obteniendo emails programados:', error);
      return [];
    }
  }

  // Reinicializar EmailJS con nueva configuración
  async reinitializeEmailJS(): Promise<boolean> {
    try {
      const config = this.getStoredConfig();
      if (config?.provider === 'emailjs' && config.emailjs?.publicKey) {
        await this.loadEmailJS();
        if (window.emailjs) {
          window.emailjs.init(config.emailjs.publicKey);
          console.log('EmailJS reinicializado exitosamente');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error reinicializando EmailJS:', error);
      return false;
    }
  }
}

// Crear instancia singleton
export const emailService = new EmailService();

// Declarar tipos para window
declare global {
  interface Window {
    emailjs: any;
  }
}