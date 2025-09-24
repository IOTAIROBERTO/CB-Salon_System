// src/components/email/EmailComponents.tsx - COMPONENTES BASE CONSOLIDADOS

import React, { useState } from 'react';
import { Mail, Send, X, Check, Loader, AlertCircle } from 'lucide-react';
import { useEmail, useCitaEmail } from '../../hooks/useEmail';

// ============ BOTÓN BASE DE EMAIL ============
export interface EmailButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export const EmailButton: React.FC<EmailButtonProps> = ({
  onClick,
  disabled = false,
  variant = 'icon',
  size = 'md',
  title = 'Enviar email',
  children,
  className = ''
}) => {
  const sizeClasses = {
    sm: variant === 'icon' ? 'p-1' : 'px-2 py-1 text-sm',
    md: variant === 'icon' ? 'p-2' : 'px-4 py-2 text-base',
    lg: variant === 'icon' ? 'p-3' : 'px-6 py-3 text-lg'
  };

  const iconSizes = { sm: 14, md: 16, lg: 20 };

  const getButtonColor = () => {
    if (disabled) {
      return variant === 'icon' 
        ? 'text-gray-400 cursor-not-allowed'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    return variant === 'icon'
      ? 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
      : 'bg-blue-600 text-white hover:bg-blue-700';
  };

  const baseClasses = `${sizeClasses[size]} rounded transition-colors ${getButtonColor()} ${className}`;

  if (variant === 'button') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`flex items-center gap-2 ${baseClasses}`}
      >
        <Mail size={iconSizes[size]} />
        {children || 'Email'}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={baseClasses}
    >
      <Mail size={iconSizes[size]} />
    </button>
  );
};

