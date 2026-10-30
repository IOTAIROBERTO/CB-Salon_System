import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { sinVentasEspejo } from '../utils/ventasUtils';
import { apartados, disponible } from '../utils/pedidos';

/** Guarda la venta y descuenta el stock en una sola transacción (o todo o nada). Lo apartado en pedidos de la app no se
 *  puede vender: solo el pedido `pedidoId` (el que se entrega) usa lo suyo. */
export async function registrarVenta(nuevaVenta: any, pedidoId?: string) {
  await db.transaction('rw', db.ventas, db.inventario, db.pedidos, async () => {
    const aparts = apartados(await db.pedidos.toArray(), pedidoId);
    const productos = [];
    for (const i of nuevaVenta.items || []) {
      const producto = await db.inventario.get(i.itemId);
      if (!producto) throw new Error('Producto no encontrado en inventario');
      const libres = disponible(producto, aparts);
      if (libres < i.cantidad) {
        throw new Error(`Stock insuficiente de ${producto.nombre}: quedan ${libres}${aparts[producto.id] ? ` (${aparts[producto.id]} apartados en pedidos de la app)` : ''}`);
      }
      await db.inventario.update(producto.id, { cantidad: producto.cantidad - i.cantidad });
      // Precio congelado al momento de la venta
      productos.push({ productoId: i.itemId, cantidad: i.cantidad, precio: i.precio ?? producto.precio });
    }
    await db.ventas.add({ ...nuevaVenta, productos });
  });
}

export const useVentas = () => {
  // Cargar datos desde Dexie en tiempo real (sin las ventas espejo de citas)
  const rawVentas = sinVentasEspejo(useLiveQuery(() => db.ventas.toArray()) || []);
  const rawClientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const rawInventario = useLiveQuery(() => db.inventario.toArray()) || [];
  const aparts = apartados(useLiveQuery(() => db.pedidos.toArray()) || []);

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

  // En la tienda solo se vende lo que no está apartado en pedidos de la app
  const inventario: any[] = rawInventario.map(p => ({
    ...p,
    stock: disponible(p, aparts),
    apartados: aparts[p.id] || 0
  }));

  const addVenta = (nuevaVenta: any) => registrarVenta(nuevaVenta);

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