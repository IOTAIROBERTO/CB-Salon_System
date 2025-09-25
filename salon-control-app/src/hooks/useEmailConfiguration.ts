// src/hooks/useEmailConfiguration.ts
import { useState, useCallback } from 'react';
import { emailMarketingService } from '../services/emailMarketingService';

interface SalonInfo {
  nombre: string;
  telefono: string;
  direccion: string;
  email: string;
}

export const useEmailConfiguration = () => {
  const [salonInfo, setSalonInfo] = useState<SalonInfo>(() => {
    const saved = localStorage.getItem('salonInfo');
    return saved ? JSON.parse(saved) : {
      nombre: 'Cristina Borquez Beauty Salon',
      telefono: '+52 1 662 341 9038',
      direccion: 'Saturnino Campoy y República de Panamá 83170 Hermosillo, Mexico',
      email: 'cristinaeborquez@gmail.com'
    };
  });

  const updateSalonInfo = useCallback((newInfo: Partial<SalonInfo>) => {
    const updated = { ...salonInfo, ...newInfo };
    setSalonInfo(updated);
    emailMarketingService.updateSalonInfo(updated);
  }, [salonInfo]);

  const configureEmailJS = useCallback((config: { serviceId: string; templateId: string; publicKey: string }) => {
    emailMarketingService.configureProvider('emailjs', config);
  }, []);

  const configureResend = useCallback((config: { apiKey: string; from: string }) => {
    emailMarketingService.configureProvider('resend', config);
  }, []);

  const testConfiguration = useCallback(async (provider: string) => {
    try {
      // Simular prueba de configuración
      console.log(`Testing ${provider} configuration`);
      
      // Aquí podrías implementar una prueba real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return Math.random() > 0.3; // Simular éxito la mayoría de las veces
    } catch (error) {
      console.error(`Error testing ${provider}:`, error);
      return false;
    }
  }, []);

  const getProviderStatus = useCallback(() => {
    return emailMarketingService.getProviderStatus();
  }, []);

  return {
    salonInfo,
    updateSalonInfo,
    configureEmailJS,
    configureResend,
    testConfiguration,
    getProviderStatus
  };
};