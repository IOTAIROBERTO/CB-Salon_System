export interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Item {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
}

export interface VentaItem {
  itemId: string;
  cantidad: number;
}

export interface Venta {
  id: string;
  clienteId: string;
  items: VentaItem[];
  total: number;
  fecha: string;
  notas?: string;
  empleadoId?: string;
}

export interface VentaFormData {
  clienteId: string;
  items: VentaItem[];
  notas: string;
  empleadoId?: string;
}

export interface VentasStats {
  totalVentas: number;
  ingresosTotales: number;
  ventasHoy: number;
  promedioVenta: number;
}