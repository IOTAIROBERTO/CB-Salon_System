import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { AGENDA_INICIAL, DUENA, type Bloqueo, type ConfigAgenda, type Persona } from '../utils/agenda';

/**
 * Agenda del salón: la configuración guardada (o la inicial), quién atiende
 * (Cristina y las colaboradoras con «Toma citas») y los bloqueos, sumando las
 * vacaciones y días inhábiles capturados en Empleados.
 */
export const useAgenda = () => {
  // null = ya cargó pero aún no hay configuración guardada (undefined = cargando)
  const settings = useLiveQuery(() => db.configuracion.get('settings').then(s => s ?? null));
  const empleados = useLiveQuery(() => db.empleados.toArray()) || [];
  const eventos = useLiveQuery(() => db.empleadoEvents.toArray()) || [];

  const guardada: ConfigAgenda = { ...AGENDA_INICIAL, ...(settings?.agenda || {}) };
  const deEmpleados: Bloqueo[] = eventos
    .filter(e => e.tipo === 'vacaciones' || e.tipo === 'dia_inhabit')
    .map(e => ({ id: `ev_${e.id}`, personaId: e.empleadoId, desde: e.fechaInicio, hasta: e.fechaFin,
      motivo: e.tipo === 'vacaciones' ? 'Vacaciones' : 'Día inhábil' }));
  const config: ConfigAgenda = { ...guardada, bloqueos: [...guardada.bloqueos, ...deEmpleados] };

  const personas: Persona[] = [
    { id: DUENA, nombre: 'Cristina' },
    ...empleados.filter(e => e.activo && e.tomaCitas)
      .map(e => ({ id: e.id, nombre: e.nombre, categorias: e.categoriasAgenda }))
  ];

  return { config, guardada, personas, empleados, cargando: settings === undefined };
};

export const guardarAgenda = async (agenda: ConfigAgenda) => {
  const s = await db.configuracion.get('settings');
  await db.configuracion.put({ ...(s as any), id: 'settings', agenda });
};

export const nombrePersona = (personas: Persona[], id?: string) =>
  personas.find(p => p.id === (id || DUENA))?.nombre || 'Cristina';
