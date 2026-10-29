// src/types/citas.ts - Versión actualizada

// Clienta y servicio son los de la base (db.ts): una sola definición
export type { Cliente, Servicio } from '../db/db';

export interface Cita {
  id: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  estado: "pendiente" | "confirmada" | "iniciada" | "completada" | "cancelada" | "no_llego";
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
  anticipoPerdido?: number; // anticipo que se queda el salón (canceló tarde o no llegó)
  anticipoASaldo?: number; // anticipo que pasó a su saldo a favor (canceló con 48 h o más)
  canceladaPor?: 'clienta' | 'salon';
  reagendadaEn?: string; // ISO: la clienta la cambió desde «Mi cita»
  enlace?: string; // secreto del enlace «Mi cita» (db.ts)
}

export interface ModalState {
  type: "create" | "edit" | "cobro" | "reagendar" | null;
  data?: Cita | null;
}