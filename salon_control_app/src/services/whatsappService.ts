// services/whatsappService.ts

interface WhatsAppMessage {
  to: string;
  clienteName: string;
  servicioNombre: string;
  fecha: string;
  hora: string;
  notas?: string;
  type: 'confirmacion' | 'recordatorio' | 'cambio';
}

class WhatsAppService {
  private twilioConfig = {
    accountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID || '',
    authToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.REACT_APP_TWILIO_WHATSAPP_NUMBER || '+14155238886'
  };

  private businessConfig = {
    accessToken: process.env.REACT_APP_WHATSAPP_BUSINESS_TOKEN || '',
    phoneNumberId: process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID || ''
  };

  // Plantillas de mensajes de WhatsApp
  private getMessageTemplate(type: WhatsAppMessage['type'], data: WhatsAppMessage): string {
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

    const salonInfo = {
      nombre: 'Tu Salón de Belleza',
      telefono: '+52 55 1234 5678',
      direccion: 'Calle Principal #123, Ciudad'
    };

    switch (type) {
      case 'confirmacion':
        return `✅ *Cita Confirmada* ✅

¡Hola ${data.clienteName}!

Tu cita ha sido confirmada exitosamente:

📅 *Fecha:* ${formatDate(data.fecha)}
🕐 *Hora:* ${formatTime(data.hora)}
✂️ *Servicio:* ${data.servicioNombre}
${data.notas ? `📝 *Notas:* ${data.notas}` : ''}

📍 *Ubicación:* ${salonInfo.direccion}
📞 *Teléfono:* ${salonInfo.telefono}

Por favor llega 10 minutos antes de tu cita.

Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.

¡Te esperamos! 💄✨`;

      case 'recordatorio':
        return `⏰ *Recordatorio de Cita* ⏰

¡Hola ${data.clienteName}!

Este es un recordatorio de que tienes una cita mañana:

📅 *Fecha:* ${formatDate(data.fecha)}
🕐 *Hora:* ${formatTime(data.hora)}
✂️ *Servicio:* ${data.servicioNombre}
${data.notas ? `📝 *Notas:* ${data.notas}` : ''}

💡 *Recomendaciones:*
• Llega 10 minutos antes
• Trae una foto de referencia si deseas un look específico
• Si necesitas cancelar, hazlo con 24h de anticipación

📍 *Ubicación:* ${salonInfo.direccion}
📞 *Teléfono:* ${salonInfo.telefono}

¡Te esperamos mañana! 💄✨`;

      case 'cambio':
        return `📝 *Cambio en tu Cita* 📝

¡Hola ${data.clienteName}!

Hemos actualizado los detalles de tu cita:

📅 *Nueva Fecha:* ${formatDate(data.fecha)}
🕐 *Nueva Hora:* ${formatTime(data.hora)}
✂️ *Servicio:* ${data.servicioNombre}
${data.notas ? `📝 *Notas:* ${data.notas}` : ''}

📍 *Ubicación:* ${salonInfo.direccion}
📞 *Teléfono:* ${salonInfo.telefono}

Si tienes alguna pregunta sobre este cambio, no dudes en contactarnos.

¡Gracias por tu comprensión! 💄✨`;

      default:
        throw new Error(`Unknown message template type: ${type}`);
    }
  }

  // Enviar mensaje usando Twilio API
  private async sendWithTwilio(to: string, message: string): Promise<boolean> {
    try {
      if (!this.twilioConfig.accountSid || !this.twilioConfig.authToken) {
        throw new Error('Twilio credentials not configured');
      }

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.twilioConfig.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.twilioConfig.accountSid}:${this.twilioConfig.authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${this.twilioConfig.whatsappNumber}`,
          To: `whatsapp:${to}`,
          Body: message
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending WhatsApp message with Twilio:', error);
      return false;
    }
  }

  // Enviar mensaje usando WhatsApp Business API
  private async sendWithBusinessAPI(to: string, message: string): Promise<boolean> {
    try {
      if (!this.businessConfig.accessToken || !this.businessConfig.phoneNumberId) {
        throw new Error('WhatsApp Business API credentials not configured');
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${this.businessConfig.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.businessConfig.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace('+', ''),
          type: 'text',
          text: {
            body: message
          }
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending WhatsApp message with Business API:', error);
      return false;
    }
  }

  // Método para abrir WhatsApp Web (fallback)
  private openWhatsAppWeb(to: string, message: string): boolean {
    try {
      const encodedMessage = encodeURIComponent(message);
      const phoneNumber = to.replace(/\D/g, '');
      const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      window.open(url, '_blank');
      return true;
    } catch (error) {
      console.error('Error opening WhatsApp Web:', error);
      return false;
    }
  }

  // Método principal para enviar mensajes de WhatsApp
  async sendMessage(messageData: WhatsAppMessage): Promise<boolean> {
    try {
      const message = this.getMessageTemplate(messageData.type, messageData);

      // Intentar con WhatsApp Business API primero (más profesional)
      if (this.businessConfig.accessToken && this.businessConfig.phoneNumberId) {
        const success = await this.sendWithBusinessAPI(messageData.to, message);
        if (success) return true;
      }

      // Fallback a Twilio
      if (this.twilioConfig.accountSid && this.twilioConfig.authToken) {
        const success = await this.sendWithTwilio(messageData.to, message);
        if (success) return true;
      }

      // Fallback final: abrir WhatsApp Web
      console.warn('No WhatsApp API configured, opening WhatsApp Web');
      return this.openWhatsAppWeb(messageData.to, message);

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  // Programar recordatorios automáticos
  scheduleReminder(messageData: WhatsAppMessage, sendDate: Date): void {
    const now = new Date();
    const delay = sendDate.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(async () => {
        await this.sendMessage(messageData);
      }, delay);
    }
  }

  // Verificar configuración
  isConfigured(): { twilio: boolean; business: boolean; webOnly: boolean } {
    const twilioConfigured = !!(this.twilioConfig.accountSid && this.twilioConfig.authToken);
    const businessConfigured = !!(this.businessConfig.accessToken && this.businessConfig.phoneNumberId);
    
    return {
      twilio: twilioConfigured,
      business: businessConfigured,
      webOnly: !twilioConfigured && !businessConfigured
    };
  }

  // Validar número de teléfono para WhatsApp
  isValidWhatsAppNumber(phone: string): boolean {
    // Remover espacios y caracteres especiales
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verificar que tenga al menos 10 dígitos (formato internacional)
    return cleanPhone.length >= 10;
  }

  // Formatear número para WhatsApp
  formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Si no empieza con código de país, asumir México (+52)
    if (!cleanPhone.startsWith('52') && cleanPhone.length === 10) {
      return `+52${cleanPhone}`;
    }
    
    return `+${cleanPhone}`;
  }
}

// Crear instancia singleton
export const whatsappService = new WhatsAppService();