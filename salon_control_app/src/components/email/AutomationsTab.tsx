// src/components/email/AutomationsTab.tsx
import { useState, useEffect } from 'react';
import { Bot, Plus, Play, Pause, Edit, Trash2 } from 'lucide-react';
import AutomationModal from './AutomationModal';

interface AutomationRule {
  id: string;
  nombre: string;
  activa: boolean;
  trigger: 'cita_creada' | 'cita_confirmada' | 'cumpleanos' | 'cliente_nuevo' | 'cita_completada';
  plantillaId: string;
  condiciones: {
    diasAntes?: number;
    tipoServicio?: string[];
    horaEnvio?: string;
  };
  filtroClientes: 'todos' | 'activos' | 'nuevos';
}

export default function AutomationsTab() {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRule | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const automationsData = JSON.parse(localStorage.getItem('emailAutomations') || '[]');
    const templatesData = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
    
    setAutomations(automationsData);
    setTemplates(templatesData);
  };

  const saveAutomation = (automation: AutomationRule) => {
    const updatedAutomations = editingAutomation
      ? automations.map(a => a.id === editingAutomation.id ? automation : a)
      : [...automations, { ...automation, id: `auto_${Date.now()}` }];

    setAutomations(updatedAutomations);
    localStorage.setItem('emailAutomations', JSON.stringify(updatedAutomations));
  };

  const toggleAutomation = (automationId: string) => {
    const updatedAutomations = automations.map(a =>
      a.id === automationId ? { ...a, activa: !a.activa } : a
    );
    setAutomations(updatedAutomations);
    localStorage.setItem('emailAutomations', JSON.stringify(updatedAutomations));
  };

  const deleteAutomation = (automationId: string) => {
    if (!confirm('¿Eliminar esta automatización?')) return;
    
    const updatedAutomations = automations.filter(a => a.id !== automationId);
    setAutomations(updatedAutomations);
    localStorage.setItem('emailAutomations', JSON.stringify(updatedAutomations));
  };

  const editAutomation = (automation: AutomationRule) => {
    setEditingAutomation(automation);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAutomation(null);
  };

  const getTriggerLabel = (trigger: AutomationRule['trigger']) => {
    const triggers = {
      cita_creada: 'Cita creada',
      cita_confirmada: 'Cita confirmada',
      cumpleanos: 'Cumpleaños del cliente',
      cliente_nuevo: 'Cliente nuevo',
      cita_completada: 'Cita completada'
    };
    return triggers[trigger];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Automatización
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {automations.length === 0 ? (
          <div className="p-8 text-center">
            <Bot size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay automatizaciones configuradas
            </h3>
            <p className="text-gray-600 mb-4">
              Configura reglas automáticas para enviar emails
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Crear primera automatización
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Automatización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trigger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plantilla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {automations.map((automation) => {
                  const template = templates.find(t => t.id === automation.plantillaId);
                  return (
                    <tr key={automation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{automation.nombre}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {getTriggerLabel(automation.trigger)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {template?.nombre || 'Plantilla no encontrada'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          automation.activa 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {automation.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAutomation(automation.id)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title={automation.activa ? 'Desactivar' : 'Activar'}
                          >
                            {automation.activa ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <button
                            onClick={() => editAutomation(automation)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteAutomation(automation.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de automatización */}
      {showModal && (
        <AutomationModal
          automation={editingAutomation}
          templates={templates}
          onClose={handleModalClose}
          onSave={(automation) => {
            saveAutomation(automation);
            handleModalClose();
          }}
        />
      )}
    </div>
  );
}