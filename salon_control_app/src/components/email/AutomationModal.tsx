// src/components/email/AutomationModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AutomationModalProps {
  automation?: any;
  templates: any[];
  onClose: () => void;
  onSave: (automation: any) => void;
}

export default function AutomationModal({ 
  automation, 
  templates, 
  onClose, 
  onSave 
}: AutomationModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    trigger: 'cita_creada',
    plantillaId: '',
    diasAntes: 1,
    horaEnvio: '10:00',
    filtroClientes: 'todos'
  });

  useEffect(() => {
    if (automation) {
      setFormData({
        nombre: automation.nombre,
        trigger: automation.trigger,
        plantillaId: automation.plantillaId,
        diasAntes: automation.condiciones.diasAntes || 1,
        horaEnvio: automation.condiciones.horaEnvio || '10:00',
        filtroClientes: automation.filtroClientes
      });
    }
  }, [automation]);

  const handleSave = () => {
    if (!formData.nombre || !formData.plantillaId) {
      alert('Nombre y plantilla son obligatorios');
      return;
    }

    onSave({
      ...formData,
      activa: true,
      condiciones: {
        diasAntes: formData.diasAntes,
        horaEnvio: formData.horaEnvio
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {automation ? 'Editar' : 'Nueva'} Automatización
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la automatización *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Recordatorio automático de citas"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disparador *
              </label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({...formData, trigger: e.target.value as any})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="cita_creada">Cuando se crea una cita</option>
                <option value="cita_confirmada">Cuando se confirma una cita</option>
                <option value="cumpleanos">En el cumpleaños del cliente</option>
                <option value="cliente_nuevo">Cliente nuevo registrado</option>
                <option value="cita_completada">Cita completada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plantilla a usar *
              </label>
              <select
                value={formData.plantillaId}
                onChange={(e) => setFormData({...formData, plantillaId: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Seleccionar plantilla</option>
                {templates.filter(t => t.activa).map(template => (
                  <option key={template.id} value={template.id}>
                    {template.nombre} ({template.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Días antes/después
                </label>
                <input
                  type="number"
                  value={formData.diasAntes}
                  onChange={(e) => setFormData({...formData, diasAntes: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2"
                  min="-30"
                  max="30"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Positivo = antes del evento, Negativo = después del evento
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de envío
                </label>
                <input
                  type="time"
                  value={formData.horaEnvio}
                  onChange={(e) => setFormData({...formData, horaEnvio: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aplicar a
              </label>
              <select
                value={formData.filtroClientes}
                onChange={(e) => setFormData({...formData, filtroClientes: e.target.value as any})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="todos">Todos los clientes</option>
                <option value="activos">Solo clientes activos</option>
                <option value="nuevos">Solo clientes nuevos</option>
              </select>
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
              disabled={!formData.nombre || !formData.plantillaId}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
            >
              {automation ? 'Actualizar' : 'Crear'} Automatización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}