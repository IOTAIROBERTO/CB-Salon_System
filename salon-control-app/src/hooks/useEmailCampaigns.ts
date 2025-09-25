// src/hooks/useEmailCampaigns.ts
import { useState, useEffect } from 'react';
import { EmailCampaign, CampaignType } from '../types/email';
import { emailMarketingService } from '../services/emailMarketingService';
import { Cliente } from '../types/clientes';

export const useEmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = () => {
    setCampaigns(emailMarketingService.getCampaigns());
  };

  const createCampaign = async (
    tipo: CampaignType,
    config: any,
    clientes: Cliente[],
    customSubject?: string,
    customContent?: string
  ) => {
    setIsLoading(true);
    try {
      const campaign = await emailMarketingService.createCampaign(
        tipo,
        config,
        clientes,
        customSubject,
        customContent
      );
      loadCampaigns();
      return campaign;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelCampaign = (campaignId: string) => {
    const success = emailMarketingService.cancelCampaign(campaignId);
    if (success) {
      loadCampaigns();
    }
    return success;
  };

  const getStats = () => {
    return emailMarketingService.getGeneralStats();
  };

  const getProviderStatus = () => {
    return emailMarketingService.getProviderStatus();
  };

  return {
    campaigns,
    isLoading,
    createCampaign,
    cancelCampaign,
    getStats,
    getProviderStatus,
    refreshCampaigns: loadCampaigns
  };
};