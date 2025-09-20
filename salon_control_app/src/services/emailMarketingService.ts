// src/services/emailMarketingService.ts
import { 
  EmailCampaign, 
  EmailRecipient, 
  CampaignType, 
  EmailTemplate,
  EmailQueue,
  CampaignConfig 
} from '../types/email';
import { Cliente } from '../types/clientes';
import { loadEmailJS } from '../utils/emailJSLoader';

class EmailMarketingService {
  private templates: Map<CampaignType, EmailTemplate> = new Map();
  private queue: EmailQueue[] = [];
  
  // Configuración de proveedores de email
  private providers = {
    emailjs: {
      serviceId: '',
      templateId: '',
      publicKey: '',
      isConfigured: false
    },
    resend: {
      apiKey: '',
      from: 'hola@tusalon.com',
      isConfigured: false
    }
  };

  constructor() {
    this.initializeTemplates();
    this.loadConfiguration();
    this.loadQueue();
  }

  // Cargar configuración desde localStorage
  private loadConfiguration() {
    const config = localStorage.getItem('emailProviderConfig');
    if (config) {
      try {
        const parsed = JSON.parse(config);
        Object.assign(this.providers, parsed);
      } catch (error) {
        console.error('Error loading email configuration:', error);
      }
    }
  }

  // Cargar cola desde localStorage
  private loadQueue() {
    const queue = localStorage.getItem('emailQueue');
    if (queue) {
      try {
        this.queue = JSON.parse(queue);
      } catch (error) {
        console.error('Error loading email queue:', error);
        this.queue = [];
      }
    }
  }

  // Estilos CSS base para emails
  private getBaseEmailStyles(): string {
    return `
      <style>
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          font-family: 'Arial', sans-serif; 
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .birthday-header { 
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
        }
        .valentine-header { 
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .christmas-header { 
          background: linear-gradient(135deg, #a8e6cf 0%, #d4af37 100%);
        }
        .content { 
          padding: 30px 20px; 
          background: #f8f9ff; 
        }
        .card { 
          background: white; 
          padding: 25px; 
          border-radius: 12px; 
          margin-bottom: 20px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .offer-card { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 25px; 
          border-radius: 12px; 
          text-align: center; 
          margin: 25px 0;
        }
        .valentine-offer {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .christmas-offer {
          background: linear-gradient(135deg, #a8e6cf 0%, #d4af37 100%);
        }
        .discount-badge { 
          background: rgba(255,255,255,0.2); 
          padding: 15px 25px; 
          border-radius: 25px; 
          font-size: 24px; 
          font-weight: bold; 
          margin: 10px 0;
          display: inline-block;
        }
        .cta-button { 
          background: #ffffff; 
          color: #667eea; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 25px; 
          display: inline-block; 
          font-weight: bold;
          margin: 20px 0;
          transition: transform 0.3s ease;
        }
        .valentine-cta { color: #f5576c; }
        .christmas-cta { color: #d4af37; }
        .footer { 
          text-align: center; 
          padding: 25px; 
          color: #666; 
          background: #f1f1f1;
        }
        .validity {
          font-size: 14px;
          margin-top: 10px;
          opacity: 0.9;
        }
        h1 { margin: 0; font-size: 28px; }
        h2 { color: #333; margin-top: 0; }
        h3 { margin-top: 0; }
        h4 { color: #667eea; }
        @media (max-width: 600px) {
          .email-container { margin: 10px; }
          .content { padding: 20px 15px; }
        }
      </style>
    `;
  }

