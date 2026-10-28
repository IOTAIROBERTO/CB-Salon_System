export interface Cita {
  id: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'iniciada' | 'completada' | 'cancelada';
  precioFinal?: number;
  propina?: number;
  pagadoConSaldo?: number; // parte pagada con saldo a favor (ya contó como ingreso antes)
  montoAnticipo?: number;
  saldoPendiente?: number;
  metodoPago?: string;
  serviciosAdicionales?: Array<{
    servicioId: string;
    nombre: string;
    precio: number;
  }>;
  descuentoAplicado?: number;
  subtotalOriginal?: number;
  montoDescuento?: number;
  subtotalConDescuento?: number;
  montoRedondeo?: number;
  fechaCompletada?: string;
  notas?: string;
}

export interface Venta {
  id: string;
  fecha: string;
  clienteId?: string;
  clienteNombre?: string;
  productos: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
  total: number;
  metodoPago: string;
  notas?: string;
}

export type { Cliente } from '../db/db';

export interface ServicioCatalogo {
  id: string;
  nombre: string;
  precioSugerido: number;
}

export interface ReportData {
  periodo: string;
  ingresosCitas: number;
  ingresosVentas: number;
  ingresosTotales: number;
  gastos: number;
  gananciaNeta: number;
  servicios: number;
  ventasProductos: number;
}

export interface ReportStats {
  totalIngresos: number;
  totalIngresosCitas: number;
  totalIngresosVentas: number;
  totalGastos: number;
  gananciaNeta: number;
  saldosPendientes: number;
  citasCompletadas: number;
  totalVentas: number;
}

export type ReportPeriod = 'week' | 'month' | 'year';
export type FiltroHistorial = 'todas' | 'completadas' | 'canceladas';