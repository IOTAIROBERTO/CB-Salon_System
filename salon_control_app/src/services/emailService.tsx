// services/emailService.ts

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
  private apiUrl = process.env.REACT_APP_EMAIL_API_URL || '';
  private apiKey = process.env.REACT_APP_EMAIL_API_KEY || '';

  // Configuración para diferentes proveedores de email
  private emailProviders = {
    emailjs: {
      serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || '',
      templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '',
      publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || ''
    },
    resend: {
      apiKey: process.env.REACT_APP_RESEND_API_KEY || '',
      from: process.env.REACT_APP_EMAIL_FROM || 'noreply@tusalon.com'
    }
  };

  constructor() {
    this.initializeEmailJS();
  }

  private async initializeEmailJS() {
    try {
      // Cargar EmailJS si está configurado
      if (this.emailProviders.emailjs.publicKey) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = () => {
          window.emailjs?.init(this.emailProviders.emailjs.publicKey);
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Error initializing EmailJS:', error);
    }
  }

  // Plantillas de email
  private getEmailTemplate(type: EmailReminder['type'], data: EmailReminder): EmailTemplate {
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

    const formatDate = (fecha: string) => {
      return new Date(fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (hora: string) => {
      return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    switch (type) {
      case 'confirmacion':
        return {
          subject: `Confirmación de cita - ${data.clienteName}`,
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
                <p>Tu Salón de Belleza</p>
              </div>
            </div>
          `,
          text: `
            Cita Confirmada
            
            Hola ${data.clienteName},
            
            Tu cita ha sido confirmada:
            
            Servicio: ${data.servicioNombre}
            Fecha: ${formatDate(data.fecha)}
            Hora: ${formatTime(data.hora)}
            ${data.notas ? `Notas: ${data.notas}` : ''}
            
            Te esperamos puntualmente.
            
            Tu Salón de Belleza
          `
        };

      case 'recordatorio':
        return {
          subject: `Recordatorio: Tu cita es mañana - ${data.clienteName}`,
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
                  <h3>📅 Tu cita de mañana</h3>
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
                <p>Tu Salón de Belleza</p>
              </div>
            </div>
          `,
          text: `
            Recordatorio de Cita
            
            Hola ${data.clienteName},
            
            Recordatorio de tu cita de mañana:
            
            Servicio: ${data.servicioNombre}
            Fecha: ${formatDate(data.fecha)}
            Hora: ${formatTime(data.hora)}
            ${data.notas ? `Notas: ${data.notas}` : ''}
            
            Llega 10 minutos antes.
            
            Tu Salón de Belleza
          `
        };

      case 'cambio':
        return {
          subject: `Cambio en tu cita - ${data.clienteName}`,
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
                <p>Tu Salón de Belleza</p>
              </div>
            </div>
          `,
          text: `
            Cambio de Cita
            
            Hola ${data.clienteName},
            
            Hemos actualizado tu cita:
            
            Servicio: ${data.servicioNombre}
            Fecha: ${formatDate(data.fecha)}
            Hora: ${formatTime(data.hora)}
            ${data.notas ? `Notas: ${data.notas}` : ''}
            
            Tu Salón de Belleza
          `
        };

      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  // Enviar email usando EmailJS (opción gratuita)
  private async sendWithEmailJS(templateData: any): Promise<boolean> {
    try {
      if (!window.emailjs || !this.emailProviders.emailjs.serviceId) {
        throw new Error('EmailJS not configured');
      }

      const result = await window.emailjs.send(
        this.emailProviders.emailjs.serviceId,
        this.emailProviders.emailjs.templateId,
        templateData
      );

      return result.status === 200;
    } catch (error) {
      console.error('Error sending email with EmailJS:', error);
      return false;
    }
  }

  // Enviar email usando Resend API (opción profesional)
  private async sendWithResend(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      if (!this.emailProviders.resend.apiKey) {
        throw new Error('Resend API not configured');
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.emailProviders.resend.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.emailProviders.resend.from,
          to: [to],
          subject: template.subject,
          html: template.html,
          text: template.text
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending email with Resend:', error);
      return false;
    }
  }

  // Método principal para enviar recordatorios
  async sendReminder(reminderData: EmailReminder): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(reminderData.type, reminderData);

      // Intentar con Resend primero (más profesional)
      if (this.emailProviders.resend.apiKey) {
        return await this.sendWithResend(reminderData.to, template);
      }

      // Fallback a EmailJS (gratuito)
      if (this.emailProviders.emailjs.serviceId) {
        const emailJSData = {
          to_email: reminderData.to,
          to_name: reminderData.clienteName,
          subject: template.subject,
          message: template.text,
          html_message: template.html
        };
        
        return await this.sendWithEmailJS(emailJSData);
      }

      // Si no hay ningún proveedor configurado, simular envío
      console.warn('No email provider configured, simulating email send');
      console.log('Email would be sent to:', reminderData.to);
      console.log('Subject:', template.subject);
      
      return true; // Simular éxito para desarrollo

    } catch (error) {
      console.error('Error sending email reminder:', error);
      return false;
    }
  }

  // Programar recordatorios automáticos
  scheduleReminder(reminderData: EmailReminder, sendDate: Date): void {
    const now = new Date();
    const delay = sendDate.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(async () => {
        await this.sendReminder(reminderData);
      }, delay);
    }
  }

  // Verificar configuración
  isConfigured(): { emailjs: boolean; resend: boolean } {
    return {
      emailjs: !!(this.emailProviders.emailjs.serviceId && this.emailProviders.emailjs.templateId),
      resend: !!this.emailProviders.resend.apiKey
    };
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