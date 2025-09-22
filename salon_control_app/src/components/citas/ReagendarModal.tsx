// src/components/citas/ReagendarModal.tsx
import { X } from "lucide-react";
import { useState } from "react";
import { Cita } from "../../types/citas";

interface ReagendarModalProps {
  cita: Cita;
  onClose: () => void;
  onSave: (citaData: any) => void;
}

export default function ReagendarModal({ cita, onClose, onSave }: ReagendarModalProps) {
  const [fecha, setFecha] = useState(cita.fecha);
  const [hora, setHora] = useState(cita.hora);

  const handleSave = () => {
    // Crear objeto de cita actualizada manteniendo todos los campos existentes
    const citaActualizada = {
      ...cita,
      fecha,
      hora
    };
    
    onSave(citaActualizada);
    onClose();
  };

  const isValid = fecha && hora;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Reagendar Cita</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Hora
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Información de la cita actual */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Fecha actual: {cita.fecha}</p>
              <p className="text-sm text-gray-600">Hora actual: {cita.hora}</p>
            </div>
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
              disabled={!isValid}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isValid 
                  ? "bg-purple-600 text-white hover:bg-purple-700" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Reagendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}