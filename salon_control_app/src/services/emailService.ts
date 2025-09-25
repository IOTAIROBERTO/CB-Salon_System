// services/emailService.tsx - Versión actualizada

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
  type: 'confirmacion' | 'recordatorio' | 'cambio' | 'promocional' | 'cumpleanos';
}

class EmailService {
  private emailProviders = {
    emailjs: {
      serviceId: '',
      templateId: '',
      publicKey: '',
      fromEmail: '',
      fromName: ''
    }
  };

  constructor() {
    this.loadConfiguration();
    this.initializeEmailJS();
  }

  private loadConfiguration() {
    try {
      const emailConfig = JSON.parse(localStorage.getItem('emailConfig') || '{}');
      this.emailProviders.emailjs = {
        ...this.emailProviders.emailjs,
        ...emailConfig
      };
    } catch (error) {
      console.error('Error loading email configuration:', error);
    }
  }

  private async initializeEmailJS() {
    try {
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

  // Recargar configuración desde localStorage
  public reloadConfiguration() {
    this.loadConfiguration();
    this.initializeEmailJS();
  }

  private getEmailTemplate(type: EmailReminder['type'], data: EmailReminder): EmailTemplate {
    const baseStyles = `
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .button { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .promo-card { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
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

    const generalConfig = JSON.parse(localStorage.getItem('generalConfig') || '{}');
    const salonName = generalConfig.salonName || 'Beauty Salon Total Control';
    const salonPhone = generalConfig.salonPhone || '+52 55 1234-5678';

    switch (type) {
      case 'confirmacion':
        return {
          subject: `✅ Cita Confirmada - ${data.clienteName}`,
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
                  <a href="tel:${salonPhone}" class="button">📞 Llamar al salón</a>
                </div>
              </div>
              <div class="footer">
                <p>¡Gracias por elegirnos!</p>
                <p>${salonName}</p>
              </div>
            </div>
          `,
          text: `Cita Confirmada - ${data.clienteName}\n\nTu cita ha sido confirmada:\n\nServicio: ${data.servicioNombre}\nFecha: ${formatDate(data.fecha)}\nHora: ${formatTime(data.hora)}\n\n${salonName}`
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
                  <a href="tel:${salonPhone}" class="button">📞 Contactar salón</a>
                </div>
              </div>
              <div class="footer">
                <p>¡Te esperamos!</p>
                <p>${salonName}</p>
              </div>
            </div>
          `,
          text: `Recordatorio de Cita - ${data.clienteName}\n\nTu cita de mañana:\n\nServicio: ${data.servicioNombre}\nFecha: ${formatDate(data.fecha)}\nHora: ${formatTime(data.hora)}\n\n${salonName}`
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
                  <a href="tel:${salonPhone}" class="button">📞 Llamar al salón</a>
                </div>
              </div>
              <div class="footer">
                <p>Gracias por tu comprensión</p>
                <p>${salonName}</p>
              </div>
            </div>
          `,
          text: `Cambio de Cita - ${data.clienteName}\n\nNueva información:\n\nServicio: ${data.servicioNombre}\nFecha: ${formatDate(data.fecha)}\nHora: ${formatTime(data.hora)}\n\n${salonName}`
        };

      case 'promocional':
        return {
          subject: `🎉 Oferta especial para ti - ${data.clienteName}`,
          html: `
            ${baseStyles}
            <div class="email-container">
              <div class="header">
                <h1>🎉 Oferta Especial</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${data.clienteName}</strong>,</p>
                <p>¡Tenemos una oferta especial pensada especialmente para ti!</p>
                
                <div class="promo-card">
                  <h3 style="color: white; margin-top: 0;">✨ ${data.servicioNombre}</h3>
                  <p style="color: white; font-size: 18px; margin: 15px 0;">
                    Aprovecha esta promoción limitada y luce espectacular
                  </p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="tel:${salonPhone}" style="background: white; color: #7c3aed; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                      📞 Reservar ahora
                    </a>
                  </div>
                </div>
                
                <p><strong>⏰ Oferta válida por tiempo limitado</strong></p>
                <p>No dejes pasar esta oportunidad de consentirte.</p>
                
                ${data.notas ? `<p><em>${data.notas}</em></p>` : ''}
              </div>
              <div class="footer">
                <p>¡Te esperamos!</p>
                <p>${salonName}</p>
              </div>
            </div>
          `,
          text: `Oferta Especial - ${data.clienteName}\n\n${data.servicioNombre}\n\nAprovecha esta promoción limitada.\n\nLlama al ${salonPhone} para reservar.\n\n${salonName}`
        };

      case 'cumpleanos':
        return {
          subject: `🎂 ¡Feliz Cumpleaños ${data.clienteName}! Regalo especial`,
          html: `
            ${baseStyles}
            <div class="email-container">
              <div class="header">
                <h1>🎂 ¡Feliz Cumpleaños!</h1>
              </div>
              <div class="content">
                <p>Querida <strong>${data.clienteName}</strong>,</p>
                <p>¡En tu día especial queremos celebrar contigo!</p>
                
                <div class="promo-card">
                  <h3 style="color: white; margin-top: 0;">🎁 Regalo de Cumpleaños</h3>
                  <p style="color: white; font-size: 18px; margin: 15px 0;">
                    Disfruta de un descuento especial en cualquiera de nuestros servicios
                  </p>
                  <div style="text-align: center; margin: 20px 0;">
                    <div style="background: white; color: #7c3aed; padding: 15px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 24px;">
                      20% OFF
                    </div>
                  </div>
                </div>
                
                <p>Válido durante todo tu mes de cumpleaños. ¡Ven a celebrar con nosotros!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="tel:${salonPhone}" class="button">📞 Reservar mi regalo</a>
                </div>
              </div>
              <div class="footer">
                <p>¡Que tengas un día maravilloso!</p>
                <p>${salonName}</p>
              </div>
            </div>
          `,
          text: `¡Feliz Cumpleaños ${data.clienteName}!\n\nTenemos un regalo especial para ti: 20% de descuento en cualquier servicio.\n\nVálido durante todo tu mes de cumpleaños.\n\nLlama al ${salonPhone} para reservar.\n\n${salonName}`
        };

      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  // Enviar email usando EmailJS
  private async sendWithEmailJS(templateData: any): Promise<boolean> {
    try {
      if (!window.emailjs || !this.emailProviders.emailjs.serviceId) {
        console.log('EmailJS not configured');
        return false;
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

  // Método principal para enviar recordatorios
  async sendReminder(reminderData: EmailReminder): Promise<boolean> {
    try {
      // Recargar configuración antes de enviar
      this.loadConfiguration();
      
      const template = this.getEmailTemplate(reminderData.type, reminderData);

      // Intentar con EmailJS si está configurado
      if (this.emailProviders.emailjs.serviceId && this.emailProviders.emailjs.templateId) {
        const emailJSData = {
          to_email: reminderData.to,
          to_name: reminderData.clienteName,
          subject: template.subject,
          message: template.text,
          html_message: template.html,
          from_name: this.emailProviders.emailjs.fromName || 'Beauty Salon',
          reply_to: this.emailProviders.emailjs.fromEmail || 'salon@example.com'
        };
        
        return await this.sendWithEmailJS(emailJSData);
      }

      // Si no hay configuración, simular envío para desarrollo
      console.log('Email service not configured, simulating email send');
      console.log('Email would be sent to:', reminderData.to);
      console.log('Subject:', template.subject);
      
      return true; // Simular éxito para desarrollo

    } catch (error) {
      console.error('Error sending email reminder:', error);
      return false;
    }
  }

  // Enviar mensaje de prueba
  async sendTestMessage(to: string): Promise<boolean> {
    const testMessage: EmailReminder = {
      to,
      clienteName: 'Cliente de Prueba',
      servicioNombre: 'Mensaje de Prueba del Sistema',
      fecha: new Date().toISOString().split('T')[0],
      hora: '10:00',
      type: 'confirmacion',
      notas: 'Este es un email de prueba para verificar la configuración de EmailJS'
    };

    return await this.sendReminder(testMessage);
  }

  // Programar recordatorios automáticos
  scheduleReminder(reminderData: EmailReminder, sendDate: Date): void {
    const now = new Date();
    const delay = sendDate.getTime() - now.getTime();

    if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Solo programar si es en las próximas 24 horas
      setTimeout(async () => {
        await this.sendReminder(reminderData);
      }, delay);
    }
  }

  // Verificar configuración
  isConfigured(): { emailjs: boolean } {
    return {
      emailjs: !!(this.emailProviders.emailjs.serviceId && 
                 this.emailProviders.emailjs.templateId && 
                 this.emailProviders.emailjs.publicKey)
    };
  }

  // Obtener estado de la configuración
  getConfigurationStatus(): {
    isConfigured: boolean;
    serviceId: boolean;
    templateId: boolean;
    publicKey: boolean;
  } {
    return {
      isConfigured: this.isConfigured().emailjs,
      serviceId: !!this.emailProviders.emailjs.serviceId,
      templateId: !!this.emailProviders.emailjs.templateId,
      publicKey: !!this.emailProviders.emailjs.publicKey
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