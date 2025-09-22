// src/components/email/TemplatesTab.tsx
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import TemplateModal from './TemplateModal';

interface EmailTemplate {
  id: string;
  nombre: string;
  tipo: 'promocional' | 'recordatorio' | 'confirmacion' | 'cumpleanos' | 'seguimiento';
  asunto: string;
  contenido: string;
  variables: string[];
  fechaCreacion: string;
  activa: boolean;
}

const PLANTILLAS_INICIALES: EmailTemplate[] = [
  {
    id: 'tpl_recordatorio_1',
    nombre: 'Recordatorio Básico',
    tipo: 'recordatorio',
    asunto: '⏰ Recordatorio: Tu cita es mañana - {{clienteName}}',
    contenido: `Hola {{clienteName}},

Este es un recordatorio de que tienes una cita programada para mañana:

📅 Servicio: {{servicioNombre}}
🕐 Fecha: {{fecha}}
⌚ Hora: {{hora}}

💡 Recomendaciones:
• Llega 10 minutos antes
• Trae una foto de referencia si deseas un look específico
• Si necesitas cancelar, hazlo con 24h de anticipación

¡Te esperamos!`,
    variables: ['clienteName', 'servicioNombre', 'fecha', 'hora'],
    fechaCreacion: new Date().toISOString(),
    activa: true
  },
  {
    id: 'tpl_cumpleanos_1',
    nombre: 'Felicitación de Cumpleaños',
    tipo: 'cumpleanos',
    asunto: '🎂 ¡Feliz Cumpleaños {{clienteName}}! Tenemos un regalo para ti',
    contenido: `¡Querida {{clienteName}}!

En tu día especial queremos celebrar contigo 🎉

🎁 REGALO DE CUMPLEAÑOS:
Disfruta de un 20% de descuento en cualquiera de nuestros servicios durante todo tu mes de cumpleaños.

✨ Válido para:
• Cortes y peinados
• Tratamientos capilares
• Coloración
• Manicure y pedicure

¡Ven a celebrar con nosotros y luce espectacular en tu mes especial!

Llama al {{salonPhone}} para reservar tu cita.`,
    variables: ['clienteName', 'salonPhone'],
    fechaCreacion: new Date().toISOString(),
    activa: true
  },
  {
    id: 'tpl_promocional_1',
    nombre: 'Promoción Estacional',
    tipo: 'promocional',
    asunto: '🌟 Oferta especial para ti {{clienteName}} - ¡Solo por tiempo limitado!',
    contenido: `Hola {{clienteName}},

¡Tenemos una oferta especial pensada especialmente para ti!

✨ PROMOCIÓN ESPECIAL ✨
{{servicioNombre}}

🎯 Beneficios de esta promoción:
• Precio especial por tiempo limitado
• Productos incluidos
• Atención personalizada

⏰ OFERTA VÁLIDA HASTA: {{fechaVencimiento}}

No dejes pasar esta oportunidad de consentirte.

Reserva ahora llamando al {{salonPhone}}`,
    variables: ['clienteName', 'servicioNombre', 'fechaVencimiento', 'salonPhone'],
    fechaCreacion: new Date().toISOString(),
    activa: true
  }
];

export default function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const templatesData = JSON.parse(
      localStorage.getItem('emailTemplates') || 
      JSON.stringify(PLANTILLAS_INICIALES)
    );
    setTemplates(templatesData);
  };

  const saveTemplate = (template: EmailTemplate) => {
    const updatedTemplates = editingTemplate
      ? templates.map(t => t.id === editingTemplate.id ? template : t)
      : [...templates, { ...template, id: `tpl_${Date.now()}` }];

    setTemplates(updatedTemplates);
    localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
  };

  const deleteTemplate = (templateId: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
  };

  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const getTipoLabel = (tipo: EmailTemplate['tipo']) => {
    const tipos = {
      recordatorio: 'Recordatorio',
      confirmacion: 'Confirmación',
      promocional: 'Promocional',
      cumpleanos: 'Cumpleaños',
      seguimiento: 'Seguimiento'
    };
    return tipos[tipo];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Plantilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-gray-900">{template.nombre}</h3>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {getTipoLabel(template.tipo)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editTemplate(template)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <strong>Asunto:</strong> {template.asunto}
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <strong>Variables:</strong> {template.variables.join(', ')}
            </div>
            
            <div className="text-xs text-gray-500">
              Creada: {new Date(template.fechaCreacion).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de plantilla */}
      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={handleModalClose}
          onSave={(template) => {
            saveTemplate(template);
            handleModalClose();
          }}
        />
      )}
    </div>
  );
}