import { useState, useEffect } from 'react';
import { Servicio, SERVICIOS_INICIALES } from '../types/catalogo';

const STORAGE_KEY = 'servicios';

export const useCatalogo = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);

  // Cargar servicios desde localStorage
  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        setServicios(JSON.parse(data));
      } catch (e) {
        console.error('Error parsing servicios:', e);
        initializeWithDefaultData();
      }
    } else {
      initializeWithDefaultData();
    }
  }, []);

  const initializeWithDefaultData = () => {
    setServicios(SERVICIOS_INICIALES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SERVICIOS_INICIALES));
  };

  const saveToStorage = (newServicios: Servicio[]) => {
    setServicios(newServicios);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newServicios));
  };

  const addServicio = (servicio: Servicio) => {
    const nuevosServicios = [...servicios, servicio];
    saveToStorage(nuevosServicios);
  };

  const updateServicio = (servicioId: string, updatedData: Partial<Servicio>) => {
    const nuevosServicios = servicios.map(s => 
      s.id === servicioId ? { ...s, ...updatedData } : s
    );
    saveToStorage(nuevosServicios);
  };

  const deleteServicio = (servicioId: string) => {
    const nuevosServicios = servicios.filter(s => s.id !== servicioId);
    saveToStorage(nuevosServicios);
  };

  return {
    servicios,
    addServicio,
    updateServicio,
    deleteServicio
  };
};