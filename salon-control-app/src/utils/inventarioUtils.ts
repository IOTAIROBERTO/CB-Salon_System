import { type Producto, type ProductoFormData, type StockMovimiento, type InventarioStats, type MovimientoHistorial } from '../types/inventario';
import { formatCurrency } from './financialUtils';

export const validateProductoForm = (formData: ProductoFormData): string | null => {
  if (!formData.nombre.trim()) {
    return 'El nombre del producto es obligatorio';
  }

  if (formData.precio <= 0) {
    return 'El precio debe ser mayor a 0';
  }

  if (!formData.categoria.trim()) {
    return 'La categoría es obligatoria';
  }

  if (formData.stockMinimo < 0) {
    return 'El stock mínimo no puede ser negativo';
  }

  if (formData.costo < 0) {
    return 'El costo no puede ser negativo';
  }

  return null;
};

export const validateStockForm = (stockData: StockMovimiento): string | null => {
  if (stockData.cantidad <= 0) {
    return 'La cantidad debe ser mayor a 0';
  }

  if (!stockData.motivo.trim()) {
    return 'El motivo es obligatorio';
  }

  return null;
};

export const generateProductoId = (): string => {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateStats = (inventario: Producto[]): InventarioStats => {
  const totalProductos = inventario.length;
  const productosStockBajo = inventario.filter(p => p.cantidad <= (p.stockMinimo ?? 0)).length;
  const valorTotalInventario = inventario.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
  const categorias = [...new Set(inventario.map(p => p.categoria))].length;

  return {
    totalProductos,
    productosStockBajo,
    valorTotalInventario,
    categorias
  };
};

export const getProductosStockBajo = (inventario: Producto[]): Producto[] => {
  return inventario.filter(p => p.cantidad <= (p.stockMinimo ?? 0));
};

export const getStockColor = (producto: Producto): string => {
  if (producto.cantidad === 0) return 'text-red-600 bg-red-50';
  if (producto.cantidad <= (producto.stockMinimo ?? 0)) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
};

export const calculateNewStock = (currentStock: number, movement: StockMovimiento): number => {
  return movement.operacion === 'suma'
    ? currentStock + movement.cantidad
    : Math.max(0, currentStock - movement.cantidad);
};

export const createMovimientoHistorial = (
  producto: Producto,
  stockData: StockMovimiento,
  cantidadNueva: number
): MovimientoHistorial => {
  return {
    id: generateProductoId(),
    productoId: producto.id,
    productoNombre: producto.nombre,
    cantidad: stockData.cantidad,
    operacion: stockData.operacion,
    motivo: stockData.motivo,
    cantidadAnterior: producto.cantidad,
    cantidadNueva,
    fecha: new Date().toISOString()
  };
};

export const saveMovimientoHistorial = (movimiento: MovimientoHistorial): void => {
  const movimientos = JSON.parse(localStorage.getItem('movimientosStock') || '[]');
  movimientos.push(movimiento);
  localStorage.setItem('movimientosStock', JSON.stringify(movimientos));
};

export const formatPrice = (price: number): string => {
  return formatCurrency(price);
};

export const willBeStockBajo = (producto: Producto, cantidadARestar: number): boolean => {
  return (producto.cantidad - cantidadARestar) < (producto.stockMinimo ?? 0);
};
// Regla de la auditoría 2026: ningún producto se vende a menos de costo × 1.6.
export const MARGEN_MINIMO = 1.6;

export type EstadoPrecio = 'sin-costo' | 'perdida' | 'subir' | 'ok';

export const estadoPrecio = (producto: Pick<Producto, 'precio' | 'costo'>): EstadoPrecio => {
  if (!producto.costo) return 'sin-costo';
  if (producto.precio < producto.costo) return 'perdida';
  if (producto.precio < producto.costo * MARGEN_MINIMO) return 'subir';
  return 'ok';
};

/** Precio mínimo sugerido, redondeado a la decena */
export const precioMinimo = (costo: number): number => Math.round((costo * MARGEN_MINIMO) / 10) * 10;

/** Margen sobre el precio de venta (0.32 = 32%) */
export const margenPorcentaje = (producto: Pick<Producto, 'precio' | 'costo'>): number | null =>
  producto.costo && producto.precio > 0 ? (producto.precio - producto.costo) / producto.precio : null;

export const getProductosPrecioBajo = (inventario: Producto[]): Producto[] =>
  inventario.filter(p => ['perdida', 'subir'].includes(estadoPrecio(p)));
