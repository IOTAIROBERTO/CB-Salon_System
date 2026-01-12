import {
  EmailCampaign,
  EmailRecipient,
  CampaignType,
  EmailTemplate,
  CampaignConfig
} from '../types/email';
import { Cliente } from '../types/clientes';
import { loadEmailJS } from '../utils/emailJSLoader';
import { db } from '../db/db';

class EmailMarketingService {
  private isEmailJsLoaded = false;

  constructor() {
    this.ensureDefaultTemplates();
  }

  // Ensure default templates exist in DB
  private async ensureDefaultTemplates() {
    const defaults = this.getDefaultTemplates();
    for (const tpl of defaults) {
      const exists = await db.plantillas.get(tpl.id);
      if (!exists) {
        await db.plantillas.add(tpl);
      }
    }
  }

  // Cargar configuración desde DB
  async getConfiguration() {
    const settings = await db.configuracion.get('settings');
    return settings?.emailConfig || {
      serviceId: '',
      templateId: '',
      publicKey: ''
    };
  }

  // Guardar configuración
  async saveConfiguration(config: any) {
    const settings = await db.configuracion.get('settings');
    if (settings) {
      // Merge existing config with new
      const currentConfig = settings.emailConfig || {};
      const newConfig = { ...currentConfig, ...config };

      await db.configuracion.update('settings', {
        emailConfig: newConfig
      });
    }
  }

  // Obtener plantillas
  async getAllTemplates(): Promise<EmailTemplate[]> {
    return await db.plantillas.toArray();
  }

  async getTemplate(id: string): Promise<EmailTemplate | undefined> {
    return await db.plantillas.get(id);
  }

  // Guardar/Actualizar Plantilla
  async saveTemplate(template: EmailTemplate): Promise<void> {
    await db.plantillas.put(template);
  }

  // Obtener Campañas
  async getCampaigns(): Promise<EmailCampaign[]> {
    return await db.campanas.orderBy('fechaCreacion').reverse().toArray();
  }

  // Crear campaña
  async createCampaign(
    tipo: CampaignType,
    config: CampaignConfig,
    templateId: string,
    asuntoPersonalizado?: string,
    contenidoPersonalizado?: string,
    targetClients?: any[] // New optional argument
  ): Promise<EmailCampaign> {
    const template = await db.plantillas.get(templateId);
    if (!template) throw new Error('Plantilla no encontrada');

    // Load clients
    // If targetClients is provided, use it; otherwise fetch all and filter
    let clientesValidos: any[] = [];

    if (targetClients && targetClients.length > 0) {
      clientesValidos = targetClients;
    } else {
      const clientes = await db.clientes.toArray();
      // Default filtering
      clientesValidos = clientes.filter(c =>
        c.email && c.email.includes('@') && (!config.enviarSoloActivos || c.activo)
      );
    }

    // Ensure all have emails
    clientesValidos = clientesValidos.filter(c => c.email && c.email.includes('@'));

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
      estado: config.programarEnvio ? 'programada' : 'borrador',
      plantillaId: template.id,
      asunto: asuntoPersonalizado || template.asunto,
      contenido: contenidoPersonalizado || template.contenidoHtml,
      fechaCreacion: new Date().toISOString(),
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

    await db.campanas.add(campaign);

    if (!config.programarEnvio) {
      // Process in background (dont await here to return UI quickly, 
      // OR await if we want to show progress. Let's return and let UI trigger send)
    }

    return campaign;
  }

