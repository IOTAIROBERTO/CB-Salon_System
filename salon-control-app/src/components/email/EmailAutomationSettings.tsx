// src/components/email/EmailAutomationSettings.tsx
import { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Play, 
  Pause, 
  Calendar, 
  Gift, 
  Mail, 
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useEmailAutomation } from '../../hooks/useEmailAutomation';

export default function EmailAutomationSettings() {
  const {
    isInitialized,
    config,
    updateConfig,
    executeManualCheck,
    startAutomation,
    stopAutomation,
    getAutomationStats
  } = useEmailAutomation();

  const [stats, setStats] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  // Memoizar la función para evitar recreación en cada render
  const updateStats = useCallback(() => {
    if (isInitialized) {
      const currentStats = getAutomationStats();
      setStats(currentStats);
      setIsRunning(currentStats?.isRunning || false);
    }
  }, [isInitialized, getAutomationStats]);

  // Cargar estadísticas iniciales
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  // Actualizar estadísticas periódicamente
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      updateStats();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [isInitialized, updateStats]);

  const handleManualCheck = () => {
    try {
      const results = executeManualCheck();
      if (results) {
        setLastCheck(new Date().toLocaleTimeString('es-ES'));
        const currentStats = getAutomationStats();
        setStats(currentStats);
        
        const total = results.cumpleaneros.length + results.recordatorios.length + results.seguimientos.length;
        if (total > 0) {
          alert(`Se encontraron ${total} notificaciones pendientes. Revisa la consola para más detalles.`);
        } else {
          alert('No hay notificaciones pendientes en este momento.');
        }
      }
    } catch (error) {
      console.error('Error in manual check:', error);
      alert('Error al ejecutar la verificación manual');
    }
  };

  const handleToggleAutomation = () => {
    try {
      if (isRunning) {
        stopAutomation();
        setIsRunning(false);
      } else {
        startAutomation(60); // Cada 60 minutos
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Inicializando automatización...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings size={20} />
            Automatización de Emails
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isRunning 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isRunning ? 'Activa' : 'Inactiva'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.cumpleanosActivo}
                  onChange={(e) => updateConfig({ cumpleanosActivo: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-2"
                />
                <Gift size={16} className="mr-1 text-pink-600" />
                <span className="text-sm font-medium">Emails de cumpleaños</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Envío automático el día del cumpleaños
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.seguimientoActivo}
                  onChange={(e) => updateConfig({ seguimientoActivo: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-2"
                />
                <Mail size={16} className="mr-1 text-blue-600" />
                <span className="text-sm font-medium">Emails de seguimiento</span>
              </label>
              <div className="ml-6 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Después de</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={config.seguimientoDias}
                    onChange={(e) => updateConfig({ seguimientoDias: parseInt(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    disabled={!config.seguimientoActivo}
                  />
                  <span className="text-xs text-gray-500">días del servicio</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recordatorios de citas
              </label>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-orange-600" />
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={config.recordatoriosDias}
                  onChange={(e) => updateConfig({ recordatoriosDias: parseInt(e.target.value) })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <span className="text-sm text-gray-500">días antes</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recordatorio automático antes de la cita
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleToggleAutomation}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isRunning
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? 'Pausar' : 'Iniciar'} Automatización
          </button>

          <button
            onClick={handleManualCheck}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <CheckCircle size={16} />
            Verificar Ahora
          </button>
        </div>

        {lastCheck && (
          <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
            <Clock size={14} />
            <span>Última verificación: {lastCheck}</span>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas Actuales</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-pink-600">Cumpleaños Hoy</p>
                  <p className="text-2xl font-bold text-pink-700">{stats.cumpleaneros}</p>
                </div>
                <Gift size={24} className="text-pink-600" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Recordatorios</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.recordatorios}</p>
                </div>
                <Calendar size={24} className="text-orange-600" />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Seguimientos</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.seguimientos}</p>
                </div>
                <Mail size={24} className="text-blue-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Clientes c/Email</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.totalClientes}</p>
                </div>
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Cómo funciona la automatización:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Cumpleaños:</strong> Se envían emails automáticamente el día del cumpleaños del cliente</li>
              <li>• <strong>Recordatorios:</strong> Se envían antes de citas confirmadas según los días configurados</li>
              <li>• <strong>Seguimiento:</strong> Se envían después de servicios completados para obtener feedback</li>
              <li>• <strong>Verificación:</strong> El sistema verifica automáticamente cada hora cuando está activo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}