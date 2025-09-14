// src/components/ReagendarModal.tsx
import { X } from "lucide-react";
import { useState } from "react";
import { Cita } from "../types";

interface ReagendarModalProps {
  cita: Cita;
  onClose: () => void;
  onSave: (id: string, fecha: string, hora: string) => void;
}

export default function ReagendarModal({ cita, onClose, onSave }: ReagendarModalProps) {
  const [fecha, setFecha] = useState(cita.fecha);
  const [hora, setHora] = useState(cita.hora);

  const handleSave = () => {
    onSave(cita.id, fecha, hora);
    onClose();
  };

  const isValid = fecha && hora;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Reagendar Cita</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`px-4 py-2 rounded ${
              isValid ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500"
            }`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
