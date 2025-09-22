// src/components/email/TemplatesTab.tsx - Sección de plantillas corregida
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Edit, Trash2, Eye, Gift, Mail, Calendar, Users } from 'lucide-react';

interface Template {
  id: string;
  nombre: string;
  tipo: string;
  asunto: string;
  contenido?: string;
  activa: boolean;
  fechaCreacion: string;
}

const TemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const templatesData = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      console.log('Plantillas cargadas:', templatesData.length);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      setTemplates([]);
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'cumpleanos': return Gift;
      case 'promocional': return Mail;
      case 'recordatorio': return Calendar;
      case 'seguimiento': return Users;
      default: return FileText;
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'cumpleanos': return 'text-pink-600 bg-pink-100';
      case 'promocional': return 'text-purple-600 bg-purple-100';
      case 'recordatorio': return 'text-blue-600 bg-blue-100';
      case 'seguimiento': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'cumpleanos': return 'Cumpleaños';
      case 'promocional': return 'Promocional';
      case 'recordatorio': return 'Recordatorio';
      case 'seguimiento': return 'Seguimiento';
      default: return tipo;
    }
  };

  const handleDeleteTemplate = (template: Template) => {
    if (confirm(`¿Estás seguro de eliminar la plantilla "${template.nombre}"?`)) {
      try {
        const updatedTemplates = templates.filter(t => t.id !== template.id);
        localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
        setTemplates(updatedTemplates);
        alert('Plantilla eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando plantilla:', error);
        alert('Error al eliminar la plantilla');
      }
    }
  };

  const handleToggleActive = (template: Template) => {
    try {
      const updatedTemplates = templates.map(t => 
        t.id === template.id ? { ...t, activa: !t.activa } : t
      );
      localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error actualizando plantilla:', error);
    }
  };

  const createDefaultTemplates = () => {
    const defaultTemplates: Template[] = [
      {
        id: `tpl_${Date.now()}_1`,
        nombre: 'Promoción General',
        tipo: 'promocional',
        asunto: '🎉 Oferta especial para {{NOMBRE}} - ¡Solo por tiempo limitado!',
        contenido: 'Hola {{NOMBRE}}, tenemos una oferta especial para ti...',
        activa: true,
        fechaCreacion: new Date().toISOString()
      },
      {
        id: `tpl_${Date.now()}_2`,
        nombre: 'Feliz Cumpleaños',
        tipo: 'cumpleanos',
        asunto: '🎂 ¡Feliz Cumpleaños {{NOMBRE}}! Tenemos un regalo para ti',
        contenido: 'Querida {{NOMBRE}}, en tu día especial queremos celebrarte...',
        activa: true,
        fechaCreacion: new Date().toISOString()
      },
      {
        id: `tpl_${Date.now()}_3`,
        nombre: 'Recordatorio de Cita',
        tipo: 'recordatorio',
        asunto: '⏰ Recordatorio: Tu cita es mañana - {{NOMBRE}}',
        contenido: 'Hola {{NOMBRE}}, te recordamos que tienes una cita programada...',
        activa: true,
        fechaCreacion: new Date().toISOString()
      },
      {
        id: `tpl_${Date.now()}_4`,
        nombre: 'Seguimiento Post-Servicio',
        tipo: 'seguimiento',
        asunto: '💫 ¿Cómo te sientes con tu nuevo look? - {{NOMBRE}}',
        contenido: 'Hola {{NOMBRE}}, esperamos que estés disfrutando tu nuevo look...',
        activa: true,
        fechaCreacion: new Date().toISOString()
      }
    ];

    try {
      localStorage.setItem('emailTemplates', JSON.stringify(defaultTemplates));
      setTemplates(defaultTemplates);
      alert(`Se han creado ${defaultTemplates.length} plantillas por defecto`);
    } catch (error) {
      console.error('Error creando plantillas por defecto:', error);
      alert('Error al crear plantillas por defecto');
    }
  };

  const stats = {
    total: templates.length,
    activas: templates.filter(t => t.activa).length,
    promocionales: templates.filter(t => t.tipo === 'promocional').length,
    cumpleanos: templates.filter(t => t.tipo === 'cumpleanos').length
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plantillas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-green-600">{stats.activas}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 rounded-full border-2 border-green-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promocionales</p>
              <p className="text-2xl font-bold text-purple-600">{stats.promocionales}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cumpleaños</p>
              <p className="text-2xl font-bold text-pink-600">{stats.cumpleanos}</p>
            </div>
            <div className="p-2 bg-pink-100 rounded-lg">
              <Gift size={24} className="text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between items-center">
        <div>
          {templates.length === 0 && (
            <button
              onClick={createDefaultTemplates}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Crear Plantillas por Defecto
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          Nueva Plantilla
        </button>
      </div>

      {/* Lista de plantillas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay plantillas creadas
            </h3>
            <p className="text-gray-600 mb-4">
              Las plantillas te ayudan a crear campañas de email más rápido y consistente
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={createDefaultTemplates}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Crear Plantillas por Defecto
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={20} />
                Crear Primera Plantilla
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {templates.map(template => {
              const TypeIcon = getTypeIcon(template.tipo);
              return (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getTypeColor(template.tipo)}`}>
                        <TypeIcon size={16} />
                      </div>
                      <h4 className="font-medium text-gray-900">{template.nombre}</h4>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={`w-8 h-4 rounded-full transition-colors ${
                          template.activa ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={template.activa ? 'Desactivar' : 'Activar'}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          template.activa ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(template.tipo)}`}>
                        {getTypeLabel(template.tipo)}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600"><strong>Asunto:</strong></p>
                      <p className="text-sm text-gray-900 truncate">{template.asunto}</p>
                    </div>

                    {template.contenido && (
                      <div>
                        <p className="text-sm text-gray-600"><strong>Contenido:</strong></p>
                        <p className="text-sm text-gray-900 line-clamp-3">{template.contenido}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    Creada: {new Date(template.fechaCreacion).toLocaleDateString('es-ES')}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert('Vista previa en desarrollo...')}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Vista previa"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowCreateModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de creación/edición (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h3>
              <p className="text-gray-600 mb-4">
                La creación/edición de plantillas estará disponible próximamente.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;