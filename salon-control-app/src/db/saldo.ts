// Escrituras del saldo a favor y de las tarjetas de regalo (reglas en utils/saldo).
import { db } from './db';
import { errorActivacion, normalizarFolio } from '../utils/saldo';

const id = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/** Registra la venta de una tarjeta: cuenta como ingreso hoy (se cobró completa) */
export const venderTarjeta = async (o: { folio: string; monto: number; compradora?: string; metodoPago: string }) => {
  const folio = normalizarFolio(o.folio);
  if (!folio) throw new Error('Escribe el folio impreso en la tarjeta');
  if (!(o.monto > 0)) throw new Error('Elige el monto');
  if (await db.tarjetasRegalo.where('folio').equals(folio).count()) throw new Error('Ese folio ya está registrado');
  const fecha = new Date().toISOString();
  // Ids que salen del folio: si dos equipos registran el mismo folio sin conexión, al sincronizar es un solo registro
  const ventaId = `vta_tarjeta_${folio}`;
  await db.transaction('rw', db.ventas, db.tarjetasRegalo, async () => {
    await db.ventas.add({ id: ventaId, fecha, clienteId: '', total: o.monto, metodoPago: o.metodoPago, concepto: `Tarjeta de regalo ${folio}` });
    await db.tarjetasRegalo.add({ id: `tar_${folio}`, folio, monto: o.monto, fechaVenta: fecha, compradora: o.compradora?.trim() || undefined, metodoPago: o.metodoPago, ventaId });
  });
};

/** Activa la tarjeta para la clienta: su monto pasa a saldo a favor (no vence) */
export const activarTarjeta = async (folioEscrito: string, clienteId: string) => {
  const folio = normalizarFolio(folioEscrito);
  const t = await db.tarjetasRegalo.where('folio').equals(folio).first();
  const error = errorActivacion(t);
  if (error) throw new Error(error);
  // Una sola activación por folio: el abono tiene id fijo, así que activarla dos veces
  // (en dos equipos sin conexión) no duplica el saldo al sincronizar.
  const abonoId = `sal_tarjeta_${folio}`;
  if (await db.movimientosSaldo.get(abonoId)) throw new Error('Esa tarjeta ya se activó');
  const fecha = new Date().toISOString();
  await db.transaction('rw', db.tarjetasRegalo, db.movimientosSaldo, async () => {
    await db.tarjetasRegalo.update(t!.id, { activadaPor: clienteId, fechaActivacion: fecha });
    await db.movimientosSaldo.add({ id: abonoId, clienteId, fecha, monto: t!.monto, concepto: `Tarjeta de regalo ${folio}`, folio });
  });
  return t!.monto;
};

/** Abono manual (pedido no recogido, ajuste): solo la Dueña */
export const abonarSaldo = (clienteId: string, monto: number, concepto: string) =>
  db.movimientosSaldo.add({ id: id('sal'), clienteId, fecha: new Date().toISOString(), monto, concepto: concepto.trim() || 'Abono' });

/** Cargo al usar el saldo en un cobro */
export const usarSaldo = (clienteId: string, monto: number, citaId?: string, concepto = 'Pago con saldo a favor') =>
  monto > 0 ? db.movimientosSaldo.add({ id: id('sal'), clienteId, fecha: new Date().toISOString(), monto: -monto, concepto, citaId }) : Promise.resolve('');
