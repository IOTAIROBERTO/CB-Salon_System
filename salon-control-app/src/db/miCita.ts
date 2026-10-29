// «Mi cita» de la clienta (app de clientas, #/cita/<id>.<secreto>): ve su cita, la cambia o la cancela sola con la
// política de 48 h (app-clientas/api/salon.ts). El secreto vive en la cita: la API lo pone al apartar desde la app y
// aquí se crea al mandar la nota de reserva o la valoración. También: «no llegó» y cuántas veces faltó cada clienta.
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { URL_APP } from './firma';

export const urlMiCita = (citaId: string, secreto: string) => `${URL_APP}/#/cita/${citaId}.${secreto}`;

/** Enlace de la cita para la clienta (le crea su secreto si aún no tiene) */
export async function enlaceMiCita(cita: { id: string; enlace?: string }) {
  let secreto = cita.enlace;
  if (!secreto) {
    secreto = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    await db.citas.update(cita.id, { enlace: secreto });
  }
  return urlMiCita(cita.id, secreto);
}

/** No llegó: la cita deja de ocupar la agenda y el anticipo pagado se queda como anticipo perdido (cuenta como ingreso) */
export const marcarNoLlego = (c: { id: string; anticipoConfirmado?: boolean; montoAnticipo?: number }) =>
  db.citas.update(c.id, { estado: 'no_llego', ...(c.anticipoConfirmado && c.montoAnticipo ? { anticipoPerdido: c.montoAnticipo } : {}) });

/** Cuántas citas no llegó la clienta (para pedirle anticipo la próxima vez) */
export const useFaltas = (clienteId?: string) =>
  useLiveQuery(() => clienteId ? db.citas.where('clienteId').equals(clienteId).filter(c => c.estado === 'no_llego').count() : 0, [clienteId]) || 0;