  // Procesar/Enviar Campaña
  async sendCampaign(campaignId: string, onProgress?: (sent: number, total: number) => void) {
    const campaign = await db.campanas.get(campaignId);
    if (!campaign) throw new Error('Campaña no encontrada');

    const config = await this.getConfiguration();
    const isConfigured = config.serviceId && config.publicKey;

    let sentCount = 0;
    const total = campaign.destinatarios.length;
    const clientes = await db.clientes.toArray();

    campaign.estado = 'enviando';
    await db.campanas.put(campaign);

    // Load EmailJS if needed
    if (isConfigured && !this.isEmailJsLoaded) {
      await loadEmailJS();
      if (window.emailjs) {
        window.emailjs.init(config.publicKey);
        this.isEmailJsLoaded = true;
      }
    }

    for (const recipient of campaign.destinatarios) {
      if (recipient.estado === 'enviado') continue;

      const cliente = clientes.find(c => c.id === recipient.clienteId);
      const variables = cliente ? this.generateClientVariables(cliente) : {};

      const subject = this.replaceVariables(campaign.asunto, variables);
      const content = this.replaceVariables(campaign.contenido, variables);

      let success = false;
      if (isConfigured && window.emailjs) {
        success = await this.sendWithEmailJS(recipient.email, subject, content, recipient.nombre, config);
      } else {
        // Simulation Mode
        console.log(`[SIMULACIÓN] Enviando a ${recipient.email}: ${subject}`);
        await new Promise(r => setTimeout(r, 500)); // Simulate delay
        success = true;
      }

      recipient.estado = success ? 'enviado' : 'fallido';
      recipient.fechaEnvio = new Date().toISOString();

      if (success) {
        campaign.estadisticas.totalEnviados++;
        sentCount++;
      } else {
        campaign.estadisticas.totalFallidos++;
      }

      if (onProgress) onProgress(sentCount, total);

      // Update intermediate state every 5 emails
      if (sentCount % 5 === 0) await db.campanas.put(campaign);
    }

    campaign.estado = 'enviada';
    campaign.fechaEnvio = new Date().toISOString();
    await db.campanas.put(campaign);
  }

  // --- Automations ---

  async checkAutomations() {
    console.log('Verificando automatizaciones...');
    const rules = await db.automatizaciones.filter(r => !!r.activa).toArray();

    for (const rule of rules) {
      console.log(`Procesando regla: ${rule.nombre} (${rule.trigger})`);
      try {
        switch (rule.trigger) {
          case 'cumpleanos': await this.checkBirthdays(rule); break;
          case 'registro_nuevo': await this.checkNewClients(rule); break;
          case 'recordatorio_cita': await this.checkReminders(rule); break;
          case 'reactivacion': await this.checkReactivation(rule); break;
          case 'post_visita': await this.checkPostVisit(rule); break;
        }
      } catch (err) {
        console.error(`Error procesando regla ${rule.id}:`, err);
      }
    }
    console.log('Verificación completada.');
    return true;
  }

  private async checkBirthdays(rule: any) {
    if (!rule.plantillaId) return;

    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const todayStr = `-${month}-${day}`; // Match -MM-DD

    const allClients = await db.clientes.toArray();
    const birthdayClients = allClients.filter(c => c.cumple && c.cumple.endsWith(todayStr) && c.email);

    if (birthdayClients.length === 0) return;

    const campaignName = `Auto: ${rule.nombre} - ${new Date().toLocaleDateString('es-ES')}`;
    const existing = await db.campanas.where('nombre').equals(campaignName).first();
    if (existing) return;

    await this.createCampaign(
      'cumpleanos',
      { programarEnvio: true, enviarSoloActivos: true, incluirDescuentos: true, personalizarPorCliente: true },
      rule.plantillaId,
      undefined,
      undefined,
      birthdayClients
    );
  }

  private async checkNewClients(rule: any) {
    if (!rule.plantillaId) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const allClients = await db.clientes.toArray();
    const newClients = allClients.filter(c =>
      c.fechaRegistro &&
      new Date(c.fechaRegistro) > yesterday &&
      c.email
    );

    if (newClients.length === 0) return;

    const campaignName = `Auto: ${rule.nombre} - ${new Date().toLocaleDateString('es-ES')}`;
    const existing = await db.campanas.where('nombre').equals(campaignName).first();
    if (existing) return;

    await this.createCampaign(
      'promocion_general',
      { programarEnvio: true, enviarSoloActivos: true, incluirDescuentos: false, personalizarPorCliente: true },
      rule.plantillaId,
      undefined,
      undefined,
      newClients
    );
  }

