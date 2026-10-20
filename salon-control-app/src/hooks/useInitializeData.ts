import { useEffect, useState } from 'react';
import { db, usarRealmSalon } from '../db/db';
import { buscarRealmSalon, buscarInvitacion, hayDatosPrivados, crearRealmSalon, moverPrivadosAlSalon, rolEnSalon, alinearPermisos } from '../db/salon';
import { migrateLocalStorageToDexie } from '../utils/migrateData';
import serviciosData from '../data/servicios_dataset.json';
import { migrarDatosLocalesANube, hayBaseLocalAnterior } from '../utils/migrarANube';
import { ponerCatalogoAlDia, ponerDatosAlDia, servicioBase } from '../db/catalogo';

/** Resuelve cuando hay una sesión iniciada en Dexie Cloud */
const esperarSesion = () =>
  new Promise<void>(resolve => {
    const sub = db.cloud.currentUser.subscribe(usuario => {
      if (usuario.isLoggedIn) {
        setTimeout(() => sub.unsubscribe());
        resolve();
      }
    });
  });

/**
 * Rellena los campos que el sistema sí lee a partir de los nombres viejos
 * (`precio`) o del dataset original. No pisa valores ya presentes.
 */
export const repararServicio = (s: any, origen?: any) => ({
  ...s,
  precioSugerido: s.precioSugerido ?? s.precio ?? origen?.precio2027 ?? 0,
  anticipoSugerido: s.anticipoSugerido ?? origen?.anticipo2027 ?? 0,
  duracion: s.duracion ?? origen?.duracion ?? 60
});

/**
 * - 'sin-salon': la cuenta no pertenece a ningún salón ni tiene datos propios
 * - 'invitada': hay una invitación al salón por aceptar
 * - 'listo': realm del salón elegido; la app puede mostrarse
 */
export type EstadoSalon = 'cargando' | 'sin-salon' | 'invitada' | 'listo';

// Una sola preparación a la vez: StrictMode monta dos veces y crearía dos realms.
let enCurso: Promise<EstadoSalon> | null = null;
const preparar = () => (enCurso ??= prepararSalon().finally(() => { enCurso = null; }));

const prepararSalon = async (): Promise<EstadoSalon> => {
  // 0. Nube: esperar sesión y bajar lo que ya exista antes de migrar o
  // sembrar; si no, cada dispositivo nuevo subiría datos de ejemplo.
  await esperarSesion();
  await db.cloud.sync({ wait: true, purpose: 'pull' });

  // 1. Realm compartido: el que ya existe, o se crea si esta cuenta trae
  // datos (la dueña, primera vez tras esta versión). Una cuenta vacía no
  // crea nada sola: puede ser una empleada aún sin invitación.
  const realm = await buscarRealmSalon();
  let realmId = realm?.realmId;
  if (!realmId) {
    if (await buscarInvitacion()) return 'invitada';
    if (!(await hayDatosPrivados()) && !(await hayBaseLocalAnterior())) return 'sin-salon';
    realmId = await crearRealmSalon();
  }
  usarRealmSalon(realmId);

  // Mover, migrar y sembrar solo la dueña: la empleada recibe todo por sync.
  if (realm && (await rolEnSalon(realm)) !== 'duena') return 'listo';
  await moverPrivadosAlSalon(realmId);
  await alinearPermisos(realmId);
  await initDB();
  return 'listo';
};

export const useInitializeData = () => {
  const [estado, setEstado] = useState<EstadoSalon>('cargando');
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    preparar()
      .then(setEstado)
      .catch(e => console.error('Error al inicializar datos:', e));
  }, [intento]);
  return { estado, reintentar: () => { setEstado('cargando'); setIntento(i => i + 1); } };
};

const initDB = async () => {
  const copiados = await migrarDatosLocalesANube();
  if (copiados > 0) console.log(`Migración a la nube: ${copiados} registros copiados`);

  // 1. Run Migration if needed
  await migrateLocalStorageToDexie();

  // 2. Seed Initial Data (only if DB is empty after migration)

  // Servicios: catálogo base con la lista activa (2027) en una cuenta nueva;
  // en una existente, reparación de precios viejos y puesta al día de octubre 2026.
  const servicesCount = await db.servicios.count();
  if (servicesCount === 0) {
    await db.servicios.bulkPut(serviciosData.map(servicioBase) as any);
  } else {
    // Reparación: versiones anteriores sembraron el precio en `precio`, un
    // campo que nadie lee, dejando el catálogo en $0. Se rellena una sola
    // vez y sin tocar los servicios que ya tengan precio.
    const sinPrecio = await db.servicios
      .filter((s: any) => s.precioSugerido === undefined)
      .toArray();

    if (sinPrecio.length > 0) {
      const dataset: any[] = serviciosData;
      await db.servicios.bulkPut(
        sinPrecio.map((s: any) => repararServicio(s, dataset.find(d => d.id === s.id)))
      );
      console.log(`Catálogo reparado: ${sinPrecio.length} servicios sin precioSugerido`);
    }
  }
  if (await ponerCatalogoAlDia()) console.log('Catálogo al día: lista 2027 activa, uñas archivadas');
  await ponerDatosAlDia();

  // Sin clientas ni productos de ejemplo: en una cuenta nueva aparecían
  // registros falsos (Ana López, L'Oreal…) mezclados con los reales.
};
