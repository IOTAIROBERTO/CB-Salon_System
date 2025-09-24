// src/services/emailService.ts - SERVICIO CONSOLIDADO Y OPTIMIZADO

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface EmailReminder {
  to: string;
  clienteName: string;
  servicioNombre: string;
  fecha: string;
  hora: string;
  notas?: string;
  type: 'confirmacion' | 'recordatorio' | 'cambio' | 'promocional' | 'cumpleanos';
}

export interface CampaignEmail {
  to: string;
  clienteName: string;
  subject: string;
  message: string;
  type: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailStatus {
  isConfigured: boolean;
  isInitialized: boolean;
  lastError?: string;
}

class EmailService {
  private static instance: EmailService;
  private config: EmailJSConfig & { isConfigured: boolean } = {
    serviceId: '',
    templateId: '',
    publicKey: '',
    isConfigured: false
  };
  private isInitializing = false;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {
    this.loadConfiguration();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // ============ CONFIGURACIÓN ============
  private loadConfiguration(): void {
    try {
      const savedConfig = localStorage.getItem('emailJSConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.config = {
          serviceId: parsedConfig.serviceId || '',
          templateId: parsedConfig.templateId || '',
          publicKey: parsedConfig.publicKey || '',
          isConfigured: !!(parsedConfig.serviceId && parsedConfig.templateId && parsedConfig.publicKey)
        };
      }
    } catch (error) {
      console.error('Error loading email configuration:', error);
    }
  }

  updateConfig(newConfig: Partial<EmailJSConfig>): { success: boolean; error?: string } {
    try {
      this.config = {
        ...this.config,
        ...newConfig,
        isConfigured: !!(
          (newConfig.serviceId || this.config.serviceId) &&
          (newConfig.templateId || this.config.templateId) &&
          (newConfig.publicKey || this.config.publicKey)
        )
      };

      localStorage.setItem('emailJSConfig', JSON.stringify({
        serviceId: this.config.serviceId,
        templateId: this.config.templateId,
        publicKey: this.config.publicKey
      }));

      // Re-inicializar si la configuración es válida
      if (this.config.isConfigured) {
        this.initializationPromise = null; // Reset initialization
        this.initialize();
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error updating configuration' 
      };
    }
  }

  getStatus(): EmailStatus {
    return {
      isConfigured: this.config.isConfigured,
      isInitialized: !!window.emailjs,
      lastError: undefined
    };
  }

