// src/utils/migrarANube.ts
// Copia una sola vez los datos de la base local anterior ('BeautySalonDB')
// a la base sincronizada con Dexie Cloud. La base anterior no se borra:
// queda como respaldo en este navegador.
import Dexie from 'dexie';
import { db } from '../db/db';

const BASE_ANTERIOR = 'BeautySalonDB';
const BANDERA = 'nube_migracion_hecha';

// Tablas cuya clave era autoincremental (++id) y ahora es '@id' en la nube:
// se descarta el id numérico para que Dexie Cloud genere uno nuevo.
const SIN_ID = new Set(['gastos', 'empleadoEvents']);

/** ¿La nube ya tiene datos del salón? (otro dispositivo ya migró) */
const nubeTieneDatos = async () =>
  (await db.clientes.count()) + (await db.citas.count()) +
  (await db.ventas.count()) + (await db.servicios.count()) > 0;

/**
 * Debe llamarse con la sesión iniciada y después de la primera sincronización,
 * para saber si la nube ya tiene datos.
 * @returns cuántos registros se copiaron (0 si no hubo nada que migrar)
 */
export const migrarDatosLocalesANube = async (): Promise<number> => {
  if (localStorage.getItem(BANDERA)) return 0;
  if (!(await Dexie.exists(BASE_ANTERIOR))) {
    localStorage.setItem(BANDERA, 'sin-datos');
    return 0;
  }
  if (await nubeTieneDatos()) {
    // Ya hay datos en la nube (vinieron de otro dispositivo): no se mezclan.
    console.warn('La nube ya tiene datos; la base local anterior se conserva sin copiar.');
    localStorage.setItem(BANDERA, 'nube-con-datos');
    return 0;
  }

  // Sin versión declarada, Dexie abre la base con el esquema que ya tenga
  // Primero se lee todo: leer otra base dentro de la transacción la cerraría
  const anterior = new Dexie(BASE_ANTERIOR);
  await anterior.open();
  const datos: Record<string, any[]> = {};
  try {
    for (const tabla of anterior.tables) datos[tabla.name] = await tabla.toArray();
  } finally {
    anterior.close();
  }

  let copiados = 0;
  await db.transaction('rw', db.tables.filter(t => datos[t.name]?.length), async () => {
    for (const destino of db.tables) {
      const filas = datos[destino.name];
      if (!filas?.length) continue;
      const limpias = SIN_ID.has(destino.name)
        ? filas.map(({ id, ...resto }) => resto)
        : filas;
      await destino.bulkPut(limpias);
      copiados += filas.length;
    }
  });

  localStorage.setItem(BANDERA, new Date().toISOString());
  return copiados;
};
