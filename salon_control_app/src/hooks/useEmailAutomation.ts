// src/hooks/useEmailAutomation.ts
import { useEffect, useCallback } from 'react';
import { emailMarketingService } from '../services/emailMarketingService';

export const useEmailAutomation = () => {
  // Verificar y programar campañas automáticas
  useEffect(() => {
    const checkAutomaticCampaigns = () => {
      console.log('Email automation initialized');
      
      const now = new Date();
      const hour = now.getHours();
      
      // Ejecutar verificaciones a las 8:00 AM
      if (hour === 8) {
        console.log('Checking for birthday campaigns...');
        createBirthdayCampaigns().catch(console.error);
      }
      
      // Verificar campañas estacionales
      checkSeasonalCampaigns();
    };

    // Verificar inmediatamente y luego cada hora
    checkAutomaticCampaigns();
    const interval = setInterval(checkAutomaticCampaigns, 60 * 60 * 1000); // 1 hora

    return () => clearInterval(interval);
  }, []);

  const createBirthdayCampaigns = useCallback(async () => {
    try {
      const campaign = await emailMarketingService.createBirthdayCampaigns();
      return campaign;
    } catch (error) {
      console.error('Error creating birthday campaigns:', error);
      throw error;
    }
  }, []);

  const checkSeasonalCampaigns = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // San Valentín (14 de febrero) - enviar 3 días antes
    if (currentMonth === 2 && currentDay === 11) {
      scheduleSeasonalCampaign('san_valentin', 20, 15);
    }

    // Día de la Madre (10 de mayo en México) - enviar 5 días antes
    if (currentMonth === 5 && currentDay === 5) {
      scheduleSeasonalCampaign('dia_madre', 25, 10);
    }

    // Navidad (25 de diciembre) - enviar 7 días antes
    if (currentMonth === 12 && currentDay === 18) {
      scheduleSeasonalCampaign('navidad', 30, 15);
    }
  }, []);

  const scheduleSeasonalCampaign = useCallback(async (tipo: any, descuento: number, validityDays: number) => {
    try {
      const clientes = JSON.parse(localStorage.getItem('clientes') || '[]')
        .filter((c: any) => c.activo && c.email);
      
      const config = {
        programarEnvio: false,
        enviarSoloActivos: true,
        incluirDescuentos: true,
        porcentajeDescuento: descuento,
        validezDescuento: getValidityDate(validityDays),
        personalizarPorCliente: true
      };

      return await emailMarketingService.createCampaign(tipo, config, clientes);
    } catch (error) {
      console.error('Error creating seasonal campaign:', error);
      throw error;
    }
  }, []);

  const getValidityDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('es-ES');
  };

  return {
    createBirthdayCampaigns,
    scheduleSeasonalCampaign
  };
};