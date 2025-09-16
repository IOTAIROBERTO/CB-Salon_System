import { X } from 'lucide-react';
import { Cliente, ClienteFormData } from '../../types/clientes';
import { validateClienteForm } from '../../utils/clientesUtils';

interface ClienteModalProps {
  isOpen: boolean;
  editingCliente: Cliente | null;
  formData: ClienteFormData;
  updateFormData: (field: keyof ClienteFormData, value: string | boolean) => void;
  isFormValid: () => boolean;
  onSave: (clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>) => void;
  onUpdate: (clienteId: string, updatedData: Partial<Cliente>) => void;
  onClose: () => void;
}

export default function ClienteModal({ 
  isOpen, 
  editingCliente, 
  formData, 
  updateFormData,
  isFormValid,
  onSave,
  onUpdate,
  onClose 
}: ClienteModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateClienteForm(formData);
    if (validationError) {
      alert(validationError);
      return;
    }

    const clienteData = {
      nombre: formData.nombre.trim(),
      cumple: formData.cumple,
      comentarios: formData.comentarios.trim(),
      activo: formData.activo,
      email: formData.email.trim(),
      telefono: formData.telefono.trim()
    };

    if (editingCliente) {
      onUpdate(editingCliente.id, clienteData);
    } else {
      onSave(clienteData);
    }
    
    alert((editingCliente ? 'Cliente actualizado' : 'Cliente agregado') + ' exitosamente!');
    onClose();
  };

  const isEditing = !!editingCliente;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => updateFormData('nombre', e.target.value)}
                  placeholder="Ej: María García López"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Fecha de cumpleaños */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Cumpleaños *
                </label>
                <input
                  type="date"
                  value={formData.cumple}
                  onChange={(e) => updateFormData('cumple', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nos ayuda a enviar felicitaciones y ofertas especiales
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para recordatorios y confirmaciones por email
                </p>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono/WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => updateFormData('telefono', e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para recordatorios por WhatsApp (incluye código de país)
                </p>
              </div>

              {/* Comentarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentarios y Notas
                </label>
                <textarea
                  value={formData.comentarios}
                  onChange={(e) => updateFormData('comentarios', e.target.value)}
                  placeholder="Preferencias, alergias, historial, etc..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Estado activo/inactivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Cliente
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="activo"
                      checked={formData.activo === true}
                      onChange={() => updateFormData('activo', true)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Activo</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="activo"
                      checked={formData.activo === false}
                      onChange={() => updateFormData('activo', false)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactivo</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Los clientes inactivos no aparecen en la selección de citas
                </p>
              </div>

              {/* Información importante */}
              {!isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    💡 Información importante:
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• El cliente estará disponible para crear citas una vez guardado</li>
                    <li>• El email y teléfono son opcionales pero recomendados</li>
                    <li>• Los comentarios te ayudan a brindar mejor servicio</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isFormValid()}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isFormValid()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isEditing ? 'Actualizar' : 'Guardar'} Cliente
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}