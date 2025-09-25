// src/components/EmailReminderIntegration.tsx - Integración con el sistema de citas

import React, { useState } from 'react';
import { Mail, Send, Calendar, User, Clock, AlertCircle, Check, X, Loader } from 'lucide-react';
import { emailService, type EmailReminder } from '../services/emailService';

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

interface EmailReminderIntegrationProps {
  cita: Cita;
  cliente: Cliente;
  servicio: Servicio;
  onClose: () => void;
}

export default function EmailReminderIntegration({ 
  cita, 
  cliente, 
  servicio, 
  onClose 
}: EmailReminderIntegrationProps) {
  const [selectedType, setSelectedType] = useState<EmailReminder['type']>('confirmacion');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; error?: string } | null>(null);

  const emailTypes = {
    confirmacion: {
      label: 'Confirmación de Cita',
      description: 'Envía un email confirmando los detalles de la cita',
      icon: Check,
      color: 'text-green-600'
    },
    recordatorio: {
      label: 'Recordatorio',
      description: 'Envía un recordatorio de la cita programada',
      icon: Clock,
      color: 'text-blue-600'
    },
    cambio: {
      label: 'Notificación de Cambio',
      description: 'Notifica cambios en la fecha, hora o servicio',
      icon: Calendar,
      color: 'text-orange-600'
    }
  };

  const canSendEmail = cliente.email && cliente.email.trim() !== '';

  const handleSendEmail = async () => {
    if (!canSendEmail) {
      alert('El cliente no tiene email registrado');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const emailData: EmailReminder = {
        to: cliente.email!,
        clienteName: cliente.nombre,
        servicioNombre: servicio.nombre,
        fecha: cita.fecha,
        hora: cita.hora,
        notas: cita.notas,
        type: selectedType
      };

      const result = await emailService.sendReminder(emailData);
      setSendResult(result);

      if (result.success) {
        // Registrar el envío en el historial de la cita (opcional)
        const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
        const updatedCitas = citasData.map((c: Cita) => {
          if (c.id === cita.id) {
            return {
              ...c,
              emailHistory: [
                ...(c.emailHistory || []),
                {
                  type: selectedType,
                  sentAt: new Date().toISOString(),
                  success: true
                }
              ]
            };
          }
          return c;
        });
        localStorage.setItem('citas', JSON.stringify(updatedCitas));
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

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
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Información de la cita */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Detalles de la Cita</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="font-medium">{cliente.nombre}</span>
                {canSendEmail ? (
                  <span className="text-green-600">({cliente.email})</span>
                ) : (
                  <span className="text-red-600">(Sin email)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span>{formatDate(cita.fecha)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span>{formatTime(cita.hora)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span>{servicio.nombre}</span>
              </div>
            </div>
          </div>

          {/* Selector de tipo de email */}
          {canSendEmail ? (
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
                          onChange={(e) => setSelectedType(e.target.value as EmailReminder['type'])}
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
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
          ) : (
            /* Sin email registrado */
            <div className="text-center py-6">
              <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Email no disponible
              </h3>
              <p className="text-gray-600 mb-4">
                Este cliente no tiene un email registrado.
              </p>
              <p className="text-sm text-gray-500">
                Agrega un email en la información del cliente para enviar recordatorios automáticos.
              </p>
              
              <div className="flex justify-center mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook para usar en el componente de citas
export const useEmailReminders = () => {
  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean;
    cita?: any;
    cliente?: any;
    servicio?: any;
  }>({ isOpen: false });

  const openReminderModal = (cita: any, cliente: any, servicio: any) => {
    setReminderModal({
      isOpen: true,
      cita,
      cliente,
      servicio
    });
  };

  const closeReminderModal = () => {
    setReminderModal({ isOpen: false });
  };

  const ReminderModal = () => {
    if (!reminderModal.isOpen || !reminderModal.cita) return null;

    return (
      <EmailReminderIntegration
        cita={reminderModal.cita}
        cliente={reminderModal.cliente}
        servicio={reminderModal.servicio}
        onClose={closeReminderModal}
      />
    );
  };

  return {
    openReminderModal,
    closeReminderModal,
    ReminderModal
  };
};