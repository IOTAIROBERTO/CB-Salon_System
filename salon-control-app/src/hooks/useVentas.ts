import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
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

  // Guarda la venta y descuenta el stock en una sola transacción (o todo o nada)
  const addVenta = async (nuevaVenta: any) => {
    await db.transaction('rw', db.ventas, db.inventario, async () => {
      const productos = [];
      for (const i of nuevaVenta.items || []) {
        const producto = await db.inventario.get(i.itemId);
        if (!producto) throw new Error('Producto no encontrado en inventario');
        if (producto.cantidad < i.cantidad) {
          throw new Error(`Stock insuficiente de ${producto.nombre} (quedan ${producto.cantidad})`);
        }
        await db.inventario.update(producto.id, { cantidad: producto.cantidad - i.cantidad });
        // Precio congelado al momento de la venta
        productos.push({ productoId: i.itemId, cantidad: i.cantidad, precio: producto.precio });
      }
      await db.ventas.add({ ...nuevaVenta, productos });
    });
  };

  // Elimina la venta y devuelve el stock al inventario
  const deleteVenta = async (ventaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta? El stock se devolverá al inventario.')) {
      return false;
    }
    await db.transaction('rw', db.ventas, db.inventario, async () => {
      const venta = await db.ventas.get(ventaId);
      for (const p of venta?.productos || []) {
        const producto = await db.inventario.get(p.productoId);
        if (producto) await db.inventario.update(producto.id, { cantidad: producto.cantidad + p.cantidad });
      }
      await db.ventas.delete(ventaId);
    });
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