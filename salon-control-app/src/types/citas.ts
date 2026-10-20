// src/types/citas.ts - Versión actualizada

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  fechaNacimiento?: string;
  fechaRegistro: string;
  notas?: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  precioSugerido: number;
  anticipoSugerido?: number;
  duracionMinutos: number;
  categoria?: string;
  activo: boolean;
  comision?: number;
  archivado?: boolean; // Fuera del catálogo (uñas, «otros»)
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
  anticipoConfirmado?: boolean;
  precioFinal?: number;
  metodoPago?: string;
  serviciosAdicionales?: Array<{
    servicioId: string;
    nombre: string;
    precio: number;
  }>;
  empleadoIds?: string[];
  // Campos actualizados para el nuevo sistema de descuentos y redondeo
  descuentoAplicado?: number; // Porcentaje de descuento aplicado
  subtotalOriginal?: number; // Subtotal de servicios antes del descuento
  montoDescuento?: number; // Monto del descuento aplicado
  subtotalConDescuento?: number; // Subtotal después del descuento
  montoRedondeo?: number; // Monto agregado por redondeo a decena
  propina?: number; // Propina agregada por el cliente
  saldoPendiente?: number;
  fechaCompletada?: string;
  descripcionTrabajo?: string; // qué se trabajó y por qué se cobró así
  ubicacion?: string; // sin valor o 'salon' = en el salón; si no, id de zona (utils/zonas)
  atiendeId?: string; // quién la atiende ('cristina' o id de empleado)
}

export interface ModalState {
  type: "create" | "edit" | "cobro" | "reagendar" | null;
  data?: Cita | null;
}