  private async checkReminders(rule: any) {
    if (!rule.plantillaId) return;
    const hours = rule.condiciones?.horasAntes || 24;

    // Logic for "Tomorrow" (approx 24h)
    // If we want strict hours, we'd need time logic. For now, assuming "Day Before" logic is sufficient for "24h"
    // If hours > 24, we might look further ahead.
    const daysAhead = Math.round(hours / 24);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const appointments = await db.citas.filter(c => c.fecha === targetDateStr && c.estado === 'confirmada').toArray();

    if (appointments.length === 0) return;

    const clientIds = [...new Set(appointments.map(a => a.clienteId))];
    const clients = await db.clientes.bulkGet(clientIds);
    const validClients = clients.filter(c => c && c.email);

    if (validClients.length === 0) return;

    const campaignName = `Auto: ${rule.nombre} - ${targetDateStr}`;
    const existing = await db.campanas.where('nombre').equals(campaignName).first();
    if (existing) return;

    await this.createCampaign(
      'recordatorio_cita',
      { programarEnvio: true, enviarSoloActivos: true, incluirDescuentos: false, personalizarPorCliente: true },
      rule.plantillaId,
      `Recordatorio de Cita`,
      undefined,
      validClients
    );
  }

  private async checkReactivation(rule: any) {
    if (!rule.plantillaId) return;
    const diasSinVisita = rule.condiciones?.diasSinVisita || 60;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - diasSinVisita);

    // This query is expensive, optimizing for local usage
    const allClients = await db.clientes.filter(c => !!c.activo && !!c.email).toArray();

    const targetClients: any[] = []; // Using any to avoid strict type issues with Cliente

    for (const client of allClients) {
      // Find LAST completed appointment
      const lastAppt = await db.citas
        .where('clienteId').equals(client.id)
        .filter(c => c.estado === 'completada' || c.estado === 'confirmada') // Include confirmed as 'active' logic? Maybe only completed.
        .reverse()
        .sortBy('fecha');

      // If no appointments, maybe they are new? If they never visited, skip reactivation?
      // Or if they registered long ago but never visited?

      let lastDate: Date;
      if (lastAppt.length > 0) {
        lastDate = new Date(lastAppt[0].fecha);
      } else if (client.fechaRegistro) {
        lastDate = new Date(client.fechaRegistro);
      } else {
        continue; // Can't determine
      }

      if (lastDate < cutoffDate) {
        targetClients.push(client);
      }
    }

    if (targetClients.length === 0) return;

    // Prevent spamming: Check if we sent this SAME reactivation campaign recently?
    // For now, simpler check: One campaign per day per rule. 
    // Ideally, we should check "Did we send THIS rule to THIS client recently?"
    // That's complex. Let's stick to daily batch for now.

    const campaignName = `Auto: ${rule.nombre} - ${new Date().toLocaleDateString('es-ES')}`;
    const existing = await db.campanas.where('nombre').equals(campaignName).first();
    if (existing) return;

