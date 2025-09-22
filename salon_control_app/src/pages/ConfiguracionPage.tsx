// src/pages/ConfiguracionPage.tsx - Versión corregida
import { useState, useEffect } from 'react';
import { Settings, Upload, Image, Trash2, Save, Building } from 'lucide-react';

interface HorarioDia {
  abierto: boolean;
  inicio: string;
  fin: string;
}

interface ConfiguracionEmpresa {
  nombre: string;
  telefono: string;
  direccion: string;
  email: string;
  logo: string | null;
  horarios: Record<string, HorarioDia>;
}

const HORARIOS_DEFAULT: Record<string, HorarioDia> = {
  lunes: { abierto: true, inicio: '09:00', fin: '18:00' },
  martes: { abierto: true, inicio: '09:00', fin: '18:00' },
  miercoles: { abierto: true, inicio: '09:00', fin: '18:00' },
  jueves: { abierto: true, inicio: '09:00', fin: '18:00' },
  viernes: { abierto: true, inicio: '09:00', fin: '18:00' },
  sabado: { abierto: true, inicio: '09:00', fin: '17:00' },
  domingo: { abierto: false, inicio: '10:00', fin: '16:00' }
};

const CONFIGURACION_INICIAL: ConfiguracionEmpresa = {
  nombre: 'Beauty Salon Total Control',
  telefono: '+52 55 1234-5678',
  direccion: 'Calle Principal 123, Col. Centro',
  email: 'contacto@beautysalon.com',
  logo: null,
  horarios: HORARIOS_DEFAULT
};

