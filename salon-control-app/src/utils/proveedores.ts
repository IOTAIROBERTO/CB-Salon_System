// Proveedores: cálculos puros sobre las compras registradas.
import { normalizar } from './texto';

interface ItemL { productoId: string; nombre: string; cantidad: number; costoUnitario: number }
interface CompraL { proveedorId: string; fecha: string; items: ItemL[] }
interface ProveedorL { id: string; nombre: string }

export interface ProductoComprado { productoId: string; nombre: string; cantidad: number; total: number }

const UN_ANIO = 365 * 24 * 60 * 60 * 1000;
export const haceUnAnio = (hoy = new Date()) => new Date(hoy.getTime() - UN_ANIO).toISOString().slice(0, 10);

/** Lo que más se le compra a un proveedor (por monto), desde una fecha */
export const masComprados = (compras: CompraL[], proveedorId: string, desde = ''): ProductoComprado[] => {
  const porProducto = new Map<string, ProductoComprado>();
  for (const c of compras) {
    if (c.proveedorId !== proveedorId || c.fecha.slice(0, 10) < desde) continue;
    for (const it of c.items) {
      const p = porProducto.get(it.productoId) || { productoId: it.productoId, nombre: it.nombre, cantidad: 0, total: 0 };
      p.cantidad += it.cantidad;
      p.total += it.cantidad * it.costoUnitario;
      porProducto.set(it.productoId, p);
    }
  }
  return [...porProducto.values()].sort((a, b) => b.total - a.total || b.cantidad - a.cantidad);
};

export const totalCompra = (items: ItemL[]) =>
  items.reduce((t, it) => t + (it.cantidad || 0) * (it.costoUnitario || 0), 0);

export const totalComprado = (compras: CompraL[], proveedorId: string, desde = '') =>
  compras.filter(c => c.proveedorId === proveedorId && c.fecha.slice(0, 10) >= desde)
    .reduce((t, c) => t + totalCompra(c.items), 0);

/** Proveedor registrado que corresponde al texto libre de un producto */
export const proveedorPorNombre = <P extends ProveedorL>(proveedores: P[], texto?: string) =>
  texto ? proveedores.find(p => normalizar(p.nombre) === normalizar(texto)) : undefined;

/** Nombres de proveedor escritos en productos que aún no están dados de alta */
export const proveedoresSinAlta = (productos: { proveedor?: string; proveedorId?: string }[], proveedores: ProveedorL[]) => {
  const vistos = new Map<string, { nombre: string; productos: number }>();
  for (const p of productos) {
    if (p.proveedorId || !p.proveedor?.trim() || proveedorPorNombre(proveedores, p.proveedor)) continue;
    const k = normalizar(p.proveedor);
    const v = vistos.get(k) || { nombre: p.proveedor.trim(), productos: 0 };
    v.productos++;
    vistos.set(k, v);
  }
  return [...vistos.values()];
};
