// src/components/CitaEmailButton.tsx - Componente para enviar emails desde citas

import React, { useState } from 'react';
import { Mail, Send, Check, X, AlertCircle, Loader } from 'lucide-react';
import { emailService } from '../services/emailService';

interface CitaEmailButtonProps {
  cita: {
    id: string;
    clienteId: string;
    servicioId: string;
    fecha: string;
    hora: string;
    notas?: string;
    estado: string;
  };
  cliente: {
    id: string;
    nombre: string;
    email?: string;
  };
  servicio: {
    id: string;
    nombre: string;
  };
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
  const isEmailConfigured = emailService.getStatus().isConfigured;

  const handleSendEmail = async () => {
    if (!canSendEmail) {
      alert('El cliente no tiene email registrado');
      return;
    }

    if (!isEmailConfigured) {
      alert('EmailJS no está configurado. Ve a la configuración de Email.');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const result = await emailService.sendReminder({
        to: cliente.email!,
        clienteName: cliente.nombre,
        servicioNombre: servicio.nombre,
        fecha: cita.fecha,
        hora: cita.hora,
        notas: cita.notas,
        type: selectedType
      });

      setSendResult(result);

      if (result.success) {
        // Registrar en historial de la cita
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

        // Auto-cerrar modal después de envío exitoso
        setTimeout(() => {
          setShowModal(false);
          setSendResult(null);
        }, 2000);
      }
    } catch (error) {
      setSendResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsSending(false);
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

  // Determinar el color del botón según el estado
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

  // Modal de envío de email
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
            <div className="space-y-4">
              <div>
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
              </div>

              {/* Resultado del envío */}
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

              {/* Botones de acción */}
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