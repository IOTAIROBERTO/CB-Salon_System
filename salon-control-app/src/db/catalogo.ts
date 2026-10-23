// Escrituras del catálogo: listas de precios por año y la puesta al día de
// octubre 2026 (lista 2027 activa, uñas fuera, tiempos de agenda sugeridos).
import { db } from './db';
import dataset from '../data/servicios_dataset.json';
import historicas from '../data/listas_historicas.json';
import { abrirLista, type ListasPrecios } from '../utils/precios';
import { DATOS_SALON } from '../data/datosSalon';

// Uñas lo atiende una subarrendataria; «Anticipo (histórico)» y «Otro» eran de relleno.
export const ARCHIVADOS = ['s27', 's28', 's98', 's99'];

const LISTAS_INICIALES: ListasPrecios = {
  activa: '2027',
  historicas: [
    { anio: '2026', cerrada: '2026-10-16T00:00:00.000Z', ...historicas['2026'] },
    { anio: '2025', cerrada: '2026-01-01T00:00:00.000Z', ...historicas['2025'] }
  ]
};

const leerSettings = async () => (await db.configuracion.get('settings')) as any;
const guardarSettings = async (cambios: Record<string, unknown>) =>
  db.configuracion.put({ ...(await leerSettings()), id: 'settings', ...cambios });

/** Servicio del dataset con los precios de la lista activa (2027) */
export const servicioBase = (s: any) => ({
  id: s.id,
  nombre: s.nombre,
  categoria: s.categoria,
  duracion: s.duracion,
  tiempoProceso: s.tiempoProceso,
  tiempoCierre: s.tiempoCierre,
  descripcion: s.descripcion || undefined,
  precioSugerido: s.precio2027,
  anticipoSugerido: s.anticipo2027 ?? 0
});

/**
 * Una sola vez (la marca es settings.listasPrecios): deja activa la lista 2027,
 * agrega los servicios nuevos del catálogo base, archiva uñas y los de relleno,
 * y rellena los tiempos de agenda sugeridos donde no haya uno capturado.
 */
export const ponerCatalogoAlDia = async () => {
  const settings = await leerSettings();
  if (settings?.listasPrecios) return false;
  const actuales = new Map((await db.servicios.toArray()).map(s => [s.id, s as any]));
  const cambios: any[] = [];
  for (const base of dataset as any[]) {
    const a = actuales.get(base.id);
    if (!a) { cambios.push(servicioBase(base)); continue; }
    cambios.push({
      ...a,
      precioSugerido: a.precio2027 ?? base.precio2027 ?? a.precioSugerido,
      anticipoSugerido: a.anticipo2027 ?? base.anticipo2027 ?? a.anticipoSugerido,
      tiempoProceso: a.tiempoProceso ?? base.tiempoProceso,
      tiempoCierre: a.tiempoCierre ?? base.tiempoCierre
    });
  }
  for (const id of ARCHIVADOS) {
    const a = actuales.get(id);
    if (a && !a.archivado) cambios.push({ ...a, archivado: true });
  }
  await db.transaction('rw', db.servicios, db.configuracion, async () => {
    if (cambios.length) await db.servicios.bulkPut(cambios);
    await guardarSettings({ listasPrecios: LISTAS_INICIALES });
  });
  return true;
};

/** Nombre sin acento y dirección con entre calles en lo ya guardado (respuestas de octubre 2026) */
export const ponerDatosAlDia = async () => {
  const s = await leerSettings();
  if (!s) return;
  const cambios: Record<string, string> = {};
  const nombre = s.nombreSalon?.normalize('NFC');
  if (nombre?.includes('Bórquez')) cambios.nombreSalon = nombre.replace('Bórquez', 'Borquez');
  if (s.direccion && !s.direccion.includes('entre') && s.direccion.includes('Saturnino Campoy')) cambios.direccion = DATOS_SALON.direccion;
  if (Object.keys(cambios).length) await guardarSettings(cambios);
  // Octubre 2026: «Mascarilla en cabina» se llama «Mascarilla para el cabello» (más claro para las clientas)
  const viejo = 'Mascarilla en cabina', nuevo = 'Mascarilla para el cabello';
  const s06 = await db.servicios.get('s06') as any;
  if (s06?.nombre === viejo) await db.servicios.update('s06', { nombre: nuevo } as any);
  const listas = s.listasPrecios;
  if (listas && JSON.stringify(listas).includes(viejo)) await guardarSettings({ listasPrecios: JSON.parse(JSON.stringify(listas).split(viejo).join(nuevo)) });
};

/** Agrega del catálogo base los servicios que falten, sin tocar precios capturados */
export const agregarFaltantes = async () => {
  const ids = new Set(await db.servicios.toCollection().primaryKeys());
  const nuevos = (dataset as any[]).filter(s => !ids.has(s.id)).map(servicioBase);
  if (nuevos.length) await db.servicios.bulkPut(nuevos as any);
  return nuevos.length;
};

export const listasDe = (settings: any): ListasPrecios => settings?.listasPrecios ?? LISTAS_INICIALES;

/** Guarda la lista activa como histórica y abre la del año indicado */
export const abrirNuevaLista = async (nuevoAnio: string) => {
  const servicios = await db.servicios.toArray();
  await guardarSettings({ listasPrecios: abrirLista(listasDe(await leerSettings()), servicios as any, nuevoAnio) });
};
