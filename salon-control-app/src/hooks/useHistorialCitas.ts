import { useState, useMemo } from 'react';
import { Cita, FiltroHistorial } from '../types/reportes';

export const useHistorialCitas = (citas: Cita[]) => {
  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorial>('todas');
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  // Filtrar y ordenar citas para el historial
  const citasHistorial = useMemo(() => {
    return citas.filter(cita => {
      const esCompletadaOCancelada = ['completada', 'cancelada'].includes(cita.estado);
      if (filtroHistorial === 'completadas') return cita.estado === 'completada';
      if (filtroHistorial === 'canceladas') return cita.estado === 'cancelada';
      return esCompletadaOCancelada; // 'todas'
    }).sort((a, b) => 
      new Date(b.fechaCompletada || b.fecha).getTime() - 
      new Date(a.fechaCompletada || a.fecha).getTime()
    );
  }, [citas, filtroHistorial]);

  return {
    filtroHistorial,
    setFiltroHistorial,
    citaSeleccionada,
    setCitaSeleccionada,
    citasHistorial
  };
};