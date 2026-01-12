import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Mail, Send, Plus, Trash2, Settings, Bot, FileText, AlertTriangle, Edit
} from 'lucide-react';
import { db } from '../db/db';
import { emailMarketingService } from '../services/emailMarketingService';
import { CampaignType, CampaignConfig, EmailTemplate } from '../types/email';
import { Link } from 'react-router-dom';

export default function EmailCampaignsPage() {
  // Live Data from Dexie
  const campaigns = useLiveQuery(() => db.campanas.orderBy('fechaCreacion').reverse().toArray());
  const templates = useLiveQuery(() => db.plantillas.toArray());
  const automations = useLiveQuery(() => db.automatizaciones.toArray());

  // FIX: Use JS filter to avoid "DataError: parameter is not a valid key" if index is quirky
  const clients = useLiveQuery(async () => {
    const all = await db.clientes.toArray();
    return all.filter(c => c.activo);
  });

  const settings = useLiveQuery(() => db.configuracion.get('settings'));

  const [activeTab, setActiveTab] = useState('campaigns');
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Simulation / Config State
  const isEmailConfigured = !!(settings?.emailConfig?.serviceId && settings?.emailConfig?.publicKey);

  // Form States
  const [formData, setFormData] = useState<{
    nombre: string;
    tipo: CampaignType;
    plantillaId: string;
    asunto: string;
    contenido?: string;
    filtroTipo: string;
  }>({
    nombre: '',
    tipo: 'promocion_general',
    plantillaId: '',
    asunto: '',
    contenido: '',
    filtroTipo: 'todos'
  });

  const [templateForm, setTemplateForm] = useState<{
    id?: string;
    nombre: string;
    tipo: string;
    asunto: string;
    contenido: string;
  }>({
    nombre: '',
    tipo: 'promocion_general',
    asunto: '',
    contenido: ''
  });

  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoForm, setAutoForm] = useState<{
    id?: string;
    nombre: string;
    trigger: string;
    dias?: number;
    horas?: number;
    plantillaId: string;
  }>({
    nombre: '',
    trigger: 'reactivacion',
    dias: 30,
    plantillaId: ''
  });

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // --- Campaign Handlers ---

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plantillaId) return alert('Selecciona una plantilla');

    try {
      const allClients = await db.clientes.toArray();
      let targetClients = allClients;

      // Filter logic
      if (formData.filtroTipo === 'activos') {
        targetClients = targetClients.filter(c => c.activo);
      } else if (formData.filtroTipo === 'nuevos') {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        targetClients = targetClients.filter(c => c.fechaRegistro && new Date(c.fechaRegistro) > date);
      } else if (formData.filtroTipo === 'seleccion_manual') {
        targetClients = targetClients.filter(c => selectedClientIds.includes(c.id));
        if (targetClients.length === 0) {
          return alert('Debes seleccionar al menos un cliente.');
        }
      }

      const config: CampaignConfig = {
        programarEnvio: false, // For now immediate
        enviarSoloActivos: true,
        incluirDescuentos: false,
        personalizarPorCliente: false
      };

      await emailMarketingService.createCampaign(
        formData.tipo,
        config,
        formData.plantillaId,
        formData.asunto,
        formData.contenido,
        targetClients // Pass specific clients
      );

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Error al crear campaña');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('¿Iniciar el envío de esta campaña?')) return;

    setIsSending(true);
    try {
      await emailMarketingService.sendCampaign(campaignId);
      alert('Campaña enviada / procesada correctamente.');
    } catch (error) {
      console.error(error);
      alert('Error en el envío');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('Eliminar campaña?')) {
      await db.campanas.delete(id);
    }
  };

  // --- Template Handlers ---

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTemplate: EmailTemplate = {
        id: templateForm.id || `tpl_${Date.now()}`,
        nombre: templateForm.nombre,
        tipo: templateForm.tipo as any,
        asunto: templateForm.asunto,
        contenidoHtml: templateForm.contenido,
        variables: ['NOMBRE', 'SALON_NOMBRE'], // Default vars
        fechaCreacion: new Date().toISOString(),
        activa: true,
        esPersonalizable: true,
        contenidoTexto: templateForm.contenido.replace(/<[^>]*>/g, '')
      };

      await emailMarketingService.saveTemplate(newTemplate);
      setShowTemplateModal(false);
      setTemplateForm({ nombre: '', tipo: 'promocion_general', asunto: '', contenido: '' });
      alert('Plantilla guardada');
    } catch (error) {
      console.error(error);
      alert('Error al guardar plantilla');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('¿Eliminar esta plantilla?')) {
      await db.plantillas.delete(id);
    }
  };

  const openEditTemplate = (tpl: EmailTemplate) => {
    setTemplateForm({
      id: tpl.id,
      nombre: tpl.nombre,
      tipo: tpl.tipo,
      asunto: tpl.asunto,
      contenido: tpl.contenidoHtml
    });
    setShowTemplateModal(true);
  };

  // --- Helpers ---
  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'promocion_general',
      plantillaId: '',
      asunto: '',
      contenido: '',
      filtroTipo: 'todos'
    });
    setSelectedClientIds([]);
  };

  // --- Automations ---
  // Initialize default automations if empty
  useEffect(() => {
    const initAutomations = async () => {
      const count = await db.automatizaciones.count();
      if (count === 0) {
        await db.automatizaciones.bulkAdd([
          {
            id: 'auto_cumple',
            nombre: 'Felicitación de Cumpleaños',
            activa: false,
            trigger: 'cumpleanos',
            plantillaId: '',
            condiciones: {},
            filtroClientes: 'todos'
          },
          {
            id: 'auto_bienvenida',
            nombre: 'Bienvenida a Nuevos Clientes',
            activa: false,
            trigger: 'registro_nuevo',
            plantillaId: '',
            condiciones: { dias: 0 },
            filtroClientes: 'todos'
          },
          {
            id: 'auto_cita',
            nombre: 'Recordatorio de Cita',
            activa: false,
            trigger: 'recordatorio_cita',
            plantillaId: '',
            condiciones: { horasAntes: 24 },
            filtroClientes: 'todos'
          }
        ]);
        console.log('Automatizaciones inicializadas');
      }
    };
    initAutomations();

    // Auto-check automations on load
    const runCheck = async () => {
      try {
        await emailMarketingService.checkAutomations();
      } catch (e) {
        console.error('Auto-check error:', e);
      }
    };
    runCheck();
  }, []);

  const toggleAutomation = async (id: string, currentState: boolean) => {
    await db.automatizaciones.update(id, { activa: !currentState });
  };

  const updateAutomationTemplate = async (id: string, templateId: string) => {
    await db.automatizaciones.update(id, { plantillaId: templateId });
  };

  const handleSaveAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    const condiciones: any = {};

    // Map form inputs to conditions object based on trigger
    if (autoForm.trigger === 'reactivacion') condiciones.diasSinVisita = Number(autoForm.dias) || 30;
    if (autoForm.trigger === 'post_visita') condiciones.diasDespues = Number(autoForm.dias) || 1;
    if (autoForm.trigger === 'recordatorio_cita') condiciones.horasAntes = Number(autoForm.horas) || 24;
    if (autoForm.trigger === 'registro_nuevo') condiciones.dias = 0;

    const rule = {
      id: autoForm.id || `auto_${Date.now()}`,
      nombre: autoForm.nombre,
      trigger: autoForm.trigger,
      plantillaId: autoForm.plantillaId,
      activa: true,
      condiciones,
      filtroClientes: 'todos'
    };

    // Fix: Cast to any to avoid strict type checks if db interface isn't fully updated in all contexts yet
    await db.automatizaciones.put(rule as any);

    setShowAutoModal(false);
    setAutoForm({ nombre: '', trigger: 'reactivacion', dias: 30, plantillaId: '' });
    alert('Automatización guardada');
  };

  const handleDeleteAutomation = async (id: string) => {
    if (['auto_cumple', 'auto_bienvenida', 'auto_cita'].includes(id)) {
      alert('No puedes eliminar las reglas por defecto del sistema. Puedes desactivarlas.');
      return;
    }
    if (confirm('¿Eliminar esta regla de automatización?')) {
      await db.automatizaciones.delete(id);
    }
  };

  // --- Render ---
  return (
    <div className="w-full max-w-none space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600 mt-1">Gestiona campañas y automatizaciones</p>
        </div>
        <Link to="/configuracion" className="text-purple-600 hover:text-purple-800 flex items-center gap-2">
          <Settings size={18} /> Configuración
        </Link>
      </div>

      {/* Warning Logic */}
      {!isEmailConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Modo Simulación Activo</h3>
            <p className="text-yellow-700 text-sm mt-1">
              No se ha configurado un proveedor de Email (EmailJS). El sistema simulará el envío de correos pero no llegarán a los destinatarios.
              Ve a <strong>Configuración</strong> para activar el envío real.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'campaigns', label: 'Campañas', icon: Mail },
            { id: 'templates', label: 'Plantillas', icon: FileText },
            { id: 'automations', label: 'Automatizaciones', icon: Bot }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <p className="text-sm text-gray-500">Total Campañas</p>
                <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <p className="text-sm text-gray-500">Emails Enviados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {campaigns?.reduce((acc, c) => acc + (c.estadisticas?.totalEnviados || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
            >
              <Plus size={20} /> Nueva Campaña
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Enviados</th>
                  <th className="p-4">Fecha Creación</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns?.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{c.nombre}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${c.estado === 'enviada' ? 'bg-green-100 text-green-800' :
                          c.estado === 'enviando' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                        {c.estado.toUpperCase()}
                      </span>
                      {c.estado === 'enviada' && !isEmailConfigured && (
                        <span className="ml-2 text-xs text-orange-500">(Simulado)</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {c.estadisticas?.totalEnviados || 0} / {c.destinatarios?.length || 0}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(c.fechaCreacion).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      {c.estado === 'borrador' && (
                        <button
                          onClick={() => handleSendCampaign(c.id)}
                          disabled={isSending}
                          className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded" title="Enviar"
                        >
                          <Send size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(c.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns?.length === 0 && (
              <div className="p-8 text-center text-gray-400">No hay campañas creadas</div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setTemplateForm({ nombre: '', tipo: 'promocional', asunto: '', contenido: '' });
                setShowTemplateModal(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
            >
              <Plus size={20} /> Nueva Plantilla
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates?.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative group">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-800">{t.nombre}</h3>
                  <div className="flex gap-2">
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">{t.tipo}</span>
                    <button onClick={() => openEditTemplate(t as any)} className="text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-2">{t.asunto}</p>
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-600 rounded max-h-24 overflow-hidden">
                  {(t.contenidoHtml || '').slice(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {automations?.map(auto => (
              <div key={auto.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{auto.nombre}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {auto.trigger === 'cumpleanos' && 'Se envía el día del cumpleaños del cliente.'}
                    {auto.trigger === 'registro_nuevo' && 'Se envía cuando se registra un nuevo cliente.'}
                    {auto.trigger === 'recordatorio_cita' && 'Se envía 24 horas antes de una cita confirmada.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <select
                    className="border rounded p-2 text-sm w-full sm:w-48"
                    value={auto.plantillaId}
                    onChange={(e) => updateAutomationTemplate(auto.id, e.target.value)}
                  >
                    <option value="">Seleccionar Plantilla...</option>
                    {templates?.filter(t =>
                      (auto.trigger === 'cumpleanos' && t.tipo === 'cumpleanos') ||
                      (auto.trigger === 'recordatorio_cita' && t.tipo === 'recordatorio_cita') ||
                      t.tipo === 'promocion_general' // Fallback
                    ).map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${auto.activa ? 'text-green-600' : 'text-gray-400'}`}>
                      {auto.activa ? 'Activada' : 'Desactivada'}
                    </span>
                    <button
                      onClick={() => toggleAutomation(auto.id, auto.activa)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${auto.activa ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${auto.activa ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                    <button
                      onClick={() => handleDeleteAutomation(auto.id)}
                      className="ml-2 text-red-400 hover:text-red-600"
                      title="Eliminar regla"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
            <Bot className="text-blue-600 mt-1" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900">¿Cómo funcionan?</h4>
              <p className="text-sm text-blue-800 mt-1">
                El sistema verifica automáticamente estas reglas cada día. Asegúrate de tener plantillas seleccionadas para cada regla activa.
              </p>
              <button
                onClick={async () => {
                  const result = await emailMarketingService.checkAutomations();
                  if (result) alert('Verificación completada. Se generarán las campañas correspondientes si existen coincidencias.');
                }}
                className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Ejecutar Verificación Manual
              </button>
              <button
                onClick={() => {
                  setShowAutoModal(true);
                  setAutoForm({ nombre: '', trigger: 'reactivacion', dias: 30, plantillaId: '' });
                }}
                className="mt-2 ml-2 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
              >
                + Nueva Regla
              </button>
              <button
                onClick={async () => {
                  if (confirm('¿Reiniciar reglas de automatización? Esto borrará las reglas actuales.')) {
                    await db.automatizaciones.clear();
                    location.reload();
                  }
                }}
                className="mt-2 ml-2 text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
              >
                Resetear Reglas
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Modal Nueva Campaña */}
      {
        showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Nueva Campaña de Email</h2>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                {/* Form fields same as before... */}
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="promocion_general">Promocional General</option>
                    <option value="recordatorio">Recordatorio</option>
                    <option value="cumpleanos">Cumpleaños</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Plantilla</label>
                  <select
                    value={formData.plantillaId}
                    onChange={e => {
                      const t = templates?.find(t => t.id === e.target.value);
                      setFormData({
                        ...formData,
                        plantillaId: e.target.value,
                        asunto: t?.asunto || ''
                      });
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Selecciona plantilla...</option>
                    {templates?.filter(t => t.tipo === formData.tipo || t.tipo === 'promocion_general').map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Asunto</label>
                  <input
                    type="text"
                    value={formData.asunto}
                    onChange={e => setFormData({ ...formData, asunto: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Filtro Clientes</label>
                  <select
                    value={formData.filtroTipo}
                    onChange={e => setFormData({ ...formData, filtroTipo: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="todos">Todos los clientes</option>
                    <option value="activos">Solo activos</option>
                    <option value="nuevos">Registrados últimos 30 días</option>
                    <option value="seleccion_manual">Selección Manual</option>
                  </select>

                  {formData.filtroTipo === 'seleccion_manual' && (
                    <div className="mt-4 border rounded p-4 bg-gray-50 max-h-60 overflow-y-auto">
                      <p className="text-sm font-medium mb-2 text-gray-700">Selecciona los destinatarios:</p>
                      <div className="space-y-2">
                        {clients?.length === 0 && <p className="text-sm text-gray-400">No hay clientes activos disponibles.</p>}
                        {clients?.map(client => (
                          <div key={client.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={selectedClientIds.includes(client.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClientIds(prev => [...prev, client.id]);
                                } else {
                                  setSelectedClientIds(prev => prev.filter(id => id !== client.id));
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700">{client.nombre} ({client.email})</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs text-gray-500">{selectedClientIds.length} clientes seleccionados</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 p-2 border rounded hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Crear Borrador
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Modal Nueva/Editar Plantilla */}
      {
        showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{templateForm.id ? 'Editar Plantilla' : 'Nueva Plantilla'}</h2>
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre (Interno)</label>
                  <input
                    required
                    className="w-full border rounded p-2"
                    value={templateForm.nombre}
                    onChange={e => setTemplateForm({ ...templateForm, nombre: e.target.value })}
                    placeholder="Ej: Promo Verano 2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select
                      className="w-full border rounded p-2"
                      value={templateForm.tipo}
                      onChange={e => setTemplateForm({ ...templateForm, tipo: e.target.value })}
                    >
                      <option value="promocion_general">Promocional General</option>
                      <option value="recordatorio">Recordatorio</option>
                      <option value="cumpleanos">Cumpleaños</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Asunto del Correo</label>
                    <input
                      required
                      className="w-full border rounded p-2"
                      value={templateForm.asunto}
                      onChange={e => setTemplateForm({ ...templateForm, asunto: e.target.value })}
                      placeholder="Ej: ¡Oferta especial para ti!"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contenido HTML</label>
                  <div className="text-xs text-gray-500 mb-1">Variables disponibles: {"{{NOMBRE}}"}, {"{{SALON_NOMBRE}}"}</div>
                  <textarea
                    required
                    rows={8}
                    className="w-full border rounded p-2 font-mono text-sm"
                    value={templateForm.contenido}
                    onChange={e => setTemplateForm({ ...templateForm, contenido: e.target.value })}
                    placeholder="<code>Hola {{NOMBRE}}, ...</code>"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setShowTemplateModal(false)} className="flex-1 p-2 border rounded">Cancelar</button>
                  <button type="submit" className="flex-1 p-2 bg-purple-600 text-white rounded">Guardar Plantilla</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
      {/* Modal Nueva Automatización */}
      {
        showAutoModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Nueva Regla de Automatización</h2>
              <form onSubmit={handleSaveAutomation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre de la Regla</label>
                  <input
                    required
                    className="w-full border rounded p-2"
                    value={autoForm.nombre}
                    onChange={e => setAutoForm({ ...autoForm, nombre: e.target.value })}
                    placeholder="Ej: Recuperación Clientes 60 días"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Disparador (Trigger)</label>
                  <select
                    className="w-full border rounded p-2"
                    value={autoForm.trigger}
                    onChange={e => setAutoForm({ ...autoForm, trigger: e.target.value })}
                  >
                    <option value="reactivacion">Cliente Inactivo (Reactivación)</option>
                    <option value="post_visita">Seguimiento Post-Visita</option>
                    <option value="recordatorio_cita">Recordatorio Cita (Personalizado)</option>
                    <option value="cumpleanos">Cumpleaños</option>
                    <option value="registro_nuevo">Nuevo Cliente</option>
                  </select>
                </div>

                {/* Dynamic Conditions */}
                {autoForm.trigger === 'reactivacion' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Días sin visita</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded p-2"
                      value={autoForm.dias || 30}
                      onChange={e => setAutoForm({ ...autoForm, dias: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Se enviará si el cliente no ha venido en estos días.</p>
                  </div>
                )}

                {autoForm.trigger === 'post_visita' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Días después de la visita</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded p-2"
                      value={autoForm.dias || 1}
                      onChange={e => setAutoForm({ ...autoForm, dias: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ej: 1 día después para pedir reseña.</p>
                  </div>
                )}

                {autoForm.trigger === 'recordatorio_cita' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Horas antes de la cita</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded p-2"
                      value={autoForm.horas || 2}
                      onChange={e => setAutoForm({ ...autoForm, horas: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Plantilla a enviar</label>
                  <select
                    required
                    className="w-full border rounded p-2"
                    value={autoForm.plantillaId}
                    onChange={e => setAutoForm({ ...autoForm, plantillaId: e.target.value })}
                  >
                    <option value="">Selecciona una plantilla...</option>
                    {templates?.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setShowAutoModal(false)} className="flex-1 p-2 border rounded">Cancelar</button>
                  <button type="submit" className="flex-1 p-2 bg-purple-600 text-white rounded">Guardar Regla</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}