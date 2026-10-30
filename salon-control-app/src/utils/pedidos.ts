// Pedidos de la app («Mi carrito»): los productos y el anticipo de su cita se pagan juntos y con plazo. Política (28 de
// octubre de 2026, como Amazon con OXXO y Mercado Pago con sus referencias): 48 h para pagar y nunca después de 48 h antes
// de su cita; sin pago a tiempo el pedido vence solo y se liberan el horario y los productos (pagar tarde no lo revive).
// Mientras está por pagar o pagado sin entregar, lo apartado no se vende en la tienda. Pagados, los productos se recogen
// en su cita o en 10 días; si no, vuelven a la venta y lo pagado queda como saldo a favor.
// Lógica pura, sin base de datos: la usan CB Control, la API y el Worker.

export const HORAS_PARA_PAGAR = 48;
export const HORAS_ANTES_DE_LA_CITA = 48;
export const HORAS_MINIMAS = 2;   // cita muy cerca: este rato para pagar al momento, y nunca después de 2 h antes
export const DIAS_PARA_RECOGER = 10;
const HORA = 3600 * 1000;

export type EstadoPedido = 'por_pagar' | 'pagado' | 'entregado' | 'vencido' | 'no_recogido' | 'cancelado';
export interface ItemPedido { productoId: string; nombre: string; cantidad: number; precio: number }

/** Hasta cuándo puede pagar (ms): 48 h desde `desde` y nunca después de 48 h antes de la cita. Si la cita ya está muy
 *  cerca, un margen corto para pagar al momento; si ni eso cabe, el resultado es ≤ `desde` (ya no se puede apartar). */
export function plazoDePago(desde: number, cita?: number) {
  let vence = desde + HORAS_PARA_PAGAR * HORA;
  if (cita != null) {
    vence = Math.min(vence, cita - HORAS_ANTES_DE_LA_CITA * HORA);
    if (vence < desde + HORAS_MINIMAS * HORA) vence = Math.min(desde + HORAS_MINIMAS * HORA, cita - HORAS_MINIMAS * HORA);
  }
  return vence;
}

/** Aparta existencia mientras está por pagar o pagado y sin entregar */
export const aparta = (p: { estado: EstadoPedido }) => p.estado === 'por_pagar' || p.estado === 'pagado';

/** Piezas apartadas de cada producto (sin contar el pedido `salvo`: el que se está entregando) */
export function apartados(pedidos: { id?: string; estado: EstadoPedido; items: ItemPedido[] }[], salvo?: string) {
  const r: Record<string, number> = {};
  for (const p of pedidos) if (aparta(p) && p.id !== salvo) for (const i of p.items) r[i.productoId] = (r[i.productoId] || 0) + i.cantidad;
  return r;
}

/** Piezas que se pueden vender, en la tienda o en la app: existencia menos lo apartado */
export const disponible = (producto: { id: string; cantidad: number }, apartadas: Record<string, number>) =>
  Math.max(0, (producto.cantidad || 0) - (apartadas[producto.id] || 0));

export const totalItems = (items: ItemPedido[]) => items.reduce((t, i) => t + i.precio * i.cantidad, 0);

/** Hasta cuándo puede recoger lo que pagó (ISO) */
export const recogerHasta = (pagadoEn: string) => new Date(Date.parse(pagadoEn) + DIAS_PARA_RECOGER * 24 * HORA).toISOString();

export const NOMBRE_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  por_pagar: 'Por pagar', pagado: 'Pagado, por entregar', entregado: 'Entregado', vencido: 'Venció sin pago',
  no_recogido: 'No lo recogió (saldo a favor)', cancelado: 'Cancelado'
};
