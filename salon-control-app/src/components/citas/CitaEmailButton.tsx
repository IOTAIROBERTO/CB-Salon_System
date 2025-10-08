// src/components/citas/CitaEmailButton.tsx
// CONSOLIDADO: CitaEmailButton + EmailReminderIntegration
import { useState } from 'react';
import { Mail, Send, X, Check, AlertCircle, Loader, User, Calendar, Clock } from 'lucide-react';

interface Cita {
  id: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  estado: string;
  notas?: string;
}

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
}

interface Servicio {
  id: string;
  nombre: string;
}

interface CitaEmailButtonProps {
  cita: Cita;
  cliente: Cliente;
  servicio: Servicio;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
}

export default function CitaEmailButton({ 
  cita, 
  cliente, 
  servicio, 
  size = 'md',
  variant = 'icon'
}: CitaEmailButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'confirmacion' | 'recordatorio' | 'cambio'>('recordatorio');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; error?: string } | null>(null);

  const emailTypes = {
    confirmacion: {
      label: 'Confirmación de Cita',
      description: 'Confirma los detalles de la cita',
      icon: Check,
      color: 'text-green-600'
    },
    recordatorio: {
      label: 'Recordatorio',
      description: 'Recordatorio de cita programada',
      icon: Mail,
      color: 'text-blue-600'
    },
    cambio: {
      label: 'Notificación de Cambio',
      description: 'Notifica cambios en la cita',
      icon: AlertCircle,
      color: 'text-orange-600'
    }
  };

  const canSendEmail = cliente.email && cliente.email.trim() !== '';
  const isEmailConfigured = checkEmailConfig();

  function checkEmailConfig() {
    try {
      const config = JSON.parse(localStorage.getItem('emailConfig') || '{}');
      return config.provider === 'emailjs' && config.emailjs?.serviceId;
    } catch {
      return false;
    }
  }

  const handleSendEmail = async () => {
    if (!canSendEmail) {
      alert('El cliente no tiene email registrado');
      return;
    }

    if (!isEmailConfigured) {
      alert('EmailJS no está configurado. Ve a Configuración de Email.');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      // Cargar EmailJS
      await loadEmailJS();
      
      const config = JSON.parse(localStorage.getItem('emailConfig') || '{}');
      window.emailjs.init(config.emailjs.publicKey);

      const emailData = {
        to_email: cliente.email,
        to_name: cliente.nombre,
        subject: getEmailSubject(selectedType),
        message: getEmailMessage(selectedType),
        html_message: getEmailHTML(selectedType)
      };

      const result = await window.emailjs.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        emailData
      );

      if (result.status === 200) {
        setSendResult({ success: true });
        
        // Registrar en historial
        registerEmailLog();
        
        setTimeout(() => {
          setShowModal(false);
          setSendResult(null);
        }, 2000);
      } else {
        setSendResult({ success: false, error: 'Error en el envío' });
      }
    } catch (error: any) {
      setSendResult({
        success: false,
        error: error.message || 'Error desconocido'
      });
    } finally {
      setIsSending(false);
    }
  };

  const loadEmailJS = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.emailjs) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error cargando EmailJS'));
      document.head.appendChild(script);
    });
  };

  const getEmailSubject = (type: string) => {
    switch (type) {
      case 'confirmacion':
        return `Confirmación de Cita - ${servicio.nombre}`;
      case 'recordatorio':
        return `Recordatorio: Tu cita de ${servicio.nombre}`;
      case 'cambio':
        return `Cambio en tu Cita - ${servicio.nombre}`;
      default:
        return 'Información sobre tu Cita';
    }
  };

  const getEmailMessage = (type: string) => {
    const fecha = new Date(cita.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `Hola ${cliente.nombre},

${type === 'confirmacion' ? 'Confirmamos tu cita:' : 
  type === 'recordatorio' ? 'Te recordamos tu cita:' : 
  'Hay un cambio en tu cita:'}

Servicio: ${servicio.nombre}
Fecha: ${fecha}
Hora: ${cita.hora}
${cita.notas ? `Notas: ${cita.notas}` : ''}

¡Te esperamos!

Beauty Salon`;
  };

  const getEmailHTML = (type: string) => {
    const fecha = new Date(cita.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7fafc;">
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #667eea; margin-bottom: 20px;">${
      type === 'confirmacion' ? '✅ Confirmación de Cita' :
      type === 'recordatorio' ? '🔔 Recordatorio de Cita' :
      '📝 Cambio en tu Cita'
    }</h2>
    
    <p style="color: #4a5568; font-size: 16px;">Hola <strong>${cliente.nombre}</strong>,</p>
    
    <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">Servicio:</td>
          <td style="padding: 8px 0; color: #4a5568;">${servicio.nombre}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">Fecha:</td>
          <td style="padding: 8px 0; color: #4a5568;">${fecha}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">Hora:</td>
          <td style="padding: 8px 0; color: #4a5568;">${cita.hora}</td>
        </tr>
        ${cita.notas ? `<tr>
          <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">Notas:</td>
          <td style="padding: 8px 0; color: #4a5568;">${cita.notas}</td>
        </tr>` : ''}
      </table>
    </div>
    
    <p style="color: #718096; font-size: 14px; margin-top: 20px;">
      💡 <strong>Tip:</strong> Llega 5 minutos antes para mayor comodidad
    </p>
    
    <p style="color: #4a5568; margin-top: 20px;">¡Te esperamos!</p>
    <p style="color: #667eea; font-weight: bold;">Beauty Salon</p>
  </div>
</div>`;
  };

  const registerEmailLog = () => {
    try {
      const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
      const updatedCitas = citasData.map((c: any) => {
        if (c.id === cita.id) {
          return {
            ...c,
            emailHistory: [
              ...(c.emailHistory || []),
              {
                type: selectedType,
                sentAt: new Date().toISOString(),
                success: true,
                manual: true
              }
            ]
          };
        }
        return c;
      });
      localStorage.setItem('citas', JSON.stringify(updatedCitas));
    } catch (error) {
      console.error('Error registrando log:', error);
    }
  };

  const buttonSizes = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const getButtonColor = () => {
    if (!canSendEmail) return 'text-gray-400 cursor-not-allowed';
    if (!isEmailConfigured) return 'text-yellow-500';
    return 'text-blue-600 hover:text-blue-900 hover:bg-blue-50';
  };

  const getButtonTitle = () => {
    if (!canSendEmail) return 'Cliente sin email';
    if (!isEmailConfigured) return 'EmailJS no configurado';
    return 'Enviar email';
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => canSendEmail && isEmailConfigured && setShowModal(true)}
          disabled={!canSendEmail || !isEmailConfigured}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            canSendEmail && isEmailConfigured
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={getButtonTitle()}
        >
          <Mail size={iconSizes[size]} />
          <span>Email</span>
        </button>
        {showModal && <EmailModal />}
      </>
    );
  }

  // Variant icon (default)
  return (
    <>
      <button
        onClick={() => canSendEmail && isEmailConfigured && setShowModal(true)}
        disabled={!canSendEmail || !isEmailConfigured}
        className={`${buttonSizes[size]} rounded transition-colors ${getButtonColor()}`}
        title={getButtonTitle()}
      >
        <Mail size={iconSizes[size]} />
      </button>
      {showModal && <EmailModal />}
    </>
  );

  function EmailModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Mail size={20} />
                Enviar Email
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                disabled={isSending}
              >
                <X size={20} />
              </button>
            </div>

            {/* Info de la cita */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Detalles de la Cita</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <strong>{cliente.nombre}</strong>
                  <span className="text-green-600">({cliente.email})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  {new Date(cita.fecha).toLocaleDateString('es-ES')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  {cita.hora}
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  {servicio.nombre}
                </div>
              </div>
            </div>

            {/* Selector de tipo */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Email
              </label>
              <div className="space-y-2">
                {Object.entries(emailTypes).map(([key, type]) => {
                  const Icon = type.icon;
                  return (
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
                        disabled={isSending}
                        className="mt-1"
                      />
                      <Icon size={16} className={`mt-1 ${type.color}`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Resultado */}
              {sendResult && (
                <div className={`p-4 rounded-lg border ${
                  sendResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {sendResult.success ? (
                      <Check size={20} className="text-green-600 mt-0.5" />
                    ) : (
                      <X size={20} className="text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        sendResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {sendResult.success ? 'Email enviado exitosamente' : 'Error al enviar email'}
                      </h3>
                      {sendResult.error && (
                        <p className="text-red-700 text-sm mt-1">{sendResult.error}</p>
                      )}
                      {sendResult.success && (
                        <p className="text-green-700 text-sm mt-1">
                          El email ha sido enviado a {cliente.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSending}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {sendResult?.success ? 'Cerrar' : 'Cancelar'}
                </button>
                {!sendResult?.success && (
                  <button
                    onClick={handleSendEmail}
                    disabled={isSending}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSending ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {isSending ? 'Enviando...' : 'Enviar Email'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

declare global {
  interface Window {
    emailjs: any;
  }
}
