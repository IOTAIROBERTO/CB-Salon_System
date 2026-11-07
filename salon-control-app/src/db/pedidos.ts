// Lo que hace el salón con un pedido de la app («Mi carrito», utils/pedidos.ts): marcar que llegó el pago (la cita queda
// con su anticipo recibido y, si la clienta ya aceptó su resumen, confirmada), entregar los productos (se registra la
// venta y baja el stock) o cancelarlo (lo apartado se libera). El vencimiento y lo no recogido los hace el Worker cb-avisos.
import { db, type Pedido } from './db';
import { registrarVenta } from '../hooks/useVentas';
import { recogerHasta } from '../utils/pedidos';
import { pedidoTrasAnticipo } from '../utils/estadoCita';

/** Llegó el pago (transferencia, depósito, efectivo o tarjeta en el salón) */
export async function marcarPagado(p: Pedido, formaPago: NonNullable<Pedido['formaPago']>) {
  const pagadoEn = new Date().toISOString();
  await db.transaction('rw', db.pedidos, db.citas, async () => {
    const cita = p.citaId ? await db.citas.get(p.citaId) : undefined;
    await db.pedidos.update(p.id, { estado: 'pagado', pagadoEn, formaPago, ...(p.items.length ? { recogerHasta: recogerHasta(pagadoEn, cita?.fecha) } : {}) });
    if (cita && (cita.estado === 'pendiente' || cita.estado === 'confirmada')) await db.citas.update(cita.id, {
      ...(p.anticipo > 0 ? { anticipoConfirmado: true } : {}),
      ...(cita.estado === 'pendiente' && cita.aceptadaEn ? { estado: 'confirmada' as const } : {})
    });
  });
}

/** Se recibió el anticipo fuera del pedido («Recibido» en Hoy, editarlo en Citas). El pedido de esa cita debe enterarse:
 *  si no, la clienta seguiría viendo «por pagar» y al vencer se avisaría «Venció sin pago». Sin productos queda pagado;
 *  con productos, estos siguen por pagar solos, sin el anticipo. $0 = sin anticipo recibido. */
export async function registrarAnticipo(citaId: string, monto: number) {
  const cita = await db.citas.get(citaId);
  await db.citas.update(citaId, { anticipoConfirmado: monto > 0, montoAnticipo: monto });
  if (!(monto > 0)) return;
  const p = (await db.pedidos.where('citaId').equals(citaId).toArray()).find(x => x.estado === 'por_pagar');
  if (!p) return;
  const queda = pedidoTrasAnticipo(p);
  if (queda.pagarCompleto) await marcarPagado(p, cita?.formaAnticipo === 'deposito' ? 'deposito' : 'transferencia');
  else await db.pedidos.update(p.id, { anticipo: queda.anticipo, total: queda.total });
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

/** Si este pedido traía el anticipo de una cita que sigue esperándolo, cancelarlo también cancela la cita (igual que al vencer) */
export const cancelaSuCita = async (p: Pedido) => {
  const cita = p.anticipo > 0 && p.citaId ? await db.citas.get(p.citaId) : undefined;
  return cita?.estado === 'pendiente' && !cita.anticipoConfirmado ? cita : undefined;
};

/** Cancelado por el salón: lo apartado se libera (si ya estaba pagado, la devolución o el saldo a favor se hacen aparte) */
export const cancelarPedido = async (p: Pedido, motivo = 'Cancelado por el salón') => {
  await db.transaction('rw', db.pedidos, db.citas, async () => {
    const cita = await cancelaSuCita(p);
    await db.pedidos.update(p.id, { estado: 'cancelado', motivo });
    if (cita) await db.citas.update(cita.id, { estado: 'cancelada', canceladaPor: 'salon', canceladaEn: new Date().toISOString(), canceladaMotivo: 'se canceló su pedido', propuestaVence: undefined });
  });
};
