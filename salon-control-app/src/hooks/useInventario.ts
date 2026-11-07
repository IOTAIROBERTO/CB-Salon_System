import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { type Producto, type StockMovimiento } from '../types/inventario';
import {
  generateProductoId,
  calculateNewStock,
  createMovimientoHistorial,
  saveMovimientoHistorial
} from '../utils/inventarioUtils';
import { fechaLocalISO } from '../utils/dateValidation';
import { avisar, confirmar } from '../components/Confirmar';
import { apartados } from '../utils/pedidos';

export const useInventario = () => {
  // Cargar inventario desde Dexie en tiempo real
  // Productos viejos sin stockMinimo usan 5 (si no, nunca salta la alerta de stock bajo)
  const inventario = (useLiveQuery(() => db.inventario.toArray()) || [])
    .map(p => ({ ...p, stockMinimo: p.stockMinimo ?? 5 }));

  const addProducto = async (productoData: Omit<Producto, 'id' | 'fechaUltimaCompra' | 'stockMinimo'> & { stockMinimo?: number }) => {
    const newProducto: Producto = {
      id: generateProductoId(),
      stockMinimo: 5, // Default si no viene en el formulario
      ...productoData,
      fechaUltimaCompra: fechaLocalISO()
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
    const apartadas = apartados(await db.pedidos.toArray())[productoId] || 0;
    if (stockData.operacion === 'resta' && nuevaCantidad < apartadas) {   // si no, la entrega de un pedido pagado fallaría
      await avisar(`Solo puedes sacar ${Math.max(0, producto.cantidad - apartadas)}: hay ${apartadas} apartadas en pedidos de la app.`);
      return false;
    }

    // Crear historial del movimiento (sigue en localStorage por ahora o podrías migrarlo si hay tiempo)
    const movimiento = createMovimientoHistorial(producto, stockData, nuevaCantidad);
    saveMovimientoHistorial(movimiento);

    // Actualizar producto
    const updatedData: Partial<Producto> = {
      cantidad: nuevaCantidad,
      fechaUltimaCompra: stockData.operacion === 'suma'
        ? fechaLocalISO()
        : producto.fechaUltimaCompra
    };

    await db.inventario.update(productoId, updatedData);
    return true;
  };

  const deleteProducto = async (productoId: string): Promise<boolean> => {
    const apartadas = apartados(await db.pedidos.toArray())[productoId] || 0;
    if (apartadas) {
      await avisar(`Hay ${apartadas} apartadas en pedidos de la app: no se puede eliminar hasta entregarlas o cancelar esos pedidos.`);
      return false;
    }
    if (!(await confirmar('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.'))) {
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