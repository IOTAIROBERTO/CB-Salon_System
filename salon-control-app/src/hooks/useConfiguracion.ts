// src/hooks/useConfiguracion.ts
import { useState, useEffect, useCallback } from 'react';

export interface ConfiguracionEmpresa {
  nombre: string;
  telefono: string;
  direccion: string;
  email: string;
  logo: string | null;
  horarios: {
    [key: string]: {
      abierto: boolean;
      inicio: string;
      fin: string;
    };
  };
}

const CONFIGURACION_DEFAULT: ConfiguracionEmpresa = {
  nombre: 'Beauty Salon Total Control',
  telefono: '+52 55 1234-5678',
  direccion: 'Calle Principal 123, Col. Centro',
  email: 'contacto@beautysalon.com',
  logo: null,
  horarios: {
    lunes: { abierto: true, inicio: '09:00', fin: '18:00' },
    martes: { abierto: true, inicio: '09:00', fin: '18:00' },
    miercoles: { abierto: true, inicio: '09:00', fin: '18:00' },
    jueves: { abierto: true, inicio: '09:00', fin: '18:00' },
    viernes: { abierto: true, inicio: '09:00', fin: '18:00' },
    sabado: { abierto: true, inicio: '09:00', fin: '17:00' },
    domingo: { abierto: false, inicio: '10:00', fin: '16:00' }
  }
};

const STORAGE_KEY = 'configuracion_empresa';

export const useConfiguracion = () => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>(CONFIGURACION_DEFAULT);
  const [loading, setLoading] = useState(true);

  // Cargar configuración desde localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Mergear con configuración por defecto para asegurar que no falten campos
        setConfiguracion({ ...CONFIGURACION_DEFAULT, ...parsedConfig });
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar configuración
  const guardarConfiguracion = useCallback(async (nuevaConfig: ConfiguracionEmpresa): Promise<boolean> => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaConfig));
      setConfiguracion(nuevaConfig);
      
      // Disparar evento personalizado para notificar cambios a otros componentes
      window.dispatchEvent(new CustomEvent('configuracion-updated', { 
        detail: nuevaConfig 
      }));
      
      return true;
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      return false;
    }
  }, []);

  // Actualizar campo específico
  const actualizarCampo = useCallback((campo: keyof ConfiguracionEmpresa, valor: any) => {
    setConfiguracion(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // Actualizar horario específico
  const actualizarHorario = useCallback((dia: string, campo: string, valor: any) => {
    setConfiguracion(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia],
          [campo]: valor
        }
      }
    }));
  }, []);

  // Obtener configuración actual
  const getConfiguracion = useCallback(() => configuracion, [configuracion]);

  // Verificar si el salón está abierto en un día específico
  const estaAbierto = useCallback((dia?: string) => {
    const diaActual = dia || new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const horario = configuracion.horarios[diaActual];
    return horario?.abierto || false;
  }, [configuracion.horarios]);

  // Obtener horario de un día específico
  const getHorario = useCallback((dia?: string) => {
    const diaActual = dia || new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    return configuracion.horarios[diaActual] || { abierto: false, inicio: '09:00', fin: '18:00' };
  }, [configuracion.horarios]);

  // Resetear a configuración por defecto
  const resetearConfiguracion = useCallback(async (): Promise<boolean> => {
    return await guardarConfiguracion(CONFIGURACION_DEFAULT);
  }, [guardarConfiguracion]);

  return {
    configuracion,
    loading,
    guardarConfiguracion,
    actualizarCampo,
    actualizarHorario,
    getConfiguracion,
    estaAbierto,
    getHorario,
    resetearConfiguracion
  };
};