  // Inicializar plantillas predeterminadas
  private initializeTemplates() {
    const baseStyles = this.getBaseEmailStyles();
    
    // Plantilla de cumpleaños
    this.templates.set('cumpleanos', {
      id: 'tpl_cumpleanos',
      tipo: 'cumpleanos',
      nombre: 'Feliz Cumpleaños',
      asunto: '🎂 ¡Feliz Cumpleaños {{NOMBRE}}! Tenemos una sorpresa para ti',
      contenidoHtml: `
        ${baseStyles}
        <div class="email-container">
          <div class="header birthday-header">
            <h1>🎂 ¡Feliz Cumpleaños!</h1>
          </div>
          <div class="content">
            <div class="card">
              <h2>¡Querida {{NOMBRE}}!</h2>
              <p>En tu día especial queremos celebrarte con un regalo muy especial:</p>
              
              <div class="offer-card">
                <h3>🎁 Regalo de Cumpleaños</h3>
                <div class="discount-badge">{{DESCUENTO}}% de descuento</div>
                <p>En cualquier servicio que elijas</p>
                <p class="validity">Válido hasta: {{VALIDEZ_DESCUENTO}}</p>
              </div>
              
              <div>
                <h4>✨ Servicios perfectos para tu celebración:</h4>
                <ul>
                  <li>🌟 Corte y peinado de fiesta</li>
                  <li>💅 Manicure y pedicure completo</li>
                  <li>✨ Tratamiento facial hidratante</li>
                  <li>🎨 Maquillaje profesional</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="tel:{{SALON_TELEFONO}}" class="cta-button">
                  📞 ¡Agenda tu cita de cumpleaños!
                </a>
              </div>
            </div>
            
            <div style="background: #e8f2ff; padding: 20px; border-radius: 10px; font-style: italic;">
              <p>Esperamos que tengas un día lleno de alegría, sorpresas y momentos especiales. ¡Ven a celebrar con nosotras!</p>
            </div>
          </div>
          <div class="footer">
            <p>Con cariño,</p>
            <p><strong>{{SALON_NOMBRE}}</strong></p>
            <p>{{SALON_DIRECCION}} | {{SALON_TELEFONO}}</p>
          </div>
        </div>
      `,
      contenidoTexto: `
        ¡Feliz Cumpleaños {{NOMBRE}}!
        
        En tu día especial queremos celebrarte con un regalo:
        
        🎁 {{DESCUENTO}}% de descuento en cualquier servicio
        Válido hasta: {{VALIDEZ_DESCUENTO}}
        
        Servicios perfectos para tu celebración:
        - Corte y peinado de fiesta
        - Manicure y pedicure completo
        - Tratamiento facial hidratante
        - Maquillaje profesional
        
        ¡Agenda tu cita! {{SALON_TELEFONO}}
        
        Con cariño,
        {{SALON_NOMBRE}}
      `,
      variables: ['NOMBRE', 'DESCUENTO', 'VALIDEZ_DESCUENTO', 'SALON_NOMBRE', 'SALON_TELEFONO', 'SALON_DIRECCION'],
      esPersonalizable: true,
      fechaCreacion: new Date().toISOString()
    });

    // Plantilla de San Valentín
    this.templates.set('san_valentin', {
      id: 'tpl_san_valentin',
      tipo: 'san_valentin',
      nombre: 'San Valentín',
      asunto: '💕 San Valentín: Date amor propio con {{DESCUENTO}}% de descuento',
      contenidoHtml: `
        ${baseStyles}
        <div class="email-container">
          <div class="header valentine-header">
            <h1>💕 San Valentín</h1>
            <p>El amor empieza contigo</p>
          </div>
          <div class="content">
            <div class="card">
              <h2>¡Querida {{NOMBRE}}!</h2>
              <p>Este San Valentín, queremos recordarte lo especial que eres. ¡Date el regalo del amor propio!</p>
              
              <div class="offer-card valentine-offer">
                <h3>💖 Oferta Especial de San Valentín</h3>
                <div class="discount-badge">{{DESCUENTO}}% OFF</div>
                <p>En todos nuestros servicios de belleza</p>
                <p class="validity">Válido hasta: {{VALIDEZ_DESCUENTO}}</p>
              </div>
              
              <div>
                <h4>💅 Perfecto para San Valentín:</h4>
                <ul>
                  <li>💇‍♀️ Corte + Peinado</li>
                  <li>💅 Manicure Romantic</li>
                  <li>✨ Facial Hidratante</li>
                  <li>💄 Maquillaje Romántico</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="tel:{{SALON_TELEFONO}}" class="cta-button valentine-cta">
                  💕 ¡Agenda tu momento especial!
                </a>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Porque mereces sentirte hermosa siempre 💕</p>
            <p><strong>{{SALON_NOMBRE}}</strong></p>
          </div>
        </div>
      `,
      contenidoTexto: `
        💕 San Valentín - El amor empieza contigo
        
        ¡Hola {{NOMBRE}}!
        
        Este San Valentín date el regalo del amor propio con {{DESCUENTO}}% de descuento en todos nuestros servicios.
        
        Válido hasta: {{VALIDEZ_DESCUENTO}}
        
        ¡Agenda tu momento especial! {{SALON_TELEFONO}}
        
        {{SALON_NOMBRE}}
      `,
      variables: ['NOMBRE', 'DESCUENTO', 'VALIDEZ_DESCUENTO', 'SALON_NOMBRE', 'SALON_TELEFONO'],
      esPersonalizable: true,
      fechaCreacion: new Date().toISOString()
    });

    // Plantilla de Navidad
    this.templates.set('navidad', {
      id: 'tpl_navidad',
      tipo: 'navidad',
      nombre: 'Feliz Navidad',
      asunto: '🎄 ¡Feliz Navidad {{NOMBRE}}! Regalo especial para ti',
      contenidoHtml: `
        ${baseStyles}
        <div class="email-container">
          <div class="header christmas-header">
            <h1>🎄 ¡Feliz Navidad!</h1>
          </div>
          <div class="content">
            <div class="card">
              <h2>¡Querida {{NOMBRE}}!</h2>
              <p>En esta época tan especial queremos compartir contigo la magia de la Navidad:</p>
              
              <div class="offer-card christmas-offer">
                <h3>🎁 Regalo de Navidad</h3>
                <div class="discount-badge">{{DESCUENTO}}% de descuento</div>
                <p>En todos nuestros servicios navideños</p>
                <p class="validity">Válido hasta: {{VALIDEZ_DESCUENTO}}</p>
              </div>
              
              <div>
                <h4>✨ Servicios perfectos para las fiestas:</h4>
                <ul>
                  <li>🌟 Peinados de fiesta elegantes</li>
                  <li>💅 Manicure con diseños navideños</li>
                  <li>✨ Maquillaje glamoroso</li>
                  <li>🎄 Tratamientos faciales festivos</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="tel:{{SALON_TELEFONO}}" class="cta-button christmas-cta">
                  🎄 ¡Agenda tu look navideño!
                </a>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>¡Felices fiestas! 🎄✨</p>
            <p><strong>{{SALON_NOMBRE}}</strong></p>
          </div>
        </div>
      `,
      contenidoTexto: `
        🎄 ¡Feliz Navidad {{NOMBRE}}!
        
        En esta época especial tenemos un regalo para ti:
        
        🎁 {{DESCUENTO}}% de descuento en todos nuestros servicios navideños
        Válido hasta: {{VALIDEZ_DESCUENTO}}
        
        ¡Agenda tu look navideño! {{SALON_TELEFONO}}
        
        ¡Felices fiestas!
        {{SALON_NOMBRE}}
      `,
      variables: ['NOMBRE', 'DESCUENTO', 'VALIDEZ_DESCUENTO', 'SALON_NOMBRE', 'SALON_TELEFONO'],
      esPersonalizable: true,
      fechaCreacion: new Date().toISOString()
    });

    // Plantilla promocional general
    this.templates.set('promocion_general', {
      id: 'tpl_promocion',
      tipo: 'promocion_general',
      nombre: 'Promoción General',
      asunto: '✨ {{NOMBRE}}, oferta especial para ti - {{DESCUENTO}}% OFF',
      contenidoHtml: `
        ${baseStyles}
        <div class="email-container">
          <div class="header">
            <h1>✨ ¡Oferta Especial!</h1>
          </div>
          <div class="content">
            <div class="card">
              <h2>¡Hola {{NOMBRE}}!</h2>
              <p>Tenemos una oferta increíble especialmente para ti:</p>
              
              <div class="offer-card">
                <div class="discount-badge">{{DESCUENTO}}% OFF</div>
                <p>En todos nuestros servicios</p>
                <p class="validity">Válido hasta: {{VALIDEZ_DESCUENTO}}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="tel:{{SALON_TELEFONO}}" class="cta-button">
                  📞 ¡Agenda ahora!
                </a>
              </div>
            </div>
          </div>
          <div class="footer">
            <p><strong>{{SALON_NOMBRE}}</strong></p>
          </div>
        </div>
      `,
      contenidoTexto: `
        ✨ ¡Oferta Especial para {{NOMBRE}}!
        
        {{DESCUENTO}}% de descuento en todos nuestros servicios
        Válido hasta: {{VALIDEZ_DESCUENTO}}
        
        ¡Agenda ahora! {{SALON_TELEFONO}}
        
        {{SALON_NOMBRE}}
      `,
      variables: ['NOMBRE', 'DESCUENTO', 'VALIDEZ_DESCUENTO', 'SALON_NOMBRE', 'SALON_TELEFONO'],
      esPersonalizable: true,
      fechaCreacion: new Date().toISOString()
    });
  }

