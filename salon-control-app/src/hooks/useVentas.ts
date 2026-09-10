import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Venta } from '../types/ventas';
import { sinVentasEspejo } from '../utils/ventasUtils';

export const useVentas = () => {
  // Cargar datos desde Dexie en tiempo real (sin las ventas espejo de citas)
  const rawVentas = sinVentasEspejo(useLiveQuery(() => db.ventas.toArray()) || []);
  const rawClientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const rawInventario = useLiveQuery(() => db.inventario.toArray()) || [];

  // Normalizar datos para la UI (tipos en src/types/ventas.ts)
  const ventas: any[] = rawVentas.map(v => ({
    ...v,
    items: v.productos?.map(p => ({
      itemId: p.productoId,
      cantidad: p.cantidad
    })) || []
  }));

  const clientes: any[] = rawClientes.map(c => ({
    ...c,
    activo: c.activo ?? true
  }));

  const inventario: any[] = rawInventario.map(p => ({
    ...p,
    stock: p.cantidad
  }));

  const addVenta = async (nuevaVenta: any) => {
    // Convertir de UI a DB format
    const dbVenta = {
      ...nuevaVenta,
      productos: nuevaVenta.items?.map((i: any) => ({
        productoId: i.itemId,
        cantidad: i.cantidad,
        precio: 0 // Se calculará en el proceso de venta o se guardará según se necesite
      }))
    };
    await db.ventas.add(dbVenta);
  };

  const deleteVenta = async (ventaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      return false;
    }
    await db.ventas.delete(ventaId);
    return true;
  };

  return {
    ventas,
    clientes,
    inventario,
    addVenta,
    deleteVenta
  };
};