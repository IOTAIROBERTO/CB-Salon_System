import { X, Save } from 'lucide-react';
import { Servicio, ServicioFormData } from '../../types/catalogo';
import { validateServicioForm, generateServicioId } from '../../utils/catalogoUtils';

interface ServicioModalProps {
  isOpen: boolean;
  editingServicio: Servicio | null;
  formData: ServicioFormData;
  updateFormData: (field: keyof ServicioFormData, value: string | number) => void;
  onSave: (servicio: Servicio) => void;
  onUpdate: (servicioId: string, updatedData: Partial<Servicio>) => void;
  onClose: () => void;
}

export default function ServicioModal({
  isOpen,
  editingServicio,
  formData,
  updateFormData,
  onSave,
  onUpdate,
  onClose
}: ServicioModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateServicioForm(formData);
    if (validationError) {
      alert(validationError);
      return;
    }

    if (editingServicio) {
      onUpdate(editingServicio.id, formData);
    } else {
      const newServicio: Servicio = {
        id: generateServicioId(),
        ...formData
      };
      onSave(newServicio);
    }

    onClose();
  };

  const isEditing = !!editingServicio;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Servicio *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => updateFormData('nombre', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Corte de cabello"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Sugerido *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.precioSugerido || ''}
                  onChange={(e) => updateFormData('precioSugerido', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  step="1"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anticipo Sugerido
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.anticipoSugerido || ''}
                  onChange={(e) => updateFormData('anticipoSugerido', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Opcional. Puede dejarse en 0 si no requiere anticipo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comisión Especial (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.comision || ''}
                  onChange={(e) => updateFormData('comision', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="Ej: 40"
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Si se define, ignorará el % base del empleado asignado.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>{isEditing ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}