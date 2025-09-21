// src/hooks/useConfiguracion.ts
import { useState, useEffect } from 'react';
import { ConfiguracionEmpresa, CONFIGURACION_DEFAULT } from '../types/config';

const STORAGE_KEY = 'configuracion_empresa';

export const useConfiguracion = () => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>(CONFIGURACION_DEFAULT);

  useEffect(() => {
    const configGuardada = localStorage.getItem(STORAGE_KEY);
    if (configGuardada) {
      try {
        const config = JSON.parse(configGuardada);
        setConfiguracion({ ...CONFIGURACION_DEFAULT, ...config });
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    }
  }, []);

  const guardarConfiguracion = (nuevaConfig: ConfiguracionEmpresa) => {
    setConfiguracion(nuevaConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaConfig));
  };

  const actualizarNombre = (nombre: string) => {
    const nuevaConfig = { ...configuracion, nombre };
    guardarConfiguracion(nuevaConfig);
  };

  const actualizarColores = (colores: ConfiguracionEmpresa['colores']) => {
    const nuevaConfig = { ...configuracion, colores };
    guardarConfiguracion(nuevaConfig);
  };

  const actualizarLogo = (logo: string) => {
    const nuevaConfig = { ...configuracion, logo };
    guardarConfiguracion(nuevaConfig);
  };

  const actualizarEmail = (email: ConfiguracionEmpresa['email']) => {
    const nuevaConfig = { ...configuracion, email };
    guardarConfiguracion(nuevaConfig);
  };

  return {
    configuracion,
    actualizarNombre,
    actualizarColores,
    actualizarLogo,
    actualizarEmail,
    guardarConfiguracion
  };
};