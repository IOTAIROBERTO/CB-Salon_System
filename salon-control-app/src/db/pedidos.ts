// Lo que hace el salón con un pedido de la app («Mi carrito», utils/pedidos.ts): marcar que llegó el pago (la cita queda
// con su anticipo recibido y, si la clienta ya aceptó su resumen, confirmada), entregar los productos (se registra la
// venta y baja el stock) o cancelarlo (lo apartado se libera). El vencimiento y lo no recogido los hace el Worker cb-avisos.
import { db, type Pedido } from './db';
import { registrarVenta } from '../hooks/useVentas';
import { recogerHasta } from '../utils/pedidos';

/** Llegó el pago (transferencia, depósito, efectivo o tarjeta en el salón) */
export async function marcarPagado(p: Pedido, formaPago: NonNullable<Pedido['formaPago']>) {
  const pagadoEn = new Date().toISOString();
  await db.transaction('rw', db.pedidos, db.citas, async () => {
    await db.pedidos.update(p.id, { estado: 'pagado', pagadoEn, formaPago, ...(p.items.length ? { recogerHasta: recogerHasta(pagadoEn) } : {}) });
    const cita = p.citaId ? await db.citas.get(p.citaId) : undefined;
    if (cita && (cita.estado === 'pendiente' || cita.estado === 'confirmada')) await db.citas.update(cita.id, {
      ...(p.anticipo > 0 ? { anticipoConfirmado: true } : {}),
      ...(cita.estado === 'pendiente' && cita.aceptadaEn ? { estado: 'confirmada' as const } : {})
    });
  });
}

/** Se entregaron los productos: venta con los precios del pedido; usa lo que el pedido tenía apartado */
export async function entregarPedido(p: Pedido) {
  const ventaId = `ven_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await registrarVenta({
    id: ventaId, clienteId: p.clienteId, fecha: new Date().toISOString(), total: p.totalProductos, metodoPago: p.formaPago || 'transferencia',
    items: p.items.map(i => ({ itemId: i.productoId, cantidad: i.cantidad, precio: i.precio })), notas: `Pedido de la app ${p.id}`
  }, p.id);
  await db.pedidos.update(p.id, { estado: 'entregado', entregadoEn: new Date().toISOString(), ventaId });
}

/** Cancelado por el salón: lo apartado se libera (si ya estaba pagado, la devolución o el saldo a favor se hacen aparte) */
export const cancelarPedido = (p: Pedido, motivo = 'Cancelado por el salón') => db.pedidos.update(p.id, { estado: 'cancelado', motivo });