  // ============ INICIALIZACIÓN ============
  async initialize(): Promise<boolean> {
    // Si ya se está inicializando, retornar la promesa existente
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Si ya está inicializado, retornar true
    if (window.emailjs && this.config.isConfigured) {
      return true;
    }

    // Crear nueva promesa de inicialización
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<boolean> {
    if (!this.config.isConfigured) {
      console.warn('EmailJS configuration is incomplete');
      return false;
    }

    try {
      this.isInitializing = true;
      await this.loadEmailJSScript();
      
      if (window.emailjs && this.config.publicKey) {
        window.emailjs.init(this.config.publicKey);
        console.log('✅ EmailJS initialized successfully');
        return true;
      }
      
      throw new Error('EmailJS not available after loading script');
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  private loadEmailJSScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Si EmailJS ya está cargado, resolver inmediatamente
      if (window.emailjs) {
        resolve();
        return;
      }

      // Si ya existe un script cargándose, esperar
      const existingScript = document.querySelector('script[src*="emailjs"]');
      if (existingScript) {
        const checkLoaded = () => {
          if (window.emailjs) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Crear y cargar nuevo script
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('📧 EmailJS script loaded');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load EmailJS script'));
      };
      
      document.head.appendChild(script);
    });
  }

  // ============ PLANTILLAS DE EMAIL ============
  private getEmailTemplate(type: EmailReminder['type'], data: EmailReminder): EmailTemplate {
    const formatDate = (fecha: string) => {
      try {
        return new Date(fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return fecha;
      }
    };

    const formatTime = (hora: string) => {
      try {
        return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return hora;
      }
    };

    // Obtener configuración del salón
    const salonConfig = this.getSalonConfig();
    const baseStyles = this.getEmailStyles();

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
                
                <p>Te esperamos puntualmente. Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="tel:${salonConfig.telefono}" class="button">📞 Llamar al salón</a>
                </div>
              </div>
              <div class="footer">
                <p>¡Gracias por elegirnos!</p>
                <p>${salonConfig.nombre}</p>
              </div>
            </div>
          `,
          text: `Cita Confirmada - ${data.clienteName}\n\nTu cita ha sido confirmada:\n\nServicio: ${data.servicioNombre}\nFecha: ${formatDate(data.fecha)}\nHora: ${formatTime(data.hora)}\n\n${salonConfig.nombre}`
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
                  <a href="tel:${salonConfig.telefono}" class="button">📞 Contactar salón</a>
                </div>
              </div>
              <div class="footer">
                <p>¡Te esperamos!</p>
                <p>${salonConfig.nombre}</p>
              </div>
            </div>
          `,
          text: `Recordatorio de Cita - ${data.clienteName}\n\nTu cita de mañana:\n\nServicio: ${data.servicioNombre}\nFecha: ${formatDate(data.fecha)}\nHora: ${formatTime(data.hora)}\n\n${salonConfig.nombre}`
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
                  <a href="tel:${salonConfig.telefono}" class="button">📞 Llamar al salón</a>
                </div>
              </div>
              <div class="footer">
                <p>Gracias por tu comprensión</p>
                <p>${salonConfig.nombre}</p>
              </div>
            </div>
          `,
          text: `Cambio de Cita - ${data.clienteName}\n\nNueva información:\n\nServicio: ${data.servicioNombre}\nFecha: ${formatDate(data.fecha)}\nHora: ${formatTime(data.hora)}\n\n${salonConfig.nombre}`
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
                    <a href="tel:${salonConfig.telefono}" style="background: white; color: #7c3aed; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
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
                <p>${salonConfig.nombre}</p>
              </div>
            </div>
          `,
          text: `Oferta Especial - ${data.clienteName}\n\n${data.servicioNombre}\n\nAprovecha esta promoción limitada.\n\nLlama al ${salonConfig.telefono} para reservar.\n\n${salonConfig.nombre}`
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
                  <a href="tel:${salonConfig.telefono}" class="button">📞 Reservar mi regalo</a>
                </div>
              </div>
              <div class="footer">
                <p>¡Que tengas un día maravilloso!</p>
                <p>${salonConfig.nombre}</p>
              </div>
            </div>
          `,
          text: `¡Feliz Cumpleaños ${data.clienteName}!\n\nTenemos un regalo especial para ti: 20% de descuento en cualquier servicio.\n\nVálido durante todo tu mes de cumpleaños.\n\nLlama al ${salonConfig.telefono} para reservar.\n\n${salonConfig.nombre}`
        };

      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  private getEmailStyles(): string {
    return `
      <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9fafb; }
        .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f3f4f6; border-radius: 0 0 8px 8px; }
        .promo-card { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
      </style>
    `;
  }

  private getSalonConfig() {
    try {
      const config = JSON.parse(localStorage.getItem('configuracion_empresa') || '{}');
      return {
        nombre: config.nombre || 'Beauty Salon Total Control',
        telefono: config.telefono || '+52 55 1234-5678',
        direccion: config.direccion || 'Calle Principal 123, Col. Centro',
        email: config.email || 'contacto@beautysalon.com'
      };
    } catch {
      return {
        nombre: 'Beauty Salon Total Control',
        telefono: '+52 55 1234-5678',
        direccion: 'Calle Principal 123, Col. Centro',
        email: 'contacto@beautysalon.com'
      };
    }
  }

  // ============ ENVÍO DE EMAILS ============
  async sendEmail(data: EmailReminder | CampaignEmail): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar configuración
      if (!this.config.isConfigured) {
        return { success: false, error: 'EmailJS no está configurado. Ve a Configuración para completar la configuración.' };
      }

      // Asegurar inicialización
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'No se pudo inicializar EmailJS. Verifica tu configuración.' };
      }

      // Preparar datos del template
      const templateParams = this.buildTemplateParams(data);
      
      // Enviar email
      const result = await window.emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      if (result.status === 200) {
        console.log('✅ Email sent successfully');
        return { success: true };
      } else {
        return { success: false, error: `Error del servidor: Status ${result.status}` };
      }

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      
      // Mensajes de error más específicos
      let errorMessage = 'Error desconocido al enviar email';
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message;
        
        if (message.includes('422')) {
          errorMessage = 'Error 422: El template de EmailJS no está configurado correctamente. Verifica que tu template tenga las variables: to_email, to_name, subject, message, html_message';
        } else if (message.includes('401')) {
          errorMessage = 'Error 401: Public Key inválido. Verifica tu Public Key en la configuración.';
        } else if (message.includes('404')) {
          errorMessage = 'Error 404: Service ID o Template ID no encontrado. Verifica tus credenciales.';
        } else {
          errorMessage = message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  private buildTemplateParams(data: EmailReminder | CampaignEmail): any {
    // Para emails de recordatorio/cita
    if ('type' in data && typeof data.type === 'string') {
      const reminderData = data as EmailReminder;
      const template = this.getEmailTemplate(reminderData.type, reminderData);
      
      return {
        to_email: data.to,
        to_name: data.clienteName,
        subject: template.subject,
        message: template.text,
        html_message: template.html,
        from_name: this.getSalonConfig().nombre,
        reply_to: this.getSalonConfig().email
      };
    }
    
    // Para emails de campaña
    const campaignData = data as CampaignEmail;
    return {
      to_email: data.to,
      to_name: data.clienteName,
      subject: campaignData.subject,
      message: campaignData.message,
      html_message: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${campaignData.message.replace(/\n/g, '<br>')}</div>`,
      from_name: this.getSalonConfig().nombre,
      reply_to: this.getSalonConfig().email
    };
  }

