// services/whatsappService.ts

interface WhatsAppMessage {
  to: string;
  clienteName: string;
  servicioNombre: string;
  fecha: string;
  hora: string;
  notas?: string;
  type: 'confirmacion' | 'recordatorio' | 'cambio' | 'cancelacion';
  salonInfo?: {
    nombre: string;
    telefono: string;
    direccion: string;
  };
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromWhatsApp: string;
}

interface WhatsAppBusinessConfig {
  accessToken: string;
  phoneNumberId: string;
  version: string;
}

class WhatsAppService {
  private twilioConfig: TwilioConfig;
  private whatsappBusinessConfig: WhatsAppBusinessConfig;
  private salonInfo = { 
    nombre: 'Cristina Borquez Beauty Salon',
    telefono: '+52 1 662 341 9038',
    direccion: 'Saturnino Campoy y República de Panamá 83170 Hermosillo, Mexico',
    email: 'cristinaeborquez@gmail.com'
  };

  constructor() {
    // Configuración temporal - se pueden cambiar más tarde
    this.twilioConfig = {
      accountSid: '',
      authToken: '',
      fromWhatsApp: ''
    };

    this.whatsappBusinessConfig = {
      accessToken: '',
      phoneNumberId: '',
      version: 'v18.0'
    };
  }