    await this.createCampaign(
      'reactivacion_cliente',
      { programarEnvio: true, enviarSoloActivos: true, incluirDescuentos: true, personalizarPorCliente: true },
      rule.plantillaId,
      undefined,
      undefined,
      targetClients
    );
  }

  private async checkPostVisit(rule: any) {
    if (!rule.plantillaId) return;
    const diasDespues = rule.condiciones?.diasDespues || 1;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - diasDespues);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const appointments = await db.citas
      .where('fecha').equals(targetDateStr)
      .filter(c => c.estado === 'completada' || c.estado === 'confirmada') // assuming confirmed past dates are 'done'
      .toArray();

    if (appointments.length === 0) return;

    const clientIds = [...new Set(appointments.map(a => a.clienteId))];
    const clients = await db.clientes.bulkGet(clientIds);
    const validClients = clients.filter(c => c && c.email);

    if (validClients.length === 0) return;

    const campaignName = `Auto: ${rule.nombre} - ${targetDateStr}`;
    const existing = await db.campanas.where('nombre').equals(campaignName).first();
    if (existing) return;

    await this.createCampaign(
      'personalizado',
      { programarEnvio: true, enviarSoloActivos: true, incluirDescuentos: false, personalizarPorCliente: true },
      rule.plantillaId,
      undefined,
      undefined,
      validClients
    );
  }

  private async sendWithEmailJS(to: string, subject: string, html: string, name: string, config: any): Promise<boolean> {
    try {
      if (!window.emailjs) return false;

      const params = {
        to_email: to,
        to_name: name,
        subject: subject,
        html_message: html,
        message: html.replace(/<[^>]*>/g, ' '),
        from_name: 'Beauty Salon Control'
      };

      const res = await window.emailjs.send(
        config.serviceId,
        config.templateId,
        params,
        config.publicKey
      );
      return res.status === 200;
    } catch (e) {
      console.error('EmailJS Error:', e);
      return false;
    }
  }

  // Helpers
  private replaceVariables(text: string, vars: Record<string, string>): string {
    let res = text;
    for (const key in vars) {
      res = res.replace(new RegExp(`{{${key}}}`, 'g'), vars[key]);
    }
    return res;
  }

  private generateClientVariables(cliente: Cliente): Record<string, string> {
    return {
      NOMBRE: cliente.nombre,
      EMAIL: cliente.email || '',
      TELEFONO: cliente.telefono || '',
      SALON_NOMBRE: 'Beauty Salon Total Control' // Could load from settings too
    };
  }

  private getDefaultTemplates(): EmailTemplate[] {
    const baseStyles = `
      <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; background-color: #f6f6f6; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #fdfdfd; padding: 20px; text-align: center; }
        .content { padding: 20px; color: #333; line-height: 1.6; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    `;

    const PLANTILLAS = {
      cumpleanos: `${baseStyles}
        <div class="email-container">
          <div class="header"><h1>🎉 ¡Feliz Cumpleaños! 🎉</h1></div>
          <div class="content">
            <p>Hola <strong>{{NOMBRE}}</strong>,</p>
            <p>En este día tan especial queremos desearte lo mejor.</p>
            <p>Ven y celebra con nosotros, te regalamos un descuento especial.</p>
            <center><a href="#" class="btn">Solicitar Cita</a></center>
          </div>
          <div class="footer">{{SALON_NOMBRE}}</div>
        </div>`,
      promocion: `${baseStyles}
        <div class="email-container">
          <div class="header"><h1>Oferta Especial ✨</h1></div>
          <div class="content">
            <p>Hola <strong>{{NOMBRE}}</strong>,</p>
            <p>Tenemos nuevas promociones pensadas para ti.</p>
          </div>
          <div class="footer">{{SALON_NOMBRE}}</div>
        </div>`,
      bienvenida: `${baseStyles}
        <div class="email-container">
          <div class="header"><h1>¡Bienvenid@ a {{SALON_NOMBRE}}! 🌟</h1></div>
          <div class="content">
            <p>Hola <strong>{{NOMBRE}}</strong>,</p>
            <p>Gracias por registrarte con nosotros. Estamos emocionados de tenerte aquí.</p>
            <p>Como agradecimiento, disfruta de un descuento especial en tu próxima visita.</p>
            <center><a href="#" class="btn">Reservar Cita</a></center>
          </div>
          <div class="footer">{{SALON_NOMBRE}}</div>
        </div>`
    };

    return [
      {
        id: 'tpl_cumple',
        nombre: 'Felicitación de Cumpleaños',
        tipo: 'cumpleanos',
        asunto: '¡Feliz Cumpleaños te desea {{SALON_NOMBRE}}!',
        contenidoHtml: PLANTILLAS.cumpleanos,
        contenidoTexto: '¡Feliz Cumpleaños!',
        variables: ['NOMBRE', 'SALON_NOMBRE', 'DESCUENTO'],
        fechaCreacion: new Date().toISOString(),
        activa: true,
        esPersonalizable: true
      },
      {
        id: 'tpl_promo',
        nombre: 'Promoción General',
        tipo: 'promocion_general',
        asunto: 'Descuentos especiales para ti',
        contenidoHtml: PLANTILLAS.promocion,
        contenidoTexto: 'Descuentos especiales.',
        variables: ['NOMBRE', 'SALON_NOMBRE', 'OFERTA'],
        fechaCreacion: new Date().toISOString(),
        activa: true,
        esPersonalizable: true
      },
      {
        id: 'tpl_bienvenida',
        nombre: 'Bienvenida Nuevo Cliente',
        tipo: 'promocion_general', // Using general type is fine
        asunto: '¡Bienvenid@ a {{SALON_NOMBRE}}!',
        contenidoHtml: PLANTILLAS.bienvenida,
        contenidoTexto: 'Gracias por registrarte.',
        variables: ['NOMBRE', 'SALON_NOMBRE'],
        fechaCreacion: new Date().toISOString(),
        activa: true,
        esPersonalizable: true
      }
    ];
  }
}

export const emailMarketingService = new EmailMarketingService();