export default function ConfiguracionPage() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>(CONFIGURACION_INICIAL);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Cargar configuración desde localStorage
  useEffect(() => {
    try {
      const configGuardada = localStorage.getItem('configuracion_empresa');
      if (configGuardada) {
        const config = JSON.parse(configGuardada);
        
        // Crear configuración segura mergeando con defaults
        const configSegura: ConfiguracionEmpresa = {
          nombre: config?.nombre || CONFIGURACION_INICIAL.nombre,
          telefono: config?.telefono || CONFIGURACION_INICIAL.telefono,
          direccion: config?.direccion || CONFIGURACION_INICIAL.direccion,
          email: config?.email || CONFIGURACION_INICIAL.email,
          logo: config?.logo || null,
          horarios: { ...HORARIOS_DEFAULT }
        };

        // Mergear horarios guardados con defaults
        if (config?.horarios && typeof config.horarios === 'object') {
          Object.keys(HORARIOS_DEFAULT).forEach(dia => {
            if (config.horarios[dia]) {
              configSegura.horarios[dia] = {
                abierto: config.horarios[dia].abierto ?? HORARIOS_DEFAULT[dia].abierto,
                inicio: config.horarios[dia].inicio || HORARIOS_DEFAULT[dia].inicio,
                fin: config.horarios[dia].fin || HORARIOS_DEFAULT[dia].fin
              };
            }
          });
        }

        setConfiguracion(configSegura);
        setLogoPreview(configSegura.logo);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      // En caso de error, usar configuración inicial
      setConfiguracion(CONFIGURACION_INICIAL);
    }
  }, []);

  // Manejar subida de logo
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      mostrarMensaje('error', 'Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      mostrarMensaje('error', 'El archivo es muy grande. Máximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const logoBase64 = e.target?.result as string;
      setLogoPreview(logoBase64);
      setConfiguracion(prev => ({ ...prev, logo: logoBase64 }));
    };
    reader.readAsDataURL(file);
  };

  // Eliminar logo
  const eliminarLogo = () => {
    setLogoPreview(null);
    setConfiguracion(prev => ({ ...prev, logo: null }));
  };

  // Actualizar configuración
  const updateConfiguracion = (campo: keyof ConfiguracionEmpresa, valor: any) => {
    if (campo === 'horarios') return; // Los horarios se manejan por separado
    setConfiguracion(prev => ({ ...prev, [campo]: valor }));
  };

  // Actualizar horarios de forma segura
  const updateHorario = (dia: string, campo: keyof HorarioDia, valor: any) => {
    setConfiguracion(prev => {
      const nuevosHorarios = { ...prev.horarios };
      
      // Asegurar que el día existe
      if (!nuevosHorarios[dia]) {
        nuevosHorarios[dia] = { ...HORARIOS_DEFAULT[dia] };
      }
      
      nuevosHorarios[dia] = {
        ...nuevosHorarios[dia],
        [campo]: valor
      };
      
      return {
        ...prev,
        horarios: nuevosHorarios
      };
    });
  };

  // Guardar configuración
  const guardarConfiguracion = async () => {
    setGuardando(true);
    try {
      localStorage.setItem('configuracion_empresa', JSON.stringify(configuracion));
      
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new CustomEvent('configuracion-updated', { 
        detail: configuracion 
      }));
      
      mostrarMensaje('success', 'Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      mostrarMensaje('error', 'Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  // Mostrar mensaje
  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  // Función helper para obtener horario de forma segura
  const getHorario = (dia: string): HorarioDia => {
    return configuracion.horarios?.[dia] || HORARIOS_DEFAULT[dia] || { abierto: false, inicio: '09:00', fin: '18:00' };
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={28} className="text-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Configuración del Salón
          </h1>
        </div>
        <p className="text-gray-600">
          Gestiona la información y configuración de tu salón de belleza
        </p>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg ${
          mensaje.tipo === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información General */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building size={20} className="text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Información General</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Salón
              </label>
              <input
                type="text"
                value={configuracion.nombre}
                onChange={(e) => updateConfiguracion('nombre', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Nombre de tu salón"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={configuracion.telefono}
                onChange={(e) => updateConfiguracion('telefono', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+52 55 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                value={configuracion.direccion}
                onChange={(e) => updateConfiguracion('direccion', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder="Dirección completa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={configuracion.email}
                onChange={(e) => updateConfiguracion('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="contacto@salon.com"
              />
            </div>
          </div>
        </div>

        {/* Logo del Salón */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image size={20} className="text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Logo del Salón</h2>
          </div>

          <div className="space-y-4">
            {/* Preview del logo */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {logoPreview ? (
                <div className="space-y-4">
                  <img
                    src={logoPreview}
                    alt="Logo del salón"
                    className="max-w-full max-h-48 mx-auto object-contain rounded-lg" // Era max-h-32, ahora max-h-48
                  />
                  <div className="flex justify-center gap-2">
                    <label className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 cursor-pointer transition-colors flex items-center gap-2">
                      <Upload size={16} />
                      Cambiar Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={eliminarLogo}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Image size={48} className="mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sube el logo de tu salón
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      JPG, PNG o GIF hasta 2MB
                    </p>
                    <label className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 cursor-pointer transition-colors inline-flex items-center gap-2">
                      <Upload size={16} />
                      Seleccionar Archivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Recomendaciones:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Tamaño recomendado: 300x300 píxeles</li>
                <li>• Fondo transparente para mejor resultado</li>
                <li>• Formato PNG para mejor calidad</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Horarios de Atención */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Horarios de Atención</h2>
        <div className="space-y-3">
          {diasSemana.map(dia => {
            const horario = getHorario(dia.key);
            return (
              <div key={dia.key} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-3 min-w-[120px]">
                  <input
                    type="checkbox"
                    checked={horario.abierto}
                    onChange={(e) => updateHorario(dia.key, 'abierto', e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="font-medium text-gray-900">{dia.label}</span>
                </div>
                
                {horario.abierto ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={horario.inicio}
                      onChange={(e) => updateHorario(dia.key, 'inicio', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <span className="text-gray-500">a</span>
                    <input
                      type="time"
                      value={horario.fin}
                      onChange={(e) => updateHorario(dia.key, 'fin', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={guardarConfiguracion}
          disabled={guardando}
          className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
            guardando
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          } text-white`}
        >
          <Save size={16} />
          {guardando ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}