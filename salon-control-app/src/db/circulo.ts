// Escrituras del Círculo CB: los canjes y la recomendación viven en la clienta,
// así sincronizan con Dexie Cloud sin tabla nueva.
import { db } from './db';
import { NOMBRE_CIRCULO, montoCanje, type ClaveBeneficio, type ParametrosCirculo } from '../utils/lealtad';

export const registrarCanjes = async (clienteId: string, claves: ClaveBeneficio[], citaId?: string) => {
  if (!claves.length) return;
  const cliente = await db.clientes.get(clienteId);
  if (!cliente) return;
  const fecha = new Date().toISOString();
  await db.clientes.update(clienteId, {
    canjes: [...(cliente.canjes || []), ...claves.map(clave => ({ clave, fecha, citaId }))]
  });
};

/** Cambia puntos por saldo a favor (solo la Dueña): el canje queda en la clienta y el saldo en movimientosSaldo */
export const canjearPuntos = async (clienteId: string, puntos: number, p: ParametrosCirculo) => {
  const cliente = await db.clientes.get(clienteId);
  if (!cliente) throw new Error('No se encontró la clienta');
  const fecha = new Date().toISOString();
  const monto = montoCanje(puntos, p);
  await db.transaction('rw', db.clientes, db.movimientosSaldo, async () => {
    await db.clientes.update(clienteId, { canjes: [...(cliente.canjes || []), { clave: 'saldo', fecha, puntos }] });
    await db.movimientosSaldo.add({ id: `sal_club_${clienteId}_${Date.now()}`, clienteId, fecha, monto, concepto: `Canje de ${puntos} puntos del ${NOMBRE_CIRCULO}`, origen: 'club' });
  });
  return monto;
};

export const asignarRecomendacion = (clienteId: string, referidaPor: string) =>
  db.clientes.update(clienteId, { referidaPor: referidaPor || undefined });
