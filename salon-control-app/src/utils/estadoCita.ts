// Reglas de dinero al cerrar o borrar una cita. Lógica pura, sin base de datos: la misma política de 48 h que aplica la
// clienta en «Mi cita» (app-clientas/api/salon.ts). Sin hora todavía nada corre: siempre está a tiempo.
export const HORAS_SIN_COSTO = 48;

interface CitaDinero { fecha: string; hora?: string; estado?: string; anticipoConfirmado?: boolean; montoAnticipo?: number; anticipoASaldo?: number; anticipoPerdido?: number; anticipoPorAprobar?: number }

/** Qué pasa con el anticipo si se cancela ahora */
export function consecuenciaCancelar(c: CitaDinero, ahora = Date.now()) {
  const pagado = c.anticipoConfirmado ? c.montoAnticipo || 0 : 0;
  const faltan = c.hora ? (new Date(`${c.fecha}T${c.hora}:00`).getTime() - ahora) / 3600000 : Infinity;
  const aTiempo = faltan >= HORAS_SIN_COSTO;
  return { pagado, aTiempo, destino: !pagado ? null : aTiempo ? 'saldo' as const : 'perdido' as const };
}

/** Cerrada: ya no se edita (reabrirla dejaría viva la cita y además el saldo o el ingreso que generó) */
export const citaCerrada = (c: { estado?: string }) => c.estado === 'completada' || c.estado === 'cancelada' || c.estado === 'no_llego';

/** Por qué no se puede borrar, o '' si se puede: borrar una cita con dinero dejaría cargos sin su cita y bajaría el ingreso */
export function motivoNoBorrar(c: CitaDinero) {
  if (c.estado === 'completada') return 'Esta cita ya se cobró: no se puede eliminar. La Dueña puede anular el cobro.';
  if (c.anticipoASaldo || c.anticipoPerdido || c.anticipoPorAprobar) return 'Esta cita tiene un anticipo registrado en el saldo o en los ingresos: no se puede eliminar.';
  if (c.anticipoConfirmado && c.montoAnticipo) return 'Esta cita tiene un anticipo recibido: cancélala para que el anticipo quede registrado.';
  return '';
}

interface MovCobro { id: string; citaId?: string; monto: number; origen?: string; puntos?: number; fecha: string }
interface CanjeCobro { citaId?: string; puntos?: number; fecha: string }

/** Qué se revierte al anular un cobro. El saldo se devuelve con un abono (el neto de la cita, así anular y volver a cobrar
 *  varias veces cuadra). Los regalos del Club vuelven a estar disponibles y sus puntos regresan: su movimiento no trae
 *  citaId, se identifica por la fecha del canje. Cambiar puntos por saldo no se revierte: ese saldo ya vuelve a su cuenta. */
export function reversaCobro<C extends CanjeCobro>(citaId: string, movimientos: MovCobro[], canjes: C[]) {
  const fechas = new Set(canjes.filter(c => c.citaId === citaId && c.puntos).map(c => c.fecha));
  const neto = movimientos.filter(m => m.citaId === citaId).reduce((t, m) => t + m.monto, 0);
  return {
    devolver: neto < 0 ? -neto : 0,
    canjes: canjes.filter(c => c.citaId !== citaId),
    movimientosABorrar: movimientos.filter(m => m.origen === 'club' && m.puntos && fechas.has(m.fecha)).map(m => m.id)
  };
}

/** Solo lo que el formulario cambió. Guardar la cita entera con la copia que se abrió revertiría lo que pasó mientras
 *  tanto (que la clienta aceptó, que el Worker mandó un recordatorio, que se recibió el anticipo). */
export function soloCambios(antes: object, despues: object): Record<string, unknown> {
  const norma = (x: unknown) => JSON.stringify(x ?? '');
  return Object.fromEntries(Object.entries(despues).filter(([k, v]) => norma(v) !== norma((antes as Record<string, unknown>)[k])));
}
/** Al mover una cita de día u hora: sus avisos de WhatsApp se vuelven a mandar y ya no queda un cambio por atender */
export const AL_MOVER_CITA = { recordatorio: undefined, avisoConfirmacion: undefined, cambioPedido: undefined };

/** Lo que queda del pedido al recibir el anticipo por fuera de él: sin productos se paga completo; con productos, siguen por pagar solos */
export const pedidoTrasAnticipo = (p: { items: unknown[]; totalProductos: number }) =>
  p.items.length ? { pagarCompleto: false, anticipo: 0, total: p.totalProductos } : { pagarCompleto: true, anticipo: 0, total: p.totalProductos };