// ============ MODAL BASE DE EMAIL ============
export interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  showSendButton?: boolean;
  onSend?: () => Promise<void>;
  sendButtonText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showSendButton = false,
  onSend,
  sendButtonText = 'Enviar Email',
  size = 'md'
}) => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!onSend) return;
    
    setIsSending(true);
    setResult(null);
    
    try {
      await onSend();
      setResult({ success: true });
      
      // Auto-cerrar después de 2 segundos si fue exitoso
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 2000);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      });
    } finally {
      setIsSending(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'lg': return 'max-w-4xl';
      default: return 'max-w-md';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl w-full ${getSizeClasses()} max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Mail size={20} />
              {title}
            </h2>
            <button
              onClick={onClose}
              disabled={isSending}
              className="text-gray-400 hover:text-gray-600 p-1 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {children}

          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <Check size={20} className="text-green-600 mt-0.5" />
                ) : (
                  <X size={20} className="text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Email enviado exitosamente' : 'Error al enviar email'}
                  </h3>
                  {result.error && (
                    <p className="text-red-700 text-sm mt-1">{result.error}</p>
                  )}
                  {result.success && (
                    <p className="text-green-700 text-sm mt-1">
                      El email ha sido enviado correctamente
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {result?.success ? 'Cerrar' : 'Cancelar'}
            </button>
            {showSendButton && !result?.success && (
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                {isSending ? 'Enviando...' : sendButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ COMPONENTE PARA CITAS CON EMAIL ============
export interface CitaEmailButtonProps {
  cita: any;
  cliente: any;
  servicio: any;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
  onEmailSent?: (success: boolean) => void;
}

export const CitaEmailButton: React.FC<CitaEmailButtonProps> = ({
  cita,
  cliente,
  servicio,
  size = 'md',
  variant = 'icon',
  onEmailSent
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'confirmacion' | 'recordatorio' | 'cambio'>('recordatorio');
  
  const { canSendEmail, isConfigured, sendConfirmation, sendReminder, sendChange } = useCitaEmail({
    cita,
    cliente,
    servicio
  });

  const emailTypes = {
    confirmacion: {
      label: 'Confirmación de Cita',
      description: 'Confirma los detalles de la cita',
      color: 'text-green-600'
    },
    recordatorio: {
      label: 'Recordatorio',
      description: 'Recordatorio de cita programada',
      color: 'text-blue-600'
    },
    cambio: {
      label: 'Notificación de Cambio',
      description: 'Notifica cambios en la cita',
      color: 'text-orange-600'
    }
  };

  const getButtonTitle = () => {
    if (!cliente?.email) return 'Cliente sin email';
    if (!isConfigured) return 'EmailJS no configurado';
    return 'Enviar email';
  };

  const handleSendEmail = async () => {
    let result;
    
    switch (selectedType) {
      case 'confirmacion':
        result = await sendConfirmation();
        break;
      case 'recordatorio':
        result = await sendReminder();
        break;
      case 'cambio':
        result = await sendChange();
        break;
      default:
        result = { success: false, error: 'Tipo de email no válido' };
    }

    onEmailSent?.(result.success);
    
    if (result.success) {
      setShowModal(false);
    }
    
    return result;
  };

  return (
    <>
      <EmailButton
        onClick={() => canSendEmail && setShowModal(true)}
        disabled={!canSendEmail}
        variant={variant}
        size={size}
        title={getButtonTitle()}
      >
        {variant === 'button' ? 'Email' : undefined}
      </EmailButton>

      <EmailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Enviar Email al Cliente"
        showSendButton
        onSend={handleSendEmail}
      >
        {/* Información de la cita */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Detalles de la Cita</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Cliente:</strong> {cliente.nombre}</div>
            <div><strong>Email:</strong> {cliente.email}</div>
            <div><strong>Servicio:</strong> {servicio.nombre}</div>
            <div><strong>Fecha:</strong> {new Date(cita.fecha).toLocaleDateString('es-ES')}</div>
            <div><strong>Hora:</strong> {cita.hora}</div>
            {cita.notas && <div><strong>Notas:</strong> {cita.notas}</div>}
          </div>
        </div>

        {/* Selector de tipo de email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Email
          </label>
          <div className="space-y-2">
            {Object.entries(emailTypes).map(([key, type]) => (
              <label
                key={key}
                className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="emailType"
                  value={key}
                  checked={selectedType === key}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </EmailModal>
    </>
  );
};

// ============ INDICADOR DE ESTADO DE EMAIL ============
export interface EmailStatusIndicatorProps {
  className?: string;
}

export const EmailStatusIndicator: React.FC<EmailStatusIndicatorProps> = ({
  className = ''
}) => {
  const { isConfigured, isInitialized } = useEmail();

  const getStatus = () => {
    if (isConfigured && isInitialized) {
      return { color: 'text-green-600', bg: 'bg-green-100', text: 'Configurado', icon: Check };
    }
    if (isConfigured && !isInitialized) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Inicializando...', icon: Loader };
    }
    return { color: 'text-red-600', bg: 'bg-red-100', text: 'No configurado', icon: AlertCircle };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${status.bg} ${status.color} ${className}`}>
      <Icon size={14} className={status.icon === Loader ? 'animate-spin' : ''} />
      <span>{status.text}</span>
    </div>
  );
};

// ============ COMPONENTE PARA QUICK ACTIONS ============
export interface EmailQuickActionsProps {
  cita: any;
  cliente: any;
  servicio: any;
  onEmailSent?: (type: string, success: boolean) => void;
}

export const EmailQuickActions: React.FC<EmailQuickActionsProps> = ({
  cita,
  cliente,
  servicio,
  onEmailSent
}) => {
  const { canSendEmail, sendConfirmation, sendReminder, sendChange } = useCitaEmail({
    cita,
    cliente,
    servicio
  });

  const [sendingType, setSendingType] = useState<string | null>(null);

  if (!canSendEmail) return null;

  const handleQuickSend = async (type: 'confirmacion' | 'recordatorio' | 'cambio') => {
    setSendingType(type);
    
    let result;
    switch (type) {
      case 'confirmacion':
        result = await sendConfirmation();
        break;
      case 'recordatorio':
        result = await sendReminder();
        break;
      case 'cambio':
        result = await sendChange();
        break;
    }
    
    setSendingType(null);
    onEmailSent?.(type, result.success);
    
    if (result.success) {
      // Mostrar notificación temporal
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = `Email de ${type} enviado a ${cliente.nombre}`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  const quickActions = [
    { type: 'confirmacion' as const, label: 'Confirmar', color: 'bg-green-600 hover:bg-green-700' },
    { type: 'recordatorio' as const, label: 'Recordar', color: 'bg-blue-600 hover:bg-blue-700' },
    { type: 'cambio' as const, label: 'Cambio', color: 'bg-orange-600 hover:bg-orange-700' }
  ];

  return (
    <div className="flex gap-1">
      {quickActions.map(action => (
        <button
          key={action.type}
          onClick={() => handleQuickSend(action.type)}
          disabled={sendingType === action.type}
          className={`px-2 py-1 text-xs text-white rounded transition-colors disabled:opacity-50 ${action.color}`}
          title={`Enviar email de ${action.label.toLowerCase()}`}
        >
          {sendingType === action.type ? (
            <Loader size={12} className="animate-spin" />
          ) : (
            action.label
          )}
        </button>
      ))}
    </div>
  );
};

// ============ EXPORTACIONES ============
export default {
  EmailButton,
  EmailModal,
  CitaEmailButton,
  EmailStatusIndicator,
  EmailQuickActions
};