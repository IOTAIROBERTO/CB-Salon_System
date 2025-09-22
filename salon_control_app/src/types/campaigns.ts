// src/types/campaigns.ts

export interface Campaign {
  id: string;
  nombre: string;
  tipo: 'recordatorio' | 'confirmacion' | 'promocional' | 'cumpleanos' | 'seguimiento';
  estado: 'borrador' | 'activa' | 'pausada' | 'completada';
  plantilla: string;
  asunto: string;
  fechaCreacion: string;
  fechaEnvio?: string;
  destinatarios: number;
  enviadoA: number;
  tasaApertura: number;
  configuracion: {
    envioAutomatico: boolean;
    diasAntes?: number;
    horaEnvio?: string;
    filtroClientes?: string;
  };
}

export interface CampaignFormData {
  nombre: string;
  tipo: Campaign['tipo'];
  asunto: string;
  plantilla: string;
  envioAutomatico: boolean;
  diasAntes: number;
  horaEnvio: string;
  filtroClientes: string;
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  emailsSent: number;
  averageOpenRate: number;
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  fromEmail: string;
  fromName: string;
}

export interface AutomationRule {
  id: string;
  nombre: string;
  trigger: 'cita_creada' | 'cita_confirmada' | 'cumpleanos' | 'cliente_nuevo' | 'cita_completada';
  campaignId: string;
  activo: boolean;
  condiciones: {
    diasAntes?: number;
    tipoServicio?: string[];
    clienteNuevo?: boolean;
  };
}