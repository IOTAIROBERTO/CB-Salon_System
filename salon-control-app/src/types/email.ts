// src/types/email.ts
export interface EmailCampaign {
  id: string;
  nombre: string;
  tipo: CampaignType;
  plantillaId: string;
  asunto: string;
  contenido: string;
  fechaCreacion: string;
  fechaEnvio?: string;
  estado: 'borrador' | 'programada' | 'enviada' | 'cancelada' | 'enviando';
  destinatarios: EmailRecipient[];
  configuracion: CampaignConfig;
  estadisticas: CampaignStats;
}

export interface EmailRecipient {
  clienteId: string;
  email: string;
  nombre: string;
  estado: 'pendiente' | 'enviado' | 'fallido' | 'abierto' | 'clickeado';
  fechaEnvio?: string;
  motivoFallo?: string;
}

export interface CampaignConfig {
  programarEnvio: boolean;
  fechaProgramada?: string;
  horaProgramada?: string;
  enviarSoloActivos: boolean;
  incluirDescuentos: boolean;
  porcentajeDescuento?: number;
  validezDescuento?: string;
  personalizarPorCliente: boolean;
}

export interface CampaignStats {
  totalEnviados: number;
  totalFallidos: number;
  totalAbiertos: number;
  totalClicks: number;
  tasaApertura: number;
  tasaClicks: number;
}

export type CampaignType =
  | 'cumpleanos'
  | 'san_valentin'
  | 'dia_madre'
  | 'navidad'
  | 'año_nuevo'
  | 'promocion_general'
  | 'promocion'
  | 'recordatorio_cita'
  | 'recordatorio'
  | 'reactivacion_cliente'
  | 'personalizado';

export interface EmailTemplate {
  id: string;
  tipo: CampaignType;
  nombre: string;
  asunto: string;
  contenidoHtml: string;
  contenidoTexto: string;
  variables: string[];
  esPersonalizable: boolean;
  fechaCreacion: string;
  activa: boolean;
}

export interface EmailProvider {
  name: string;
  isConfigured: boolean;
  isActive: boolean;
  config: any;
}

export interface EmailQueue {
  id: string;
  campaignId: string;
  destinatario: EmailRecipient;
  contenido: string;
  asunto: string;
  fechaProgramada: string;
  intentos: number;
  ultimoIntento?: string;
  estado: 'pendiente' | 'enviando' | 'enviado' | 'fallido';
}