  // Guardar configuración
  saveConfiguration(config: any) {
    this.providers = { ...this.providers, ...config };
    localStorage.setItem('emailProviderConfig', JSON.stringify(this.providers));
  }

  // Obtener plantilla por tipo
  getTemplate(tipo: CampaignType): EmailTemplate | null {
    return this.templates.get(tipo) || null;
  }

  // Obtener todas las plantillas
  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  // Reemplazar variables en el contenido
  private replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  // Generar variables para un cliente
  generateClientVariables(cliente: Cliente, config: CampaignConfig): Record<string, string> {
    const salonInfo = this.getSalonInfo();
    
    return {
      NOMBRE: cliente.nombre || 'Cliente',
      EMAIL: cliente.email || '',
      DESCUENTO: config.porcentajeDescuento?.toString() || '10',
      VALIDEZ_DESCUENTO: config.validezDescuento || this.getDefaultValidityDate(),
      SALON_NOMBRE: salonInfo.nombre,
      SALON_TELEFONO: salonInfo.telefono,
      SALON_DIRECCION: salonInfo.direccion,
      SALON_EMAIL: salonInfo.email,
      FECHA_ACTUAL: new Date().toLocaleDateString('es-ES'),
      AÑO_ACTUAL: new Date().getFullYear().toString()
    };
  }

