// Escrituras del Círculo CB: los canjes y la recomendación viven en la clienta,
// así sincronizan con Dexie Cloud sin tabla nueva.
import { db } from './db';
import { NOMBRE_CIRCULO, costoPuntos, montoCanje, montoTarjeta, tituloCanje, type ClaveBeneficio, type Nivel, type ParametrosCirculo } from '../utils/lealtad';
import { normalizarFolio } from '../utils/saldo';

/** Los regalos de nivel (con costo en puntos) escriben movimientosSaldo, que solo la Dueña puede escribir en Dexie Cloud:
 *  las pantallas solo los ofrecen a la Dueña, para que nunca quede un regalo usado sin descontar sus puntos. */
export const registrarCanjes = async (clienteId: string, claves: ClaveBeneficio[], citaId?: string) => {
  if (!claves.length) return;
  const cliente = await db.clientes.get(clienteId);
  if (!cliente) return;
  const fecha = new Date().toISOString();
  await db.transaction('rw', db.clientes, db.movimientosSaldo, async () => {
    await db.clientes.update(clienteId, {
      canjes: [...(cliente.canjes || []), ...claves.map(clave => ({ clave, fecha, citaId, puntos: costoPuntos(clave) || undefined }))]
    });
    // Los regalos de nivel cuestan puntos: se descuentan como cualquier canje (sin dar saldo)
    for (const [i, clave] of claves.entries()) {
      const puntos = costoPuntos(clave);
      if (puntos) await db.movimientosSaldo.add({ id: `sal_club_${clienteId}_${Date.now()}_${i}`, clienteId, fecha, monto: 0, concepto: tituloCanje({ clave }), origen: 'club', puntos });
    }
  });
};

/** Cambia puntos por saldo a favor (solo la Dueña). Los puntos se descuentan del movimiento de saldo;
 *  la copia en la clienta es solo para el historial. */
export const canjearPuntos = async (clienteId: string, puntos: number, p: ParametrosCirculo) => {
  const cliente = await db.clientes.get(clienteId);
  if (!cliente) throw new Error('No se encontró la clienta');
  const fecha = new Date().toISOString();
  const monto = montoCanje(puntos, p);
  await db.transaction('rw', db.clientes, db.movimientosSaldo, async () => {
    await db.clientes.update(clienteId, { canjes: [...(cliente.canjes || []), { clave: 'saldo', fecha, puntos }] });
    await db.movimientosSaldo.add({ id: `sal_club_${clienteId}_${Date.now()}`, clienteId, fecha, monto, concepto: `Canje de ${puntos} puntos del ${NOMBRE_CIRCULO}`, origen: 'club', puntos });
  });
  return monto;
};

/** Cambia puntos por una tarjeta de regalo impresa para otra persona (solo la Dueña). El movimiento de saldo
 *  con monto 0 descuenta los puntos sin darle saldo a la clienta; la tarjeta queda lista para activarse. */
export const canjearPorTarjeta = async (clienteId: string, puntos: number, folioEscrito: string, nivel: Nivel, p: ParametrosCirculo) => {
  const cliente = await db.clientes.get(clienteId);
  if (!cliente) throw new Error('No se encontró la clienta');
  const folio = normalizarFolio(folioEscrito);
  if (!folio) throw new Error('Escribe el folio impreso en la tarjeta');
  if (await db.tarjetasRegalo.where('folio').equals(folio).count()) throw new Error('Ese folio ya está registrado');
  const fecha = new Date().toISOString();
  const monto = montoTarjeta(puntos, nivel, p);
  await db.transaction('rw', db.clientes, db.movimientosSaldo, db.tarjetasRegalo, async () => {
    await db.clientes.update(clienteId, { canjes: [...(cliente.canjes || []), { clave: 'tarjeta', fecha, puntos }] });
    await db.movimientosSaldo.add({ id: `sal_club_${clienteId}_${Date.now()}`, clienteId, fecha, monto: 0, concepto: `Tarjeta de regalo ${folio} con ${puntos} puntos del ${NOMBRE_CIRCULO}`, origen: 'club', puntos, folio });
    await db.tarjetasRegalo.add({ id: `tar_${folio}`, folio, monto, fechaVenta: fecha, compradora: `${cliente.nombre} (puntos del Club)`, metodoPago: 'puntos' });
  });
  return monto;
};

export const asignarRecomendacion = (clienteId: string, referidaPor: string) =>
  db.clientes.update(clienteId, { referidaPor: referidaPor || undefined });
