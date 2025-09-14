// src/components/CitaModal.tsx
import { X } from "lucide-react";
import { useState } from "react";
import { Cliente, Servicio, Cita } from "../types";

interface CitaModalProps {
  clientes: Cliente[];
  servicios: Servicio[];
  onClose: () => void;
  onSave: (formData: Omit<Cita, "id"> | { id: string; [key: string]: any }) => void;
  citaEdit?: Cita | null;
}

export default function CitaModal({ clientes, servicios, onClose, onSave, citaEdit }: CitaModalProps) {
  const [formData, setFormData] = useState({
    clienteId: citaEdit?.clienteId || "",
    servicioId: citaEdit?.servicioId || "",
    fecha: citaEdit?.fecha || "",
    hora: citaEdit?.hora || "",
    notas: citaEdit?.notas || "",
    estado: citaEdit?.estado || "pendiente",
  });

  const handleSave = () => {
    if (citaEdit) {
      // Modo edición: crear objeto de cita completo manteniendo campos existentes
      const citaActualizada = {
        ...citaEdit,
        ...formData,
      };
      onSave(citaActualizada);
    } else {
      // Modo creación: solo los campos básicos
      onSave({
        ...formData,
        estado: "pendiente" as const,
      });
    }
    onClose();
  };

  const isValid = formData.clienteId && formData.servicioId && formData.fecha && formData.hora;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{citaEdit ? "Editar Cita" : "Nueva Cita"}</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <select
            value={formData.clienteId}
            onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Seleccionar cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select
            value={formData.servicioId}
            onChange={(e) => setFormData({ ...formData, servicioId: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Seleccionar servicio</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} - ${s.precioSugerido}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="time"
            value={formData.hora}
            onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />

          {/* Campo de estado solo en modo edición */}
          {citaEdit && (
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="iniciada">Iniciada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          )}

          <textarea
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            placeholder="Notas adicionales..."
            className="w-full border rounded px-3 py-2 h-20"
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`px-4 py-2 rounded ${
              isValid 
                ? "bg-purple-600 text-white hover:bg-purple-700" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {citaEdit ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}