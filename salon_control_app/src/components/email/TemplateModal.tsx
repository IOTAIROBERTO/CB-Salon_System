// src/components/email/TemplateModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TemplateModalProps {
  template?: any;
  onClose: () => void;
  onSave: (template: any) => void;
}

export default function TemplateModal({ template, onClose, onSave }: TemplateModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'promocional',
    asunto: '',
    contenido: ''
  });

  useEffect(() => {
    if (template) {
      setFormData({
        nombre: template.nombre,
        tipo: template.tipo,
        asunto: template.asunto,
        contenido: template.contenido
      });
    }
  }, [template]);

  const handleSave = () => {
    if (!formData.nombre || !formData.asunto || !formData.contenido) {
      alert('Todos los campos son obligatorios');
      return;
    }

    const variables = formData.contenido.match(/\{\{(\w+)\}\}/g) || [];
    const uniqueVariables = [...new Set(variables.map(v => v.replace(/[{}]/g, '')))];

    onSave({
      ...formData,
      variables: uniqueVariables,
      fechaCreacion: template?.fechaCreacion || new Date().toISOString(),
      activa: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="promocional">Promocional</option>
                  <option value="recordatorio">Recordatorio</option>
                  <option value="confirmacion">Confirmación</option>
                  <option value="cumpleanos">Cumpleaños</option>
                  <option value="seguimiento">Seguimiento</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asunto *
              </label>
              <input
                type="text"
                value={formData.asunto}
                onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Usa {{variables}} para personalizar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenido *
              </label>
              <textarea
                value={formData.contenido}
                onChange={(e) => setFormData({...formData, contenido: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 h-64"
                placeholder="Escribe el contenido. Usa {{variables}} como {{clienteName}}, {{servicioNombre}}, etc."
              />
              <div className="text-xs text-gray-500 mt-1">
                Variables: {{clienteName}}, {{servicioNombre}}, {{fecha}}, {{hora}}, {{salonName}}, {{salonPhone}}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {template ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}