  // ============ MÉTODOS ESPECÍFICOS ============
  async sendReminder(data: EmailReminder): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail(data);
  }

  async sendCampaignEmail(data: CampaignEmail): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail(data);
  }

  async sendTestEmail(email: string): Promise<{ success: boolean; error?: string }> {
    const testData: EmailReminder = {
      to: email,
      clienteName: 'Cliente de Prueba',
      servicioNombre: 'Prueba de Configuración EmailJS',
      fecha: new Date().toISOString().split('T')[0],
      hora: '10:00',
      type: 'confirmacion',
      notas: 'Este es un email de prueba para verificar que la configuración de EmailJS está funcionando correctamente.'
    };

    const result = await this.sendEmail(testData);
    
    if (result.success) {
      console.log('✅ Test email sent successfully to', email);
    } else {
      console.error('❌ Test email failed:', result.error);
    }
    
    return result;
  }

  // ============ UTILIDADES ============
  scheduleReminder(reminderData: EmailReminder, sendDate: Date): void {
    const now = new Date();
    const delay = sendDate.getTime() - now.getTime();

    if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Solo programar si es en las próximas 24 horas
      setTimeout(async () => {
        const result = await this.sendReminder(reminderData);
        if (result.success) {
          console.log(`✅ Scheduled reminder sent to ${reminderData.clienteName}`);
        } else {
          console.error(`❌ Scheduled reminder failed: ${result.error}`);
        }
      }, delay);
    }
  }

  validateConfig(config: EmailJSConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.serviceId || config.serviceId.trim() === '') {
      errors.push('Service ID es requerido');
    } else if (!config.serviceId.startsWith('service_')) {
      errors.push('Service ID debe comenzar con "service_"');
    }

    if (!config.templateId || config.templateId.trim() === '') {
      errors.push('Template ID es requerido');
    } else if (!config.templateId.startsWith('template_')) {
      errors.push('Template ID debe comenzar con "template_"');
    }

    if (!config.publicKey || config.publicKey.trim() === '') {
      errors.push('Public Key es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ============ LIMPIEZA ============
  cleanup(): void {
    this.initializationPromise = null;
    // Note: No removemos el script de EmailJS porque podría ser usado por otras partes
  }
}

// ============ EXPORTACIONES ============
export const emailService = EmailService.getInstance();

// Declarar tipos para window
declare global {
  interface Window {
    emailjs: any;
  }
}

// Funciones de conveniencia para mantener compatibilidad
export const sendReminder = (data: EmailReminder) => emailService.sendReminder(data);
export const sendCampaignEmail = (data: CampaignEmail) => emailService.sendCampaignEmail(data);
export const sendTestEmail = (email: string) => emailService.sendTestEmail(email);
export const updateEmailConfig = (config: Partial<EmailJSConfig>) => emailService.updateConfig(config);
export const getEmailStatus = () => emailService.getStatus();