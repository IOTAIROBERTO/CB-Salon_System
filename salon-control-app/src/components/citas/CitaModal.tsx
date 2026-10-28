// src/components/citas/CitaModal.tsx - Actualizado con selector de hora mejorado
import { X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { type Cliente, type Servicio, type Cita } from "../../types/citas";
import {
  obtenerFechaMinima,
  validarFechaHora,
  fechaLocalISO
} from "../../utils/dateValidation";
import TimeSelector from "./TimeSelector";
import { zonasDe, SALON, NOMBRE_SALON } from "../../utils/zonas";
import HorariosLibres, { AvisosAgenda } from "./HorariosLibres";
import { useAgenda } from "../../hooks/useAgenda";

import { db } from "../../db/db";
import { useLiveQuery } from "dexie-react-hooks";

interface CitaModalProps {
  clientes: Cliente[];
  servicios: Servicio[];
  onClose: () => void;
  onSave: (formData: Omit<Cita, "id"> | { id: string;[key: string]: any }) => void;
  citaEdit?: Cita | null;
  /** Para crear una cita ya llena (por ejemplo, desde un evento apuntado a mano en Google Calendar) */
  inicial?: { fecha?: string; hora?: string; notas?: string; estado?: Cita['estado']; googleAdoptar?: string };
}

export default function CitaModal({ clientes, servicios, onClose, onSave, citaEdit, inicial }: CitaModalProps) {
  const empleados = useLiveQuery(() => db.empleados.toArray())?.filter(e => e.activo) || [];
  const { personas } = useAgenda();
  const settings = useLiveQuery(() => db.configuracion.get("settings"));
  const zonas = zonasDe(settings as any);

  const [formData, setFormData] = useState({
    clienteId: citaEdit?.clienteId || "",
    servicioId: citaEdit?.servicioId || "",
    empleadoIds: citaEdit?.empleadoIds || [],
    fecha: citaEdit?.fecha || inicial?.fecha || "",
    hora: citaEdit?.hora || inicial?.hora || "",
    notas: citaEdit?.notas || inicial?.notas || "",
    descripcionTrabajo: citaEdit?.descripcionTrabajo || "",
    ubicacion: citaEdit?.ubicacion || SALON,
    atiendeId: citaEdit?.atiendeId || "cristina",
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
        estado: inicial?.estado || ("pendiente" as const),
        ...(inicial?.googleAdoptar ? { googleAdoptar: inicial.googleAdoptar } : {}),
      });
    }
    onClose();
  };

  // Calcular hora mínima si es hoy
  const getMinTime = () => {
    if (!formData.fecha) return undefined;

    const today = fechaLocalISO();
    if (formData.fecha === today) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return undefined;
  };

  const isValid = formData.clienteId &&
    formData.servicioId &&
    formData.fecha &&
    formData.hora &&
    !errorFechaHora;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {citaEdit ? "Editar Cita" : "Nueva Cita"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Selector de cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <select
              value={formData.clienteId}
              onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio *
            </label>
            <select
              value={formData.servicioId}
              onChange={(e) => setFormData({ ...formData, servicioId: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar servicio</option>
              {servicios.filter((s) => (!s.archivado && s.categoria !== 'otros') || s.id === formData.servicioId).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} - ${s.precioSugerido}
                </option>
              ))}
            </select>
          </div>

          {/* Dónde y qué se trabaja */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Dónde se hace el trabajo?
            </label>
            <select
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={SALON}>{NOMBRE_SALON}</option>
              {[...new Set(zonas.map(z => z.region))].map(region => (
                <optgroup key={region} label={region || "Fuera de Hermosillo"}>
                  {zonas.filter(z => z.region === region && (z.activa || z.id === formData.ubicacion)).map(z => (
                    <option key={z.id} value={z.id}>{z.nombre}</option>
                  ))}
                </optgroup>
              ))}
              {formData.ubicacion !== SALON && !zonas.some(z => z.id === formData.ubicacion) && (
                <option value={formData.ubicacion}>{formData.ubicacion}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del trabajo
            </label>
            <textarea
              value={formData.descripcionTrabajo}
              onChange={(e) => setFormData({ ...formData, descripcionTrabajo: e.target.value })}
              placeholder="Qué se va a trabajar y por qué ese precio. Ej.: raíz 3 cm + matiz, cabello largo y grueso, 2 tubos de tinte."
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empleados asignados (Participan en la comisión)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
              {empleados.map((emp: any) => (
                <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.empleadoIds.includes(emp.id)}
                    onChange={(e) => {
                      const newIds = e.target.checked
                        ? [...formData.empleadoIds, emp.id]
                        : formData.empleadoIds.filter(id => id !== emp.id);
                      setFormData({ ...formData, empleadoIds: newIds });
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{emp.nombre}</span>
                </label>
              ))}
              {empleados.length === 0 && (
                <div className="col-span-2 text-xs text-gray-500 italic">No hay empleados activos registrados</div>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">La comisión se dividirá equitativamente entre los seleccionados</p>
          </div>

          {/* Selector de fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de la cita *
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              min={obtenerFechaMinima()}
              className={`w-full border-2 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${errorFechaHora && formData.fecha
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                }`}
            />
            {formData.fecha && (
              <p className="text-xs text-gray-500 mt-1">
                No se pueden agendar citas en fechas pasadas
              </p>
            )}
          </div>

          {/* Quién atiende y horarios libres según la duración del servicio */}
          {personas.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Quién atiende?</label>
              <select value={formData.atiendeId} onChange={(e) => setFormData({ ...formData, atiendeId: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {personas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
          <HorariosLibres fecha={formData.fecha} servicioId={formData.servicioId} atiendeId={personas.length > 1 ? formData.atiendeId : undefined}
            ignorarCitaId={citaEdit?.id} horaElegida={formData.hora}
            onElegir={(hora, personaId) => setFormData({ ...formData, hora, atiendeId: personaId })} />

          {/* Hora manual (por si se acordó otra con la clienta) */}
          <TimeSelector
            value={formData.hora}
            onChange={(time) => setFormData({ ...formData, hora: time })}
            minTime={getMinTime()}
            label="Otra hora (manual) *"
          />
          <AvisosAgenda cita={{ id: citaEdit?.id, fecha: formData.fecha, hora: formData.hora, servicioId: formData.servicioId, atiendeId: formData.atiendeId, serviciosAdicionales: citaEdit?.serviciosAdicionales }} />

          {/* Mensaje de error de validación */}
          {errorFechaHora && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
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
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="iniciada">Iniciada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          )}

          {/* Notas adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas adicionales
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Notas adicionales..."
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${isValid
                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              title={!isValid && errorFechaHora ? errorFechaHora : ''}
            >
              {citaEdit ? "Actualizar" : "Guardar"} Cita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}