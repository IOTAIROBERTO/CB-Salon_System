// src/components/email/EmailToastNotifications.tsx
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastNotificationsProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    textColor: 'text-green-800',
    iconColor: 'text-green-500'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    textColor: 'text-red-800',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500'
  }
};

export default function EmailToastNotifications({ toasts, onDismiss }: ToastNotificationsProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => {
        const config = TOAST_CONFIG[toast.type];
        const Icon = config.icon;

        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            config={config}
            Icon={Icon}
            onDismiss={onDismiss}
          />
        );
      })}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  config: typeof TOAST_CONFIG[ToastType];
  Icon: any;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, config, Icon, onDismiss }: ToastItemProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`${config.bgColor} border-l-4 ${config.borderColor} rounded-lg shadow-lg p-4 transform transition-all duration-300 ${
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${config.textColor} text-sm`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={`${config.textColor} text-sm mt-1 opacity-90`}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => onDismiss(toast.id), 300);
          }}
          className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Hook personalizado para manejar toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'success', title, message, duration });
  };

  const error = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'error', title, message, duration });
  };

  const warning = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'warning', title, message, duration });
  };

  const info = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'info', title, message, duration });
  };

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    warning,
    info
  };
};

// Ejemplos de uso:
/*
import EmailToastNotifications, { useToast } from './email/EmailToastNotifications';

export default function EmailCampaigns() {
  const toast = useToast();

  const handleSendCampaign = async () => {
    try {
      await sendCampaign();
      toast.success(
        'Â¡CampaÃ±a enviada!',
        'Se han enviado 150 emails exitosamente',
        5000
      );
    } catch (error) {
      toast.error(
        'Error al enviar',
        'No se pudo completar el envÃ­o. Intenta nuevamente.',
        7000
      );
    }
  };

  return (
    <div>
      <EmailToastNotifications 
        toasts={toast.toasts} 
        onDismiss={toast.dismissToast} 
      />
      
      // ... resto del componente
    </div>
  );
}
*/