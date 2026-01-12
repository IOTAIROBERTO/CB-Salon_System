import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Servicio } from '../types/catalogo';

export const useCatalogo = () => {
  // Cargar servicios desde Dexie en tiempo real
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];

  const addServicio = async (servicio: Servicio) => {
    await db.servicios.add(servicio);
  };

  const updateServicio = async (servicioId: string, updatedData: Partial<Servicio>) => {
    await db.servicios.update(servicioId, updatedData);
  };

  const deleteServicio = async (servicioId: string) => {
    await db.servicios.delete(servicioId);
  };

  return {
    servicios,
    addServicio,
    updateServicio,
    deleteServicio
  };
};