// src/services/emailAutomationIntegratedService.ts - Automatización integrada con el sistema de citas

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

interface EmailTemplate {
  id: string;
  tipo: string;
  nombre: string;
  asunto: string;
  contenido: string;
  activa: boolean;
}

interface Cita {
  id: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  estado: string;
  notas?: string;
  emailHistory?: any[];
}

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  cumple: string;
  activo: boolean;
}

interface Servicio {
  id: string;
  nombre: string;
}

class EmailAutomationIntegratedService {
  private config: AutomationConfig;
  private isRunning: boolean = false;
  private intervalId: number | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.startAutomation();
  }

  // Cargar configuración
  private loadConfig(): AutomationConfig {
    const saved = localStorage.getItem('emailAutomationConfig');
    return saved ? JSON.parse(saved) : {
      confirmacionAutomatica: true,
      recordatorioAntes: true,
      recordatorioDespues: false,
      cumpleanosAutomatico: true,
      seguimientoAutomatico: false,
      diasAntesRecordatorio: 1,
      horaEnvioRecordatorios: '10:00',
      diasDespuesSeguimiento: 7
    };
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<AutomationConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('emailAutomationConfig', JSON.stringify(this.config));
  }

  // Iniciar automatización
  startAutomation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Ejecutar inmediatamente
    this.checkAutomations();
    
    // Programar ejecución cada hora
    this.intervalId = window.setInterval(() => {
      this.checkAutomations();
    }, 60 * 60 * 1000); // Cada hora
    
    console.log('📧 Automatización de emails iniciada');
  }

  // Detener automatización
  stopAutomation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Automatización de emails detenida');
  }

  // Verificar todas las automatizaciones
  private async checkAutomations() {
    console.log('🔍 Verificando automatizaciones...');
    
    try {
      await Promise.all([
        this.checkCitasConfirmaciones(),
        this.checkRecordatorios(),
        this.checkCumpleanos(),
        this.checkSeguimientos()
      ]);
    } catch (error) {
      console.error('❌ Error en automatizaciones:', error);
    }
  }

  // 1. Confirmar citas nuevas
  private async checkCitasConfirmaciones() {
    if (!this.config.confirmacionAutomatica) return;

    const citas = this.getCitas();
    const clientes = this.getClientes();
    const servicios = this.getServicios();

    // Buscar citas creadas en las últimas 2 horas que no tienen confirmación enviada
    const dosHorasAtras = new Date();
    dosHorasAtras.setHours(dosHorasAtras.getHours() - 2);

    const citasParaConfirmar = citas.filter(cita => {
      const fechaCreacion = new Date(cita.fechaCreacion || cita.id.split('_')[1] || Date.now());
      return fechaCreacion > dosHorasAtras &&
             cita.estado === 'pendiente' &&
             !this.yaSeEnvioEmail(cita, 'confirmacion');
    });

    for (const cita of citasParaConfirmar) {
      await this.enviarConfirmacion(cita, clientes, servicios);
    }
  }

  // 2. Recordatorios antes de la cita
  private async checkRecordatorios() {
    if (!this.config.recordatorioAntes) return;

    const citas = this.getCitas();
    const clientes = this.getClientes();
    const servicios = this.getServicios();

    const mañana = new Date();
    mañana.setDate(mañana.getDate() + this.config.diasAntesRecordatorio);
    const fechaMañana = mañana.toISOString().split('T')[0];

    const citasParaRecordar = citas.filter(cita => 
      cita.fecha === fechaMañana &&
      ['pendiente', 'confirmada'].includes(cita.estado) &&
      !this.yaSeEnvioEmail(cita, 'recordatorio')
    );

    for (const cita of citasParaRecordar) {
      await this.enviarRecordatorio(cita, clientes, servicios);
    }
  }

  // 3. Cumpleaños automáticos
  private async checkCumpleanos() {
    if (!this.config.cumpleanosAutomatico) return;

    const clientes = this.getClientes();
    const hoy = new Date();
    const hoyStr = `${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    const cumpleaneros = clientes.filter(cliente => {
      if (!cliente.email || !cliente.cumple || !cliente.activo) return false;
      
      const cumple = new Date(cliente.cumple);
      const cumpleStr = `${String(cumple.getMonth() + 1).padStart(2, '0')}-${String(cumple.getDate()).padStart(2, '0')}`;
      
      return cumpleStr === hoyStr && !this.yaSeEnvioCumpleanos(cliente);
    });

    for (const cliente of cumpleaneros) {
      await this.enviarCumpleanos(cliente);
    }
  }

  // 4. Seguimiento post-servicio
  private async checkSeguimientos() {
    if (!this.config.seguimientoAutomatico) return;

    const citas = this.getCitas();
    const clientes = this.getClientes();
    const servicios = this.getServicios();

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - this.config.diasDespuesSeguimiento);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const citasParaSeguimiento = citas.filter(cita =>
      cita.estado === 'completada' &&
      cita.fechaCompletada?.split('T')[0] === fechaLimiteStr &&
      !this.yaSeEnvioEmail(cita, 'seguimiento')
    );

    for (const cita of citasParaSeguimiento) {
      await this.enviarSeguimiento(cita, clientes, servicios);
    }
  }

  // Verificar si ya se envió un email
  private yaSeEnvioEmail(cita: Cita, tipo: string): boolean {
    return cita.emailHistory?.some(email => email.type === tipo) || false;
  }

  // Verificar si ya se envió cumpleaños este año
  private yaSeEnvioCumpleanos(cliente: Cliente): boolean {
    const historial = JSON.parse(localStorage.getItem('emailHistorial') || '[]');
    const añoActual = new Date().getFullYear();
    
    return historial.some((email: any) =>
      email.clienteId === cliente.id &&
      email.type === 'cumpleanos' &&
      new Date(email.sentAt).getFullYear() === añoActual
    );
  }

  // Enviar confirmación
  private async enviarConfirmacion(cita: Cita, clientes: Cliente[], servicios: Servicio[]) {
    const cliente = clientes.find(c => c.id === cita.clienteId);
    const servicio = servicios.find(s => s.id === cita.servicioId);
    
    if (!cliente?.email || !servicio) return;

    const template = this.getTemplate('confirmacion');
    if (!template) return;

    const variables = this.generateVariables(cliente, servicio, cita);
    const contenido = this.replaceVariables(template.contenido, variables);
    const asunto = this.replaceVariables(template.asunto, variables);

    const success = await this.sendEmail(cliente.email, asunto, contenido);
    
    if (success) {
      this.registrarEnvio(cita, 'confirmacion');
      console.log(`✅ Confirmación enviada a ${cliente.nombre}`);
    }
  }

  // Enviar recordatorio
  private async enviarRecordatorio(cita: Cita, clientes: Cliente[], servicios: Servicio[]) {
    const cliente = clientes.find(c => c.id === cita.clienteId);
    const servicio = servicios.find(s => s.id === cita.servicioId);
    
    if (!cliente?.email || !servicio) return;

    const template = this.getTemplate('recordatorio');
    if (!template) return;

    const variables = this.generateVariables(cliente, servicio, cita);
    const contenido = this.replaceVariables(template.contenido, variables);
    const asunto = this.replaceVariables(template.asunto, variables);

    const success = await this.sendEmail(cliente.email, asunto, contenido);
    
    if (success) {
      this.registrarEnvio(cita, 'recordatorio');
      console.log(`⏰ Recordatorio enviado a ${cliente.nombre}`);
    }
  }

  // Enviar cumpleaños
  private async enviarCumpleanos(cliente: Cliente) {
    const template = this.getTemplate('cumpleanos');
    if (!template) return;

    const variables = this.generateVariables(cliente);
    const contenido = this.replaceVariables(template.contenido, variables);
    const asunto = this.replaceVariables(template.asunto, variables);

    const success = await this.sendEmail(cliente.email!, asunto, contenido);
    
    if (success) {
      this.registrarEnvioCumpleanos(cliente);
      console.log(`🎂 Cumpleaños enviado a ${cliente.nombre}`);
    }
  }

  // Enviar seguimiento
  private async enviarSeguimiento(cita: Cita, clientes: Cliente[], servicios: Servicio[]) {
    const cliente = clientes.find(c => c.id === cita.clienteId);
    const servicio = servicios.find(s => s.id === cita.servicioId);
    
    if (!cliente?.email || !servicio) return;

    const template = this.getTemplate('seguimiento');
    if (!template) return;

    const variables = this.generateVariables(cliente, servicio, cita);
    const contenido = this.replaceVariables(template.contenido, variables);
    const asunto = this.replaceVariables(template.asunto, variables);

    const success = await this.sendEmail(cliente.email, asunto, contenido);
    
    if (success) {
      this.registrarEnvio(cita, 'seguimiento');
      console.log(`📝 Seguimiento enviado a ${cliente.nombre}`);
    }
  }

  // Obtener plantilla
  private getTemplate(tipo: string): EmailTemplate | null {
    const templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
    return templates.find((t: EmailTemplate) => t.tipo === tipo && t.activa) || null;
  }

  // Generar variables para reemplazo
  private generateVariables(cliente: Cliente, servicio?: Servicio, cita?: Cita): Record<string, string> {
    const salonInfo = this.getSalonInfo();
    
    return {
      clienteName: cliente.nombre,
      serviceName: servicio?.nombre || '',
      appointmentDate: cita ? this.formatDate(cita.fecha) : '',
      appointmentTime: cita ? this.formatTime(cita.hora) : '',
      salonName: salonInfo.nombre,
      salonPhone: salonInfo.telefono,
      salonAddress: salonInfo.direccion,
      appointmentNotes: cita?.notas || ''
    };
  }

  // Reemplazar variables en contenido
  private replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  // Formatear fecha
  private formatDate(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Formatear hora
  private formatTime(hora: string): string {
    return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Enviar email (integración con emailService)
  private async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    try {
      // Intentar usar emailService si está disponible
      if (window.emailService) {
        return await window.emailService.sendEmail(to, subject, content);
      }

      // Fallback: simular envío para desarrollo
      console.log(`📧 Simulando envío de email a: ${to}`);
      console.log(`📋 Asunto: ${subject}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  // Registrar envío en historial de cita
  private registrarEnvio(cita: Cita, tipo: string) {
    const citas = this.getCitas();
    const updatedCitas = citas.map(c => {
      if (c.id === cita.id) {
        return {
          ...c,
          emailHistory: [
            ...(c.emailHistory || []),
            {
              type: tipo,
              sentAt: new Date().toISOString(),
              automatic: true
            }
          ]
        };
      }
      return c;
    });
    
    localStorage.setItem('citas', JSON.stringify(updatedCitas));
  }

  // Registrar envío de cumpleaños
  private registrarEnvioCumpleanos(cliente: Cliente) {
    const historial = JSON.parse(localStorage.getItem('emailHistorial') || '[]');
    historial.push({
      clienteId: cliente.id,
      type: 'cumpleanos',
      sentAt: new Date().toISOString(),
      automatic: true
    });
    localStorage.setItem('emailHistorial', JSON.stringify(historial));
  }

  // Obtener datos del localStorage
  private getCitas(): Cita[] {
    return JSON.parse(localStorage.getItem('citas') || '[]');
  }

  private getClientes(): Cliente[] {
    return JSON.parse(localStorage.getItem('clientes') || '[]');
  }

  private getServicios(): Servicio[] {
    return JSON.parse(localStorage.getItem('servicios') || '[]');
  }

  private getSalonInfo() {
    const config = JSON.parse(localStorage.getItem('generalConfig') || '{}');
    return {
      nombre: config.salonName || 'Beauty Salon Total Control',
      telefono: config.salonPhone || '+52 55 1234-5678',
      direccion: config.salonAddress || 'Calle Principal 123'
    };
  }

  // API pública
  public getConfig(): AutomationConfig {
    return { ...this.config };
  }

  public isAutomationRunning(): boolean {
    return this.isRunning;
  }

  public getStats() {
    const citas = this.getCitas();
    const clientes = this.getClientes();
    const hoy = new Date();
    
    // Cumpleañeros hoy
    const hoyStr = `${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const cumpleaneros = clientes.filter(cliente => {
      if (!cliente.cumple) return false;
      const cumple = new Date(cliente.cumple);
      const cumpleStr = `${String(cumple.getMonth() + 1).padStart(2, '0')}-${String(cumple.getDate()).padStart(2, '0')}`;
      return cumpleStr === hoyStr && cliente.activo;
    }).length;

    // Recordatorios pendientes
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + this.config.diasAntesRecordatorio);
    const fechaMañana = mañana.toISOString().split('T')[0];
    
    const recordatorios = citas.filter(cita => 
      cita.fecha === fechaMañana &&
      ['pendiente', 'confirmada'].includes(cita.estado) &&
      !this.yaSeEnvioEmail(cita, 'recordatorio')
    ).length;

    // Seguimientos pendientes
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - this.config.diasDespuesSeguimiento);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const seguimientos = citas.filter(cita =>
      cita.estado === 'completada' &&
      cita.fechaCompletada?.split('T')[0] === fechaLimiteStr &&
      !this.yaSeEnvioEmail(cita, 'seguimiento')
    ).length;

    return {
      cumpleaneros,
      recordatorios,
      seguimientos,
      totalClientes: clientes.filter(c => c.email && c.activo).length,
      isRunning: this.isRunning
    };
  }

  // Ejecutar verificación manual
  public async executeManualCheck() {
    console.log('🔄 Ejecutando verificación manual...');
    await this.checkAutomations();
    return this.getStats();
  }
}

// Crear instancia singleton
export const emailAutomationIntegratedService = new EmailAutomationIntegratedService();

// Declarar en window para acceso global
declare global {
  interface Window {
    emailService?: any;
  }
}