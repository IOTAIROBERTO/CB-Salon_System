// src/components/citas/CitaModal.tsx
import { X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Cliente, Servicio, Cita } from "../../types/citas";
import { 
  obtenerFechaMinima, 
  validarFechaHora 
} from "../../utils/dateValidation";

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

  const [errorFechaHora, setErrorFechaHora] = useState<string | null>(null);

  // Validar fecha y hora cada vez que cambien
  useEffect(() => {
    if (formData.fecha && formData.hora) {
      const validacion = validarFechaHora(formData.fecha, formData.hora);
      setErrorFechaHora(validacion.valido ? null : validacion.mensaje || null);
    } else {
      setErrorFechaHora(null);
    }
  }, [formData.fecha, formData.hora]);

  const handleSave = () => {
    // Validar fecha y hora antes de guardar
    const validacion = validarFechaHora(formData.fecha, formData.hora);
    if (!validacion.valido) {
      alert(validacion.mensaje || 'Fecha u hora inválida');
      return;
    }

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

  const isValid = formData.clienteId && 
                  formData.servicioId && 
                  formData.fecha && 
                  formData.hora && 
                  !errorFechaHora;

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
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Seleccionar servicio</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} - ${s.precioSugerido}
              </option>
            ))}
          </select>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de la cita *
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              min={obtenerFechaMinima()}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                errorFechaHora && formData.fecha 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'focus:ring-purple-500'
              }`}
            />
            {formData.fecha && (
              <p className="text-xs text-gray-500 mt-1">
                No se pueden agendar citas en fechas pasadas
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de la cita *
            </label>
            <input
              type="time"
              value={formData.hora}
              onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                errorFechaHora && formData.hora 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'focus:ring-purple-500'
              }`}
            />
            {formData.fecha && formData.hora && (
              <p className="text-xs text-gray-500 mt-1">
                {new Date(formData.fecha).toDateString() === new Date().toDateString()
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

          {/* Campo de estado solo en modo edición */}
          {citaEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de la cita
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="iniciada">Iniciada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas adicionales
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Notas adicionales..."
              className="w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
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
            title={!isValid && errorFechaHora ? errorFechaHora : ''}
          >
            {citaEdit ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}