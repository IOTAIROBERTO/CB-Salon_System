// src/db/salon.ts
// Realm compartido "Salón" de Dexie Cloud: la dueña lo crea (o se crea solo
// la primera vez que entra con datos) e invita a las empleadas por email.
// Todos los datos del negocio viven ahí; el realm privado de cada cuenta
// queda vacío.
import { useLiveQuery, useObservable } from 'dexie-react-hooks';
import type { Table } from 'dexie';
import type { DBPermissionSet } from 'dexie-cloud-addon';
import { db } from './db';

export const NOMBRE_REALM = 'Salón';
export type RolSalon = 'duena' | 'empleada';
export const NOMBRE_ROL: Record<RolSalon, string> = { duena: 'Dueña', empleada: 'Empleada' };

// Permisos que el servidor aplica a cada rol. Los roles globales 'duena' y
// 'empleada' también están importados en Dexie Cloud (npx dexie-cloud import),
// pero el servidor no los aplicó en las pruebas; por eso se copian también
// al miembro, que sí se respeta. La empleada no puede tocar configuracion
// ni el equipo (members), ni el pago por hora y los días de apoyo (empleados,
// empleadoEvents: solo lectura); los consentimientos los agrega pero no los
// cambia ni los borra. Tarjetas de regalo y saldo a favor son dinero: solo la
// Dueña los escribe (Dexie Cloud no valida montos en el servidor).
const PERMISOS: Record<RolSalon, DBPermissionSet> = {
  duena: { manage: '*' },
  empleada: {
    manage: ['clientes', 'citas', 'ventas', 'servicios', 'inventario', 'gastos',
             'campanas', 'plantillas', 'automatizaciones', 'proveedores', 'compras'],
    add: ['consentimientos']
  }
};

/** Mi fila de miembro en el realm (por userId, o por email si aún no acepto) */
const miMembresia = (realmId: string) => {
  const { userId, email } = db.cloud.currentUser.value;
  return db.members.filter(m => m.realmId === realmId && (m.userId === userId || (!!email && m.email === email))).first();
};

const realmsSalon = async () =>
  (await db.realms.toArray())
    .filter(r => r.name === NOMBRE_REALM)
    .sort((a, b) => (a.realmId! < b.realmId! ? -1 : 1));

/** Realm del salón de esta cuenta: propio o con invitación ya aceptada */
// ponytail: si la dueña creó el realm en dos dispositivos sin conexión habrá
// dos; se usa el de id menor y el otro queda huérfano.
export const buscarRealmSalon = async () => {
  for (const r of await realmsSalon()) {
    if (r.owner === db.cloud.currentUserId || (await miMembresia(r.realmId!))?.accepted) return r;
  }
};

/** Invitación pendiente al salón. Dexie Cloud baja el realm y los miembros
 * antes de aceptar; los datos llegan después de aceptar. (db.cloud.invites
 * emite [] al suscribirse, por eso se consulta members directo.) */
export const buscarInvitacion = async () => {
  for (const r of await realmsSalon()) {
    const m = await miMembresia(r.realmId!);
    if (m && !m.accepted && !m.rejected) return m;
  }
};

export const aceptarInvitacion = async () => {
  const m = await buscarInvitacion();
  if (m) await db.members.update(m.id, { accepted: new Date() });
};

/** ¿El realm privado de esta cuenta tiene datos? (dueña antes de compartir) */
export const hayDatosPrivados = async () => {
  const yo = db.cloud.currentUserId;
  for (const t of [db.clientes, db.citas, db.ventas, db.servicios]) {
    if (await t.filter((o: any) => o.realmId === yo).count()) return true;
  }
  return false;
};

const tablasDelSalon = (): Table<any>[] =>
  [db.clientes, db.citas, db.ventas, db.servicios, db.inventario, db.gastos, db.configuracion,
   db.empleados, db.campanas, db.plantillas, db.automatizaciones, db.empleadoEvents,
   db.proveedores, db.compras, db.consentimientos, db.tarjetasRegalo, db.movimientosSaldo];

/** Crea el realm del salón (los datos privados los mueve moverPrivadosAlSalon) */
export const crearRealmSalon = () =>
  db.realms.add({ name: NOMBRE_REALM, represents: 'el salón' } as any);

/** Mueve al salón lo que haya quedado en el realm privado de esta cuenta.
 * Idempotente: la dueña lo corre en cada arranque, así también se recupera
 * si una sincronización rechazó el movimiento o se creó algo antes de
 * conocer el realm. */
export const moverPrivadosAlSalon = async (realmId: string) => {
  const yo = db.cloud.currentUserId;
  await db.transaction('rw', tablasDelSalon(), async () => {
    for (const t of tablasDelSalon()) {
      await t.filter((o: any) => o.realmId === yo).modify({ realmId });
    }
  });
};

/** Pone a cada miembro los permisos vigentes de su rol (la dueña lo corre en
 * cada arranque): así un cambio en PERMISOS también llega a quien ya estaba
 * invitado. ponytail: Dexie Cloud deja al dueño de cada objeto editarlo
 * siempre, así que una empleada aún podría borrar un consentimiento que ella
 * misma agregó; cerrarlo del todo pide guardarlos con owner de la dueña. */
export const alinearPermisos = async (realmId: string) => {
  const miembros = await db.members.filter(m => m.realmId === realmId).toArray();
  for (const m of miembros) {
    const rol: RolSalon = m.roles?.includes('duena') ? 'duena' : 'empleada';
    if (JSON.stringify(m.permissions) !== JSON.stringify(PERMISOS[rol])) await db.members.update(m.id!, { permissions: PERMISOS[rol] } as any);
  }
};

/** Invita por email; Dexie Cloud le manda el correo de invitación */
export const invitarAlSalon = async (realmId: string, email: string, rol: RolSalon) => {
  const limpio = email.trim().toLowerCase();
  const ya = await db.members.filter(m => m.realmId === realmId && m.email === limpio).first();
  if (ya) throw new Error('Ese correo ya está en el equipo');
  await db.members.add({ realmId, email: limpio, invite: true, roles: [rol], permissions: PERMISOS[rol] } as any);
};

export const cambiarRol = (memberId: string, rol: RolSalon) =>
  db.members.update(memberId, { roles: [rol], permissions: PERMISOS[rol] });

/** Rol de la cuenta actual en el realm dado */
export const rolEnSalon = async (realm: { realmId?: string; owner?: string }): Promise<RolSalon> => {
  if (realm.owner === db.cloud.currentUserId) return 'duena';
  const yo = await miMembresia(realm.realmId!);
  return yo?.roles?.includes('duena') ? 'duena' : 'empleada';
};

/** Rol de la cuenta actual en el salón; undefined mientras carga o sin salón */
export const useRolSalon = (): RolSalon | undefined => {
  const usuario = useObservable(db.cloud.currentUser);
  return useLiveQuery(async () => {
    if (!usuario?.isLoggedIn) return undefined;
    const realm = await buscarRealmSalon();
    return realm ? rolEnSalon(realm) : undefined;
  }, [usuario?.userId, usuario?.isLoggedIn]);
};
