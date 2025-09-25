export interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  stockMinimo: number;
  categoria: string;
  fechaUltimaCompra?: string;
  proveedor?: string;
}

export interface ProductoFormData {
  nombre: string;
  cantidad: number;
  precio: number;
  stockMinimo: number;
  categoria: string;
  proveedor: string;
}

export interface StockMovimiento {
  cantidad: number;
  operacion: 'suma' | 'resta';
  motivo: string;
}

export interface MovimientoHistorial {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  operacion: 'suma' | 'resta';
  motivo: string;
  cantidadAnterior: number;
  cantidadNueva: number;
  fecha: string;
}

export interface InventarioStats {
  totalProductos: number;
  productosStockBajo: number;
  valorTotalInventario: number;
  categorias: number;
}

export type ModalType = 'create' | 'edit' | 'stock';

export const INVENTARIO_INICIAL: Producto[] = [
  {
    id: 'p1',
    nombre: 'Shampoo hidratante',
    cantidad: 10,
    precio: 250.00,
    stockMinimo: 5,
    categoria: 'Cuidado capilar',
    proveedor: 'Beauty Supply Co.'
  },
  {
    id: 'p2',
    nombre: 'Tinte rubio',
    cantidad: 3,
    precio: 180.00,
    stockMinimo: 5,
    categoria: 'Coloración',
    proveedor: 'Color Pro'
  },
  {
    id: 'p3',
    nombre: 'Esmalte de uñas rojo',
    cantidad: 8,
    precio: 75.00,
    stockMinimo: 3,
    categoria: 'Manicure',
    proveedor: 'Nail Beauty'
  }
];