// src/hooks/useEmailTemplates.ts
import { useState, useCallback } from 'react';
import { EmailTemplate, CampaignType } from '../types/email';
import { emailMarketingService } from '../services/emailMarketingService';
import { Cliente } from '../types/clientes';

export const useEmailTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState<{ html: string; texto: string } | null>(null);

  const getTemplate = useCallback((tipo: CampaignType) => {
    return emailMarketingService.getTemplate(tipo);
  }, []);

  const getAllTemplates = useCallback(() => {
    return emailMarketingService.getAllTemplates();
  }, []);

  const generatePreview = useCallback((tipo: CampaignType, clienteEjemplo?: Cliente) => {
    try {
      const preview = emailMarketingService.getEmailPreview(tipo, clienteEjemplo);
      setPreviewContent(preview);
      return preview;
    } catch (error) {
      console.error('Error generando preview:', error);
      return null;
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewContent(null);
  }, []);

  return {
    selectedTemplate,
    setSelectedTemplate,
    previewContent,
    getTemplate,
    getAllTemplates,
    generatePreview,
    clearPreview
  };
};