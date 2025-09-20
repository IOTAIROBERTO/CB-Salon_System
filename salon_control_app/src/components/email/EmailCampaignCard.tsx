// src/components/email/EmailCampaignCard.tsx
import React from 'react';
import { 
  Mail, 
  Calendar, 
  Users, 
  Eye, 
  Play, 
  Pause, 
  Trash2,
  Gift,
  Heart,
  TreePine,
  Sparkles
} from 'lucide-react';
import { EmailCampaign, CampaignType } from '../../types/email';

interface EmailCampaignCardProps {
  campaign: EmailCampaign;
  onPreview: () => void;
  onCancel: () => void;
  onViewStats: () => void;
}

export const EmailCampaignCard: React.FC<EmailCampaignCardProps> = ({
  campaign,
  onPreview,
  onCancel,
  onViewStats
}) => {
  const getCampaignIcon = (tipo: CampaignType) => {
    switch (tipo) {
      case 'cumpleanos': return <Gift className="text-pink-600" size={20} />;
      case 'san_valentin': return <Heart className="text-red-600" size={20} />;
      case 'navidad': return <TreePine className="text-green-600" size={20} />;
      case 'promocion_general': return <Sparkles className="text-purple-600" size={20} />;
      default: return <Mail className="text-blue-600" size={20} />;
    }
  };

  const getStatusColor = (estado: EmailCampaign['estado']) => {
    switch (estado) {
      case 'borrador': return 'bg-gray-100 text-gray-800';
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'enviada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getCampaignIcon(campaign.tipo)}
          <div>
            <h3 className="font-semibold text-gray-900">{campaign.nombre}</h3>
            <p className="text-sm text-gray-600">
              {campaign.destinatarios.length} destinatarios
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.estado)}`}>
          {campaign.estado.charAt(0).toUpperCase() + campaign.estado.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>Creada: {formatDate(campaign.fechaCreacion)}</span>
        </div>
        {campaign.fechaEnvio && (
          <div className="flex items-center gap-2">
            <Play size={14} />
            <span>Enviada: {formatDate(campaign.fechaEnvio)}</span>
          </div>
        )}
      </div>

      {campaign.estadisticas && campaign.estado === 'enviada' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {campaign.estadisticas.totalEnviados}
            </div>
            <div className="text-xs text-gray-600">Enviados</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {campaign.estadisticas.totalFallidos}
            </div>
            <div className="text-xs text-gray-600">Fallidos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {campaign.estadisticas.totalAbiertos}
            </div>
            <div className="text-xs text-gray-600">Abiertos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {campaign.estadisticas.tasaApertura.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Apertura</div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-3 border-t">
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
          >
            <Eye size={14} />
            Preview
          </button>
          {campaign.estado === 'enviada' && (
            <button
              onClick={onViewStats}
              className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
            >
              <BarChart3 size={14} />
              Stats
            </button>
          )}
        </div>
        
        <div className="flex gap-1">
          {campaign.estado === 'programada' && (
            <button
              onClick={onCancel}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Cancelar campaña"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// src/components/email/EmailTemplatePreview.tsx
import React from 'react';
import { X, Mail, Smartphone } from 'lucide-react';

interface EmailTemplatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  textContent: string;
  subject: string;
}

export const EmailTemplatePreview: React.FC<EmailTemplatePreviewProps> = ({
  isOpen,
  onClose,
  htmlContent,
  textContent,
  subject
}) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile' | 'text'>('desktop');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Vista Previa del Email</h2>
            <p className="text-sm text-gray-600 mt-1">Asunto: {subject}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  viewMode === 'desktop' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail size={16} />
                Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  viewMode === 'mobile' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone size={16} />
                Mobile
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  viewMode === 'text' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Texto
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {viewMode === 'text' ? (
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {textContent}
            </div>
          ) : (
            <div className={`mx-auto bg-white ${
              viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
            }`}>
              <div 
                className="email-preview"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{
                  transform: viewMode === 'mobile' ? 'scale(0.8)' : 'scale(1)',
                  transformOrigin: 'top center'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// src/components/email/CampaignStatsModal.tsx
import React from 'react';
import { X, Mail, CheckCircle, XCircle, Eye, MousePointer } from 'lucide-react';
import { EmailCampaign } from '../../types/email';

interface CampaignStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: EmailCampaign | null;
}

export const CampaignStatsModal: React.FC<CampaignStatsModalProps> = ({
  isOpen,
  onClose,
  campaign
}) => {
  if (!isOpen || !campaign || !campaign.estadisticas) return null;

  const stats = campaign.estadisticas;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Estadísticas de Campaña
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{campaign.nombre}</h3>
            <p className="text-sm text-gray-600">
              Enviada el {campaign.fechaEnvio ? new Date(campaign.fechaEnvio).toLocaleDateString('es-ES') : 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Mail size={24} className="mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{stats.totalEnviados}</div>
              <div className="text-sm text-gray-600">Enviados</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <XCircle size={24} className="mx-auto text-red-600 mb-2" />
              <div className="text-2xl font-bold text-red-600">{stats.totalFallidos}</div>
              <div className="text-sm text-gray-600">Fallidos</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <Eye size={24} className="mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{stats.totalAbiertos}</div>
              <div className="text-sm text-gray-600">Abiertos</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <MousePointer size={24} className="mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">{stats.totalClicks}</div>
              <div className="text-sm text-gray-600">Clicks</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tasa de Apertura</div>
              <div className="text-2xl font-bold text-gray-900">{stats.tasaApertura.toFixed(1)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(stats.tasaApertura, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tasa de Clicks</div>
              <div className="text-2xl font-bold text-gray-900">{stats.tasaClicks.toFixed(1)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min(stats.tasaClicks, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Detalles de Destinatarios</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {campaign.destinatarios.map((destinatario, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{destinatario.nombre}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    destinatario.estado === 'enviado' ? 'bg-green-100 text-green-800' :
                    destinatario.estado === 'fallido' ? 'bg-red-100 text-red-800' :
                    destinatario.estado === 'abierto' ? 'bg-blue-100 text-blue-800' :
                    destinatario.estado === 'clickeado' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {destinatario.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// src/components/email/EmailProviderConfig.tsx
import React, { useState } from 'react';
import { Save, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface EmailProviderConfigProps {
  onSaveEmailJS: (config: { serviceId: string; templateId: string; publicKey: string }) => void;
  onSaveResend: (config: { apiKey: string; from: string }) => void;
  onTestProvider: (provider: string) => Promise<boolean>;
  providerStatus: {
    emailjs: boolean;
    resend: boolean;
    sendgrid: boolean;
  };
}

export const EmailProviderConfig: React.FC<EmailProviderConfigProps> = ({
  onSaveEmailJS,
  onSaveResend,
  onTestProvider,
  providerStatus
}) => {
  const [emailJSConfig, setEmailJSConfig] = useState({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });

  const [resendConfig, setResendConfig] = useState({
    apiKey: '',
    from: ''
  });

  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  const handleTestProvider = async (provider: string) => {
    setTesting(provider);
    try {
      const result = await onTestProvider(provider);
      setTestResults(prev => ({ ...prev, [provider]: result }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* EmailJS Configuration */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            EmailJS (Gratis)
            {providerStatus.emailjs && <CheckCircle size={16} className="text-green-600" />}
          </h4>
          <a
            href="https://www.emailjs.com/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Documentación
          </a>
        </div>
        
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Service ID"
            value={emailJSConfig.serviceId}
            onChange={(e) => setEmailJSConfig(prev => ({ ...prev, serviceId: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Template ID"
            value={emailJSConfig.templateId}
            onChange={(e) => setEmailJSConfig(prev => ({ ...prev, templateId: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Public Key"
            value={emailJSConfig.publicKey}
            onChange={(e) => setEmailJSConfig(prev => ({ ...prev, publicKey: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => onSaveEmailJS(emailJSConfig)}
              className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              Guardar
            </button>
            <button
              onClick={() => handleTestProvider('emailjs')}
              disabled={testing === 'emailjs'}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50 flex items-center gap-2"
            >
              <TestTube size={16} />
              {testing === 'emailjs' ? 'Probando...' : 'Test'}
            </button>
          </div>
          
          {testResults.emailjs !== undefined && (
            <div className={`p-2 rounded text-sm flex items-center gap-2 ${
              testResults.emailjs ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {testResults.emailjs ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {testResults.emailjs ? 'Configuración válida' : 'Error en configuración'}
            </div>
          )}
        </div>
      </div>

      {/* Resend Configuration */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            Resend (Profesional)
            {providerStatus.resend && <CheckCircle size={16} className="text-green-600" />}
          </h4>
          <a
            href="https://resend.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Documentación
          </a>
        </div>
        
        <div className="space-y-3">
          <input
            type="password"
            placeholder="API Key"
            value={resendConfig.apiKey}
            onChange={(e) => setResendConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="From Email (ej: hola@tusalon.com)"
            value={resendConfig.from}
            onChange={(e) => setResendConfig(prev => ({ ...prev, from: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => onSaveResend(resendConfig)}
              className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              Guardar
            </button>
            <button
              onClick={() => handleTestProvider('resend')}
              disabled={testing === 'resend'}
              className="px-4 py-2 border border-green-600 text-green-600 rounded text-sm hover:bg-green-50 flex items-center gap-2"
            >
              <TestTube size={16} />
              {testing === 'resend' ? 'Probando...' : 'Test'}
            </button>
          </div>
          
          {testResults.resend !== undefined && (
            <div className={`p-2 rounded text-sm flex items-center gap-2 ${
              testResults.resend ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {testResults.resend ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {testResults.resend ? 'Configuración válida' : 'Error en configuración'}
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <strong>Nota:</strong> Resend requiere verificar tu dominio para enviar emails. 
          Consulta su documentación para más detalles.
        </div>
      </div>
    </div>
  );
};