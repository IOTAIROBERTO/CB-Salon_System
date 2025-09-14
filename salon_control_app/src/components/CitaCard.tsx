// src/components/CitaCard.tsx
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Edit,
  Trash2,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Cita, Cliente, Servicio } from "../types";

interface CitaCardProps {
  cita: Cita;
  clientes: Cliente[];
  servicios: Servicio[];
  onDelete: (id: string) => void;
  onEstadoChange: (id: string, newEstado: Cita["estado"]) => void;
  onUpdateAnticipo: (id: string, anticipoConfirmado: boolean, monto?: number) => void;
  onOpenCobro: () => void;
  onOpenEdit: () => void;
  onOpenReagendar: () => void;
}

export default function CitaCard({
  cita,
  clientes,
  servicios,
  onDelete,
  onEstadoChange,
  onUpdateAnticipo,
  onOpenCobro,
  onOpenEdit,
  onOpenReagendar,
}: CitaCardProps) {
  const [anticipoInput, setAnticipoInput] = useState(cita.montoAnticipo?.toString() || "");
  const [isEditingAnticipo, setIsEditingAnticipo] = useState(false);

  const cliente = clientes.find((c) => c.id === cita.clienteId)?.nombre || "Cliente no encontrado";
  const clienteData = clientes.find((c) => c.id === cita.clienteId);
  const servicio = servicios.find((s) => s.id === cita.servicioId);

  const formatDate = (dateString: string) => {
    // Crear fecha local sin conversión de zona horaria
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) =>
    new Date(`2000-01-01T${timeString}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Verificar si es cumpleaños del cliente
  const esCumpleanos = () => {
    if (!clienteData?.fechaNacimiento) return false;
    
    const fechaCita = new Date(cita.fecha);
    const fechaNacimiento = new Date(clienteData.fechaNacimiento);
    
    return (
      fechaCita.getMonth() === fechaNacimiento.getMonth() &&
      fechaCita.getDate() === fechaNacimiento.getDate()
    );
  };

  const getEstadoColor = (estado: Cita["estado"]) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmada":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "iniciada":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completada":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelada":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleConfirmAnticipo = () => {
    const monto = parseFloat(anticipoInput) || 0;
    onUpdateAnticipo(cita.id, true, monto);
    setIsEditingAnticipo(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirmAnticipo();
    }
  };

  const canShowIniciarButton = cita.estado === "confirmada" || 
    (cita.estado === "pendiente" && cita.anticipoConfirmado);

  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Información principal */}
        <div className="flex-1 space-y-3">
          {/* Estado de la cita */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(cita.estado)}`}>
              {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <span className="font-semibold text-gray-900">{cliente}</span>
            </div>
            <div className="flex items-center gap-2">
              <Scissors size={16} className="text-gray-400" />
              <span className="text-gray-700">{servicio?.nombre}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-600 text-sm">{formatDate(cita.fecha)}</span>
              {esCumpleanos() && (
                <div className="flex items-center gap-1 bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                  🎂 <span>¡Cumpleaños!</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-gray-600 text-sm">{formatTime(cita.hora)}</span>
            </div>
          </div>

          {/* Información de precios */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p>
                <span className="text-gray-600">Precio sugerido: </span>
                <strong className="text-green-600">${servicio?.precioSugerido || 0}</strong>
              </p>
              <p>
                <span className="text-gray-600">Anticipo sugerido: </span>
                <strong className="text-orange-600">${servicio?.anticipoSugerido || 0}</strong>
              </p>
            </div>
            
            {/* Campo de anticipo editable */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Anticipo: </span>
                {isEditingAnticipo ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-1">$</span>
                      <input
                        type="number"
                        value={anticipoInput}
                        onChange={(e) => setAnticipoInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={handleConfirmAnticipo}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex items-center gap-1"
                    >
                      <Check size={12} />
                      OK
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingAnticipo(false);
                        setAnticipoInput(cita.montoAnticipo?.toString() || "");
                      }}
                      className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <strong 
                      className="text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setIsEditingAnticipo(true)}
                    >
                      ${cita.montoAnticipo || 0}
                    </strong>
                    {!cita.anticipoConfirmado && cita.estado === "pendiente" && (
                      <span className="text-orange-500 text-xs">(Sin confirmar)</span>
                    )}
                    {cita.anticipoConfirmado && (
                      <span className="text-green-500 text-xs">✓ Confirmado</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Saldo pendiente calculado */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Saldo pendiente: </span>
                <strong className="text-red-600">
                  ${Math.max(0, (servicio?.precioSugerido || 0) - (cita.montoAnticipo || 0))}
                </strong>
              </div>
            </div>
          </div>

          {/* Notas */}
          {cita.notas && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Notas: </span>
              {cita.notas}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2">
          {cita.estado === "pendiente" && (
            <>
              <button
                onClick={() => onEstadoChange(cita.id, "cancelada")}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <XCircle size={14} className="inline mr-1" /> Cancelar
              </button>
              <button
                onClick={onOpenReagendar}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <RefreshCw size={14} className="inline mr-1" /> Reagendar
              </button>
              <button
                onClick={() => onEstadoChange(cita.id, "confirmada")}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                <CheckCircle size={14} className="inline mr-1" /> Confirmar
              </button>
            </>
          )}

          {canShowIniciarButton && (
            <button
              onClick={() => onEstadoChange(cita.id, "iniciada")}
              className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <Play size={16} className="inline mr-1" /> Iniciar
            </button>
          )}

          {cita.estado === "iniciada" && (
            <button
              onClick={onOpenCobro}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <CheckCircle size={16} className="inline mr-1" /> Terminar
            </button>
          )}

          {cita.estado === "completada" && cita.saldoPendiente && cita.saldoPendiente > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 flex items-center gap-1">
              <AlertTriangle size={12} /> Saldo pendiente: ${cita.saldoPendiente}
            </div>
          )}

          {/* Editar / Eliminar */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={onOpenEdit}
              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
              disabled={cita.estado === "completada"}
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(cita.id)}
              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
              disabled={cita.estado === "iniciada"}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}