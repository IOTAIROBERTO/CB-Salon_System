import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { type Servicio } from '../types/catalogo';
import { confirmar } from '../components/Confirmar';

export const useCatalogo = () => {
  // Cargar servicios desde Dexie en tiempo real
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];

  const addServicio = async (servicio: Servicio) => {
    await db.servicios.add(servicio);
  };

  const updateServicio = async (servicioId: string, updatedData: Partial<Servicio>) => {
    await db.servicios.update(servicioId, updatedData);
  };

  // Con citas no se borra: se quedarían sin nombre ni precio, y una futura se cobraría en $0. Se archiva
  const deleteServicio = async (servicioId: string) => {
    const usadas = await db.citas.filter(c => c.servicioId === servicioId).count();
    if (usadas) {
      if (await confirmar(`Este servicio tiene ${usadas} cita${usadas === 1 ? '' : 's'}, así que no se puede eliminar. ¿Archivarlo? Deja de ofrecerse y sus citas lo conservan.`, { si: 'Archivar' }))
        await db.servicios.update(servicioId, { archivado: true });
      return;
    }
    if (await confirmar('¿Eliminar servicio? Esta acción no se puede deshacer.')) await db.servicios.delete(servicioId);
  };

  return {
    servicios,
    addServicio,
    updateServicio,
    deleteServicio
  };
};