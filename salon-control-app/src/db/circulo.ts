// Escrituras del Círculo CB: los canjes y la recomendación viven en la clienta,
// así sincronizan con Dexie Cloud sin tabla nueva.
import { db } from './db';
import type { ClaveBeneficio } from '../utils/lealtad';

export const registrarCanjes = async (clienteId: string, claves: ClaveBeneficio[], citaId?: string) => {
  if (!claves.length) return;
  const cliente = await db.clientes.get(clienteId);
  if (!cliente) return;
  const fecha = new Date().toISOString();
  await db.clientes.update(clienteId, {
    canjes: [...(cliente.canjes || []), ...claves.map(clave => ({ clave, fecha, citaId }))]
  });
};

export const asignarRecomendacion = (clienteId: string, referidaPor: string) =>
  db.clientes.update(clienteId, { referidaPor: referidaPor || undefined });