  // Información del salón (configurable)
  private getSalonInfo() {
    const savedInfo = localStorage.getItem('salonInfo');
    if (savedInfo) {
      return JSON.parse(savedInfo);
    }
    
    return {
      nombre: 'Beauty Salon Total Control',
      telefono: '+52 55 1234-5678',
      direccion: 'Calle Principal 123, Col. Centro',
      email: 'hola@beautysalon.com'
    };
  }

  // Fecha de validez por defecto (30 días)
  private getDefaultValidityDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('es-ES');
  }

  // Crear campaña
  async createCampaign(
    tipo: CampaignType,
    config: CampaignConfig,
    clientes: Cliente[],
    asuntoPersonalizado?: string,
    contenidoPersonalizado?: string
  ): Promise<EmailCampaign> {
    const template = this.getTemplate(tipo);
    if (!template) {
      throw new Error(`Plantilla no encontrada para tipo: ${tipo}`);
    }

    // Filtrar clientes con email válido
    const clientesValidos = clientes.filter(cliente => 
      cliente.email && 
      cliente.email.trim() !== '' && 
      (!config.enviarSoloActivos || cliente.activo)
    );

    const destinatarios: EmailRecipient[] = clientesValidos.map(cliente => ({
      clienteId: cliente.id,
      email: cliente.email!,
      nombre: cliente.nombre,
      estado: 'pendiente'
    }));

    const campaign: EmailCampaign = {
      id: `campaign_${Date.now()}`,
      nombre: `${template.nombre} - ${new Date().toLocaleDateString('es-ES')}`,
      tipo,
      asunto: asuntoPersonalizado || template.asunto,
      contenido: contenidoPersonalizado || template.contenidoHtml,
      fechaCreacion: new Date().toISOString(),
      estado: config.programarEnvio ? 'programada' : 'borrador',
      destinatarios,
      configuracion: config,
      estadisticas: {
        totalEnviados: 0,
        totalFallidos: 0,
        totalAbiertos: 0,
        totalClicks: 0,
        tasaApertura: 0,
        tasaClicks: 0
      }
    };

    // Guardar campaña
    this.saveCampaign(campaign);

    // Si no está programada, enviar inmediatamente
    if (!config.programarEnvio) {
      await this.processCampaign(campaign);
    }

    return campaign;
  }

  // Procesar campaña
  private async processCampaign(campaign: EmailCampaign) {
    const clientes = this.getClientesData();
    let exitosos = 0;
    let fallidos = 0;
    
    for (const destinatario of campaign.destinatarios) {
      const cliente = clientes.find(c => c.id === destinatario.clienteId);
      if (!cliente) continue;

      const variables = this.generateClientVariables(cliente, campaign.configuracion);
      const contenidoPersonalizado = this.replaceVariables(campaign.contenido, variables);
      const asuntoPersonalizado = this.replaceVariables(campaign.asunto, variables);

      try {
        const success = await this.sendSingleEmail(
          destinatario.email,
          asuntoPersonalizado,
          contenidoPersonalizado,
          destinatario.nombre
        );

        if (success) {
          destinatario.estado = 'enviado';
          destinatario.fechaEnvio = new Date().toISOString();
          exitosos++;
        } else {
          destinatario.estado = 'fallido';
          fallidos++;
        }
      } catch (error) {
        destinatario.estado = 'fallido';
        fallidos++;
      }

      // Pequeña pausa entre envíos
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Actualizar estadísticas
    campaign.estado = 'enviada';
    campaign.fechaEnvio = new Date().toISOString();
    campaign.estadisticas = {
      totalEnviados: exitosos,
      totalFallidos: fallidos,
      totalAbiertos: 0,
      totalClicks: 0,
      tasaApertura: 0,
      tasaClicks: 0
    };

    this.saveCampaign(campaign);
  }

  // Enviar email individual
  private async sendSingleEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    toName: string
  ): Promise<boolean> {
    try {
      // Intentar con EmailJS si está configurado
      if (this.providers.emailjs.isConfigured) {
        return await this.sendWithEmailJS(to, subject, htmlContent, toName);
      }
      
      // Si no hay proveedores configurados, simular envío exitoso
      console.log(`📧 Simulando envío de email a: ${to}`);
      console.log(`📋 Asunto: ${subject}`);
      console.log(`👤 Para: ${toName}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  // Enviar con EmailJS
  private async sendWithEmailJS(
    to: string, 
    subject: string, 
    htmlContent: string, 
    toName: string
  ): Promise<boolean> {
    try {
      // Cargar EmailJS si no está disponible
      if (!window.emailjs) {
        await loadEmailJS();
      }

      if (!window.emailjs) {
        console.log('❌ EmailJS no está disponible');
        return false;
      }

      // Inicializar con la clave pública si es necesario
      if (this.providers.emailjs.publicKey) {
        window.emailjs.init(this.providers.emailjs.publicKey);
      }

      const templateParams = {
        to_email: to,
        to_name: toName,
        subject: subject,
        html_message: htmlContent,
        message: htmlContent.replace(/<[^>]*>/g, ''), // Versión texto
        from_name: this.getSalonInfo().nombre
      };

      console.log('📧 Enviando email con EmailJS...', { to, subject });

      const result = await window.emailjs.send(
        this.providers.emailjs.serviceId,
        this.providers.emailjs.templateId,
        templateParams,
        this.providers.emailjs.publicKey
      );

      console.log('✅ Email enviado exitosamente:', result);
      return result.status === 200;
    } catch (error) {
      console.error('❌ Error con EmailJS:', error);
      return false;
    }
  }

  // Guardar campaña
  private saveCampaign(campaign: EmailCampaign) {
    const campaigns = this.getCampaigns();
    const index = campaigns.findIndex(c => c.id === campaign.id);
    
    if (index >= 0) {
      campaigns[index] = campaign;
    } else {
      campaigns.push(campaign);
    }
    
    localStorage.setItem('emailCampaigns', JSON.stringify(campaigns));
  }

  // Obtener todas las campañas
  getCampaigns(): EmailCampaign[] {
    const campaigns = localStorage.getItem('emailCampaigns');
    return campaigns ? JSON.parse(campaigns) : [];
  }

  // Obtener datos de clientes
  private getClientesData(): Cliente[] {
    const clientes = localStorage.getItem('clientes');
    return clientes ? JSON.parse(clientes) : [];
  }

  // Crear campaña de cumpleaños automática
  async createBirthdayCampaigns() {
    const clientes = this.getClientesData();
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);

    // Buscar clientes que cumplen años mañana
    const cumpleañerosMañana = clientes.filter(cliente => {
      if (!cliente.cumple || !cliente.email || !cliente.activo) return false;
      
      try {
        const cumple = new Date(cliente.cumple + 'T00:00:00');
        return cumple.getMonth() === mañana.getMonth() && 
               cumple.getDate() === mañana.getDate();
      } catch {
        return false;
      }
    });

    if (cumpleañerosMañana.length > 0) {
      const config: CampaignConfig = {
        programarEnvio: false, // Enviar inmediatamente
        enviarSoloActivos: true,
        incluirDescuentos: true,
        porcentajeDescuento: 15,
        validezDescuento: this.getValidityDate(30),
        personalizarPorCliente: true
      };

      return await this.createCampaign('cumpleanos', config, cumpleañerosMañana);
    }

    return null;
  }

  // Obtener fecha de validez
  private getValidityDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('es-ES');
  }

  // Obtener preview de email
  getEmailPreview(tipo: CampaignType, clienteEjemplo?: Cliente): { html: string; texto: string } {
    const template = this.getTemplate(tipo);
    if (!template) {
      throw new Error(`Plantilla no encontrada para tipo: ${tipo}`);
    }

    const cliente = clienteEjemplo || {
      id: 'ejemplo',
      nombre: 'María García',
      email: 'maria@ejemplo.com',
      cumple: '1990-05-15',
      activo: true,
      comentarios: '',
      fechaRegistro: '2024-01-01'
    };

    const config: CampaignConfig = {
      programarEnvio: false,
      enviarSoloActivos: true,
      incluirDescuentos: true,
      porcentajeDescuento: 20,
      validezDescuento: this.getValidityDate(30),
      personalizarPorCliente: true
    };

    const variables = this.generateClientVariables(cliente, config);
    
    return {
      html: this.replaceVariables(template.contenidoHtml, variables),
      texto: this.replaceVariables(template.contenidoTexto, variables)
    };
  }

  // Cancelar campaña
  cancelCampaign(campaignId: string): boolean {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (campaign && campaign.estado !== 'enviada') {
      campaign.estado = 'cancelada';
      this.saveCampaign(campaign);
      return true;
    }
    
    return false;
  }

  // Obtener estadísticas generales
  getGeneralStats() {
    const campaigns = this.getCampaigns();
    const totalCampaigns = campaigns.length;
    const sentCampaigns = campaigns.filter(c => c.estado === 'enviada').length;
    const totalEmails = campaigns.reduce((sum, c) => sum + c.destinatarios.length, 0);
    const sentEmails = campaigns.reduce((sum, c) => 
      sum + c.destinatarios.filter(r => r.estado === 'enviado').length, 0);
    
    return {
      totalCampaigns,
      sentCampaigns,
      totalEmails,
      sentEmails,
      successRate: totalEmails > 0 ? (sentEmails / totalEmails) * 100 : 0
    };
  }

  // Verificar configuración de proveedores
  getProviderStatus() {
    return {
      emailjs: this.providers.emailjs.isConfigured,
      resend: this.providers.resend.isConfigured,
      sendgrid: false // Por implementar
    };
  }

  // Configurar proveedor
  configureProvider(provider: string, config: any) {
    if (this.providers[provider as keyof typeof this.providers]) {
      this.providers[provider as keyof typeof this.providers] = { 
        ...this.providers[provider as keyof typeof this.providers], 
        ...config, 
        isConfigured: true 
      };
      this.saveConfiguration(this.providers);
    }
  }

  // Actualizar información del salón
  updateSalonInfo(info: any) {
    localStorage.setItem('salonInfo', JSON.stringify(info));
  }
}

// Crear instancia singleton
export const emailMarketingService = new EmailMarketingService();

// Declarar tipos globales
declare global {
  interface Window {
    emailjs: any;
  }
}