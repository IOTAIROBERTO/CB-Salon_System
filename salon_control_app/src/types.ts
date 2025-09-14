// src/types.ts

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  fechaNacimiento?: string; // Nuevo campo para fecha de nacimiento
  fechaRegistro: string;
  notas?: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  precioSugerido: number;
  anticipoSugerido?: number; // Nuevo campo para anticipo sugerido
  duracionMinutos: number;
  categoria?: string;
  activo: boolean;
}

export interface Cita {
  id: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  estado: "pendiente" | "confirmada" | "iniciada" | "completada" | "cancelada";
  notas?: string;
  montoAnticipo?: number;
  anticipoConfirmado?: boolean; // Nuevo campo para confirmar anticipo
  precioFinal?: number;
  metodoPago?: string;
  saldoPendiente?: number;
  fechaCompletada?: string;
}

export interface ModalState {
  type: "create" | "edit" | "cobro" | "reagendar" | null;
  data?: Cita | null;
}