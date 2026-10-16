import { db, type Proveedor, type CompraItem } from './db';
import { totalCompra } from '../utils/proveedores';
import { normalizar } from '../utils/texto';
import { fechaLocalISO } from '../utils/dateValidation';

export const nuevoProveedor = (nombre = ''): Proveedor => ({
  id: `prov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  nombre,
  activo: true,
  fechaAlta: fechaLocalISO()
});

export const guardarProveedor = (p: Proveedor) => db.proveedores.put({ ...p, nombre: p.nombre.trim() });

/** Liga o desliga un producto del inventario con un proveedor */
export const vincularProducto = (productoId: string, proveedor: Proveedor | null) =>
  db.inventario.update(productoId, { proveedorId: proveedor?.id, proveedor: proveedor?.nombre ?? '' });

/** Da de alta un proveedor escrito a mano en productos y los liga a él */
export const darDeAltaDesdeProductos = async (nombre: string) => {
  const p = nuevoProveedor(nombre.trim());
  await db.transaction('rw', db.proveedores, db.inventario, async () => {
    await db.proveedores.add(p);
    await db.inventario.filter(x => !x.proveedorId && normalizar(x.proveedor) === normalizar(nombre))
      .modify({ proveedorId: p.id, proveedor: p.nombre });
  });
  return p;
};

interface NuevaCompra {
  proveedor: Proveedor;
  fecha: string;
  folio?: string;
  notas?: string;
  items: CompraItem[];
  comoGasto: boolean;
  pagado: boolean;
}

/**
 * Registra la compra: sube el stock y el costo de cada producto, lo liga al
 * proveedor si no tenía, y opcionalmente la anota en Gastos (pendiente de
 * pago si el proveedor da crédito).
 */
export const registrarCompra = async ({ proveedor, fecha, folio, notas, items, comoGasto, pagado }: NuevaCompra) => {
  const validos = items.filter(it => it.productoId && it.cantidad > 0);
  if (!validos.length) throw new Error('Agrega al menos un producto con cantidad');
  const total = totalCompra(validos);

  await db.transaction('rw', db.compras, db.inventario, db.gastos, async () => {
    const gastoId = comoGasto
      ? String(await db.gastos.add({
          concepto: `Compra a ${proveedor.nombre}`, monto: total, fecha, categoria: 'variable', pagado,
          notas: [folio && `Folio ${folio}`, notas].filter(Boolean).join(' · ') || undefined
        } as any))
      : undefined;
    await db.compras.add({ id: `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, proveedorId: proveedor.id, fecha, folio: folio || undefined, items: validos, total, gastoId, notas: notas || undefined });
    for (const it of validos) {
      const p = await db.inventario.get(it.productoId);
      if (!p) continue;
      await db.inventario.update(it.productoId, {
        cantidad: (p.cantidad || 0) + it.cantidad,
        costo: it.costoUnitario || p.costo,
        fechaUltimaCompra: fecha,
        ...(!p.proveedorId && { proveedorId: proveedor.id, proveedor: proveedor.nombre })
      });
    }
  });
  return total;
};