  // Formatear número de teléfono para WhatsApp
  private formatPhoneNumber(phone: string): string {
    // Remover espacios, guiones y paréntesis
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con +, asumir que es México (+52)
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('52')) {
        cleanPhone = '+' + cleanPhone;
      } else if (cleanPhone.length === 10) {
        cleanPhone = '+52' + cleanPhone;
      } else {
        cleanPhone = '+52' + cleanPhone;
      }
    }
    
    return cleanPhone;
  }

  // Obtener plantillas de mensaje
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

    const salonName = data.salonInfo?.nombre || this.salonInfo.nombre;
    const salonPhone = data.salonInfo?.telefono || this.salonInfo.telefono;

    switch (type) {
      case 'confirmacion':
        return `
✅ *Cita Confirmada*

Hola ${data.clienteName} 👋

Tu cita ha sido confirmada exitosamente:

📅 *Detalles de tu cita:*
• Servicio: ${data.servicioNombre}
• Fecha: ${formatDate(data.fecha)}
• Hora: ${formatTime(data.hora)}
${data.notas ? `• Notas: ${data.notas}` : ''}

📍 *Ubicación:* ${this.salonInfo.direccion}

⏰ *Por favor llega 10 minutos antes*

Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.

📞 ${salonPhone}

¡Te esperamos! ✨
*${salonName}*
        `.trim();

      case 'recordatorio':
        return `
⏰ *Recordatorio de Cita*

Hola ${data.clienteName} 👋

Te recordamos que tienes una cita programada para *mañana*:

📅 *Tu cita:*
• Servicio: ${data.servicioNombre}
• Fecha: ${formatDate(data.fecha)}
• Hora: ${formatTime(data.hora)}
${data.notas ? `• Notas: ${data.notas}` : ''}

📍 *Ubicación:* ${this.salonInfo.direccion}

💡 *Recomendaciones:*
• Llega 10 minutos antes
• Trae una foto de referencia si deseas un look específico
• Si necesitas cancelar, hazlo con 24h de anticipación

📞 Para cualquier consulta: ${salonPhone}

¡Te esperamos! ✨
*${salonName}*
        `.trim();

      case 'cambio':
        return `
📝 *Cambio en tu Cita*

Hola ${data.clienteName} 👋

Hemos actualizado los detalles de tu cita:

📅 *Nueva información:*
• Servicio: ${data.servicioNombre}
• Fecha: ${formatDate(data.fecha)}
• Hora: ${formatTime(data.hora)}
${data.notas ? `• Notas: ${data.notas}` : ''}

📍 *Ubicación:* ${this.salonInfo.direccion}

Si tienes alguna pregunta sobre este cambio, no dudes en contactarnos.

📞 ${salonPhone}

Gracias por tu comprensión 🙏
*${salonName}*
        `.trim();

      case 'cancelacion':
        return `
❌ *Cita Cancelada*

Hola ${data.clienteName} 👋

Tu cita ha sido cancelada:

📅 *Cita cancelada:*
• Servicio: ${data.servicioNombre}
• Fecha: ${formatDate(data.fecha)}
• Hora: ${formatTime(data.hora)}

Si deseas reagendar, no dudes en contactarnos.

📞 ${salonPhone}

¡Esperamos verte pronto! ✨
*${salonName}*
        `.trim();

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }

  // Enviar usando WhatsApp Web (para desarrollo/demostración)
  private sendWithWhatsAppWeb(phone: string, message: string): boolean {
    try {
      const formattedPhone = this.formatPhoneNumber(phone).replace('+', '');
      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      
      // Abrir en nueva pestaña
      window.open(whatsappURL, '_blank');
      
      return true;
    } catch (error) {
      console.error('Error opening WhatsApp Web:', error);
      return false;
    }
  }

  // Método principal para enviar mensajes
  async sendMessage(messageData: WhatsAppMessage): Promise<{ success: boolean; method: string }> {
    try {
      const message = this.getMessageTemplate(messageData.type, messageData);

      // Por ahora solo usar WhatsApp Web para desarrollo
      const webSuccess = this.sendWithWhatsAppWeb(messageData.to, message);
      return { 
        success: webSuccess, 
        method: webSuccess ? 'WhatsApp Web' : 'Failed' 
      };

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, method: 'Error' };
    }
  }

  // Programar mensaje automático
  scheduleMessage(messageData: WhatsAppMessage, sendDate: Date): void {
    const now = new Date();
    const delay = sendDate.getTime() - now.getTime();

    if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Solo programar si es en las próximas 24 horas
      setTimeout(async () => {
        await this.sendMessage(messageData);
      }, delay);
    }
  }

  // Validar número de teléfono
  validatePhoneNumber(phone: string): { isValid: boolean; formatted: string; error?: string } {
    try {
      if (!phone || phone.trim() === '') {
        return { isValid: false, formatted: '', error: 'Número requerido' };
      }

      const formatted = this.formatPhoneNumber(phone);
      
      // Validaciones básicas
      if (formatted.length < 10) {
        return { isValid: false, formatted: '', error: 'Número muy corto' };
      }
      
      if (formatted.length > 15) {
        return { isValid: false, formatted: '', error: 'Número muy largo' };
      }

      if (!/^\+\d+$/.test(formatted)) {
        return { isValid: false, formatted: '', error: 'Formato inválido' };
      }

      return { isValid: true, formatted };
    } catch (error) {
      return { isValid: false, formatted: '', error: 'Error de validación' };
    }
  }

  // Verificar configuración
  getConfigurationStatus(): {
    twilio: boolean;
    whatsappBusiness: boolean;
    whatsappWeb: boolean;
  } {
    return {
      twilio: !!(this.twilioConfig.accountSid && this.twilioConfig.authToken),
      whatsappBusiness: !!(this.whatsappBusinessConfig.accessToken && this.whatsappBusinessConfig.phoneNumberId),
      whatsappWeb: true // Siempre disponible
    };
  }

  // Obtener plantilla de mensaje para preview
  getMessagePreview(type: WhatsAppMessage['type'], data: Partial<WhatsAppMessage>): string {
    const mockData: WhatsAppMessage = {
      to: '+521234567890',
      clienteName: data.clienteName || 'Cliente Ejemplo',
      servicioNombre: data.servicioNombre || 'Corte de cabello',
      fecha: data.fecha || new Date().toISOString().split('T')[0],
      hora: data.hora || '10:00',
      notas: data.notas || 'Sin notas especiales',
      type: type
    };

    return this.getMessageTemplate(type, mockData);
  }

  // Enviar mensaje de prueba
  async sendTestMessage(to: string): Promise<{ success: boolean; method: string }> {
    const testMessage: WhatsAppMessage = {
      to,
      clienteName: 'Cliente de Prueba',
      servicioNombre: 'Mensaje de Prueba',
      fecha: new Date().toISOString().split('T')[0],
      hora: '10:00',
      type: 'confirmacion',
      notas: 'Este es un mensaje de prueba del sistema'
    };

    return await this.sendMessage(testMessage);
  }
}

// Crear instancia singleton
export const whatsappService = new WhatsAppService();