import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Producto, StockMovimiento } from '../types/inventario';
import {
  generateProductoId,
  calculateNewStock,
  createMovimientoHistorial,
  saveMovimientoHistorial
} from '../utils/inventarioUtils';

export const useInventario = () => {
  // Cargar inventario desde Dexie en tiempo real
  const inventario = useLiveQuery(() => db.inventario.toArray()) || [];

  const addProducto = async (productoData: Omit<Producto, 'id' | 'fechaUltimaCompra' | 'stockMinimo'>) => {
    const newProducto: Producto = {
      id: generateProductoId(),
      ...productoData,
      stockMinimo: 5, // Default stock minimo if not provided
      fechaUltimaCompra: new Date().toISOString().split('T')[0]
    } as any;

    await db.inventario.add(newProducto);
    return newProducto;
  };

  const updateProducto = async (productoId: string, updatedData: Partial<Producto>) => {
    await db.inventario.update(productoId, updatedData);
  };

  const updateStock = async (productoId: string, stockData: StockMovimiento): Promise<boolean> => {
    const producto = await db.inventario.get(productoId);
    if (!producto) return false;

    const nuevaCantidad = calculateNewStock(producto.cantidad, stockData);

    // Crear historial del movimiento (sigue en localStorage por ahora o podrías migrarlo si hay tiempo)
    const movimiento = createMovimientoHistorial(producto, stockData, nuevaCantidad);
    saveMovimientoHistorial(movimiento);

    // Actualizar producto
    const updatedData: Partial<Producto> = {
      cantidad: nuevaCantidad,
      fechaUltimaCompra: stockData.operacion === 'suma'
        ? new Date().toISOString().split('T')[0]
        : producto.fechaUltimaCompra
    };

    await db.inventario.update(productoId, updatedData);
    return true;
  };

  const deleteProducto = async (productoId: string): Promise<boolean> => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      return false;
    }

    await db.inventario.delete(productoId);
    return true;
  };

  return {
    inventario,
    addProducto,
    updateProducto,
    updateStock,
    deleteProducto
  };
};