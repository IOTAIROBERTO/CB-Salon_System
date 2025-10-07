// src/components/citas/ReagendarModal.tsx
import { X, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Cita } from "../../types/citas";
import { 
  obtenerFechaMinima, 
  validarFechaHora,
  formatearFechaLegible,
  formatearHoraLegible
} from "../../utils/dateValidation";

interface ReagendarModalProps {
  cita: Cita;
  onClose: () => void;
  onSave: (citaData: any) => void;
}

export default function ReagendarModal({ cita, onClose, onSave }: ReagendarModalProps) {
  const [fecha, setFecha] = useState(cita.fecha);
  const [hora, setHora] = useState(cita.hora);
  const [errorFechaHora, setErrorFechaHora] = useState<string | null>(null);

  // Validar fecha y hora cada vez que cambien
  useEffect(() => {
    if (fecha && hora) {
      const validacion = validarFechaHora(fecha, hora);
      setErrorFechaHora(validacion.valido ? null : validacion.mensaje || null);
    } else {
      setErrorFechaHora(null);
    }
  }, [fecha, hora]);

  const handleSave = () => {
    // Validar antes de guardar
    const validacion = validarFechaHora(fecha, hora);
    if (!validacion.valido) {
      alert(validacion.mensaje || 'Fecha u hora inválida');
      return;
    }

    // Crear objeto de cita actualizada manteniendo todos los campos existentes
    const citaActualizada = {
      ...cita,
      fecha,
      hora
    };
    
    onSave(citaActualizada);
    onClose();
  };

  const isValid = fecha && hora && !errorFechaHora;
  const fechaHoraCambiaron = fecha !== cita.fecha || hora !== cita.hora;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reagendar Cita</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Información de la cita actual */}
          <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Cita actual:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Fecha:</span> {formatearFechaLegible(cita.fecha)}
              </p>
              <p>
                <span className="font-medium">Hora:</span> {formatearHoraLegible(cita.hora)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Fecha *
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                min={obtenerFechaMinima()}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  errorFechaHora && fecha 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo se pueden seleccionar fechas futuras
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Hora *
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  errorFechaHora && hora 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
              />
              {fecha && hora && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(fecha).toDateString() === new Date().toDateString()
                    ? 'Para hoy, la hora debe ser futura'
                    : 'Hora de inicio del servicio'
                  }
                </p>
              )}
            </div>

            {/* Mensaje de error de validación */}
            {errorFechaHora && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error de validación</p>
                  <p className="text-sm text-red-700">{errorFechaHora}</p>
                </div>
              </div>
            )}

            {/* Vista previa de los cambios */}
            {fechaHoraCambiaron && isValid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Nueva cita:</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>
                    <span className="font-medium">Fecha:</span> {formatearFechaLegible(fecha)}
                  </p>
                  <p>
                    <span className="font-medium">Hora:</span> {formatearHoraLegible(hora)}
                  </p>
                </div>
              </div>
            )}

            {/* Advertencia si no hay cambios */}
            {!fechaHoraCambiaron && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  No has realizado ningún cambio en la fecha u hora
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || !fechaHoraCambiaron}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isValid && fechaHoraCambiaron
                  ? "bg-purple-600 text-white hover:bg-purple-700" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title={!isValid && errorFechaHora ? errorFechaHora : ''}
            >
              <RefreshCw size={16} />
              <span>Reagendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}