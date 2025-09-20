// src/pages/EmailCampaignsPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp, 
  Settings,
  Eye,
  Trash2,
  BarChart3,
  Gift,
  Heart,
  TreePine,
  Sparkles,
  TestTube,
  Save
} from 'lucide-react';
import { EmailCampaign, CampaignType } from '../types/email';
import { Cliente } from '../types/clientes';
import { useEmailCampaigns } from '../hooks/useEmailCampaigns';
import { useEmailTemplates } from '../hooks/useEmailTemplates';
import { useEmailConfiguration } from '../hooks/useEmailConfiguration';

export default function EmailCampaignsPage() {
  const { campaigns, isLoading, createCampaign, cancelCampaign, getStats } = useEmailCampaigns();
  const { generatePreview, previewContent, clearPreview } = useEmailTemplates();
  const { salonInfo, updateSalonInfo, configureEmailJS, configureResend, testConfiguration, getProviderStatus } = useEmailConfiguration();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'stats' | 'config'>('campaigns');

  // Estados para crear campaña
  const [campaignType, setCampaignType] = useState<CampaignType>('promocion_general');
  const [includeDiscount, setIncludeDiscount] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState(15);
  const [validityDays, setValidityDays] = useState(30);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [customSubject, setCustomSubject] = useState('');
  const [onlyActiveClients, setOnlyActiveClients] = useState(true);

  // Estados para configuración
  const [emailJSConfig, setEmailJSConfig] = useState({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });
  const [resendConfig, setResendConfig] = useState({
    apiKey: '',
    from: ''
  });
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    setClientes(clientesData);
  };

  const getCampaignIcon = (tipo: CampaignType) => {
    switch (tipo) {
      case 'cumpleanos': return <Gift className="text-pink-600" size={20} />;
      case 'san_valentin': return <Heart className="text-red-600" size={20} />;
      case 'navidad': return <TreePine className="text-green-600" size={20} />;
      case 'promocion_general': return <Sparkles className="text-purple-600" size={20} />;
      default: return <Mail className="text-blue-600" size={20} />;
    }
  };

  const getCampaignTypeLabel = (tipo: CampaignType) => {
    const labels = {
      cumpleanos: 'Cumpleaños',
      san_valentin: 'San Valentín',
      dia_madre: 'Día de la Madre',
      navidad: 'Navidad',
      año_nuevo: 'Año Nuevo',
      promocion_general: 'Promoción General',
      recordatorio_cita: 'Recordatorio',
      reactivacion_cliente: 'Reactivación',
      personalizado: 'Personalizado'
    };
    return labels[tipo] || tipo;
  };

  const getStatusColor = (estado: EmailCampaign['estado']) => {
    switch (estado) {
      case 'borrador': return 'bg-gray-100 text-gray-800';
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'enviada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const clientesFiltrados = onlyActiveClients ? clientes.filter(c => c.activo) : clientes;
      
      const config = {
        programarEnvio: !!scheduleDate,
        fechaProgramada: scheduleDate || undefined,
        horaProgramada: scheduleTime,
        enviarSoloActivos: onlyActiveClients,
        incluirDescuentos: includeDiscount,
        porcentajeDescuento: includeDiscount ? discountPercentage : undefined,
        validezDescuento: includeDiscount ? getValidityDate(validityDays) : undefined,
        personalizarPorCliente: true
      };

      await createCampaign(
        campaignType,
        config,
        clientesFiltrados,
        customSubject || undefined
      );

      setShowCreateModal(false);
      resetForm();
      alert('Campaña creada exitosamente!');
    } catch (error) {
      console.error('Error creando campaña:', error);
      alert('Error al crear la campaña');
    }
  };

  const resetForm = () => {
    setCampaignType('promocion_general');
    setIncludeDiscount(true);
    setDiscountPercentage(15);
    setValidityDays(30);
    setScheduleDate('');
    setScheduleTime('09:00');
    setCustomSubject('');
    setOnlyActiveClients(true);
  };

  const getValidityDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('es-ES');
  };

  const handlePreview = (tipo: CampaignType) => {
    const preview = generatePreview(tipo);
    if (preview) {
      setShowPreviewModal(true);
    }
  };

  const handleCancelCampaign = (campaignId: string) => {
    if (confirm('¿Estás seguro de que quieres cancelar esta campaña?')) {
      cancelCampaign(campaignId);
    }
  };

  const handleTestProvider = async (provider: string) => {
    setTesting(provider);
    try {
      await testConfiguration(provider);
      alert(`Configuración de ${provider} probada exitosamente`);
    } catch (error) {
      alert(`Error probando ${provider}`);
    } finally {
      setTesting(null);
    }
  };

  const handleSaveEmailJS = () => {
    configureEmailJS(emailJSConfig);
    alert('Configuración de EmailJS guardada');
  };

  const handleSaveResend = () => {
    configureResend(resendConfig);
    alert('Configuración de Resend guardada');
  };

  const stats = getStats();
  const providerStatus = getProviderStatus();

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Email Marketing
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona campañas de email para tus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const campaign = await createCampaign('cumpleanos', {
                  programarEnvio: false,
                  enviarSoloActivos: true,
                  incluirDescuentos: true,
                  porcentajeDescuento: 15,
                  validezDescuento: getValidityDate(30),
                  personalizarPorCliente: true
                }, clientes.filter(c => c.activo && c.email));
                
                if (campaign) {
                  alert('Campaña de cumpleaños creada!');
                } else {
                  alert('No hay cumpleañeros para mañana');
                }
              } catch (error) {
                alert('Error al crear campaña de cumpleaños');
              }
            }}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors duration-200 flex items-center gap-2"
          >
            <Gift size={20} />
            <span>Auto Cumpleaños</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Nueva Campaña</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campañas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
            </div>
            <Mail size={24} className="text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enviadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.sentCampaigns}</p>
            </div>
            <TrendingUp size={24} className="text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emails Enviados</p>
              <p className="text-2xl font-bold text-blue-600">{stats.sentEmails}</p>
            </div>
            <Users size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.successRate.toFixed(1)}%</p>
            </div>
            <BarChart3 size={24} className="text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'campaigns', label: 'Campañas', icon: Mail },
              { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
              { id: 'config', label: 'Configuración', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
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

        <div className="p-6">
          {activeTab === 'campaigns' && (
            <div>
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay campañas creadas
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crea tu primera campaña de email marketing
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCampaignIcon(campaign.tipo)}
                          <div>
                            <h3 className="font-semibold text-gray-900">{campaign.nombre}</h3>
                            <p className="text-sm text-gray-600">
                              {getCampaignTypeLabel(campaign.tipo)} • {campaign.destinatarios.length} destinatarios
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.estado)}`}>
                            {campaign.estado.charAt(0).toUpperCase() + campaign.estado.slice(1)}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handlePreview(campaign.tipo)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Vista previa"
                            >
                              <Eye size={16} />
                            </button>
                            {campaign.estado === 'programada' && (
                              <button
                                onClick={() => handleCancelCampaign(campaign.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Cancelar"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {campaign.estadisticas && campaign.estado === 'enviada' && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Enviados:</span>
                            <span className="ml-2 font-medium">{campaign.estadisticas.totalEnviados}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Fallidos:</span>
                            <span className="ml-2 font-medium text-red-600">{campaign.estadisticas.totalFallidos}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Abiertos:</span>
                            <span className="ml-2 font-medium text-green-600">{campaign.estadisticas.totalAbiertos}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Clicks:</span>
                            <span className="ml-2 font-medium text-blue-600">{campaign.estadisticas.totalClicks}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Resumen General</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Campañas totales:</span>
                    <span className="font-medium">{stats.totalCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Campañas enviadas:</span>
                    <span className="font-medium">{stats.sentCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Emails enviados:</span>
                    <span className="font-medium">{stats.sentEmails}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Tasa de éxito:</span>
                    <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Estado de Proveedores</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>EmailJS:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      providerStatus.emailjs ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {providerStatus.emailjs ? 'Configurado' : 'No configurado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Resend:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      providerStatus.resend ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {providerStatus.resend ? 'Configurado' : 'No configurado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Configuración de Proveedores de Email</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> Para usar el envío real de emails, configura al menos uno de los proveedores.
                    Sin configuración, los emails se simularán (útil para desarrollo).
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* EmailJS Configuration */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Mail size={16} />
                      EmailJS (Gratis)
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Service ID"
                        value={emailJSConfig.serviceId}
                        onChange={(e) => setEmailJSConfig(prev => ({ ...prev, serviceId: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Template ID"
                        value={emailJSConfig.templateId}
                        onChange={(e) => setEmailJSConfig(prev => ({ ...prev, templateId: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Public Key"
                        value={emailJSConfig.publicKey}
                        onChange={(e) => setEmailJSConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEmailJS}
                          className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <Save size={16} />
                          Guardar
                        </button>
                        <button
                          onClick={() => handleTestProvider('emailjs')}
                          disabled={testing === 'emailjs'}
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50 flex items-center gap-2"
                        >
                          <TestTube size={16} />
                          {testing === 'emailjs' ? 'Probando...' : 'Test'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Resend Configuration */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Mail size={16} />
                      Resend (Profesional)
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="API Key"
                        value={resendConfig.apiKey}
                        onChange={(e) => setResendConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="email"
                        placeholder="From Email (ej: hola@tusalon.com)"
                        value={resendConfig.from}
                        onChange={(e) => setResendConfig(prev => ({ ...prev, from: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveResend}
                          className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <Save size={16} />
                          Guardar
                        </button>
                        <button
                          onClick={() => handleTestProvider('resend')}
                          disabled={testing === 'resend'}
                          className="px-4 py-2 border border-green-600 text-green-600 rounded text-sm hover:bg-green-50 flex items-center gap-2"
                        >
                          <TestTube size={16} />
                          {testing === 'resend' ? 'Probando...' : 'Test'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Información del Salón</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre del salón"
                    value={salonInfo.nombre}
                    onChange={(e) => updateSalonInfo({ nombre: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={salonInfo.telefono}
                    onChange={(e) => updateSalonInfo({ telefono: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="email"
                    placeholder="Email del salón"
                    value={salonInfo.email}
                    onChange={(e) => updateSalonInfo({ email: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Dirección"
                    value={salonInfo.direccion}
                    onChange={(e) => updateSalonInfo({ direccion: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Campaña */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nueva Campaña de Email</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Tipo de Campaña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Campaña
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { type: 'cumpleanos', label: 'Cumpleaños', icon: '🎂' },
                      { type: 'san_valentin', label: 'San Valentín', icon: '💕' },
                      { type: 'dia_madre', label: 'Día de la Madre', icon: '👩' },
                      { type: 'navidad', label: 'Navidad', icon: '🎄' },
                      { type: 'año_nuevo', label: 'Año Nuevo', icon: '🎊' },
                      { type: 'promocion_general', label: 'Promoción', icon: '✨' }
                    ].map(option => (
                      <button
                        key={option.type}
                        onClick={() => setCampaignType(option.type as CampaignType)}
                        className={`p-3 rounded-lg border text-sm flex flex-col items-center gap-2 ${
                          campaignType === option.type
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descuento */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={includeDiscount}
                      onChange={(e) => setIncludeDiscount(e.target.checked)}
                      className="h-4 w-4 text-purple-600"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Incluir descuento especial
                    </label>
                  </div>
                  {includeDiscount && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Porcentaje de descuento
                        </label>
                        <select
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                          className="w-full border rounded px-3 py-2"
                        >
                          {[5, 10, 15, 20, 25, 30, 35, 40, 50].map(percent => (
                            <option key={percent} value={percent}>{percent}%</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Validez (días)
                        </label>
                        <select
                          value={validityDays}
                          onChange={(e) => setValidityDays(Number(e.target.value))}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value={7}>7 días</option>
                          <option value={15}>15 días</option>
                          <option value={30}>30 días</option>
                          <option value={60}>60 días</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vista previa */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Vista previa</span>
                    <button
                      onClick={() => handlePreview(campaignType)}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                    >
                      <Eye size={16} />
                      Ver completa
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Destinatarios: {clientes.filter(c => !onlyActiveClients || c.activo).filter(c => c.email).length} clientes con email
                  </p>
                  {includeDiscount && (
                    <p className="text-sm text-green-600">
                      Descuento: {discountPercentage}% válido por {validityDays} días
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white`}
                >
                  {isLoading ? 'Creando...' : 'Crear Campaña'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {showPreviewModal && previewContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Vista Previa del Email</h2>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    clearPreview();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="p-4 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewContent.html }}
                />
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    clearPreview();
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
}// src/pages/EmailCampaignsPage.tsx
import React from 'react';
import { Mail, Plus, Settings, BarChart3 } from 'lucide-react';

export default function EmailCampaignsPage() {
  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Email Marketing
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona campañas de email para tus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors duration-200 flex items-center gap-2"
            onClick={() => alert('Función de cumpleaños automático - próximamente')}
          >
            <Mail size={20} />
            <span>Auto Cumpleaños</span>
          </button>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
            onClick={() => alert('Crear nueva campaña - próximamente')}
          >
            <Plus size={20} />
            <span>Nueva Campaña</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campañas</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Mail size={24} className="text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enviadas</p>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
            <BarChart3 size={24} className="text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emails Enviados</p>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
            <Mail size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-indigo-600">0%</p>
            </div>
            <BarChart3 size={24} className="text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-white rounded-lg shadow border p-8">
        <div className="text-center">
          <Mail size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sistema de Email Marketing
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Envía campañas personalizadas de cumpleaños, promociones especiales y fechas importantes a tus clientes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl mb-2">🎂</div>
              <h4 className="font-medium text-gray-900 mb-1">Cumpleaños</h4>
              <p className="text-sm text-gray-600">Felicitaciones automáticas con descuentos especiales</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-2xl mb-2">💕</div>
              <h4 className="font-medium text-gray-900 mb-1">Fechas Especiales</h4>
              <p className="text-sm text-gray-600">San Valentín, Navidad, Día de la Madre</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-2xl mb-2">✨</div>
              <h4 className="font-medium text-gray-900 mb-1">Promociones</h4>
              <p className="text-sm text-gray-600">Ofertas personalizadas y descuentos especiales</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Próximamente:</strong> Sistema completo de email marketing con plantillas profesionales, 
              estadísticas detalladas y automatización avanzada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}