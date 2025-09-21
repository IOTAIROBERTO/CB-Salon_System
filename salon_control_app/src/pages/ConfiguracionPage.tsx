// src/pages/ConfiguracionPage.tsx
import { Building2, Palette, Image, Mail, CheckCircle, XCircle } from 'lucide-react';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { useModalConfiguracion } from '../hooks/useModalConfiguracion';
import ConfiguracionEmpresaModal from '../components/configuracion/ConfiguracionEmpresaModal';

export default function ConfiguracionPage() {
  const {
    configuracion,
    actualizarNombre,
    actualizarColores,
    actualizarLogo,
    actualizarEmail
  } = useConfiguracion();

  const { modalAbierto, abrirModal, cerrarModal } = useModalConfiguracion();

  const getColorClass = (color: string, type: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap: Record<string, Record<string, string>> = {
      bg: {
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
        pink: 'bg-pink-500',
        rose: 'bg-rose-500',
        green: 'bg-green-500',
        emerald: 'bg-emerald-500',
        teal: 'bg-teal-500',
        indigo: 'bg-indigo-500',
        cyan: 'bg-cyan-500',
        amber: 'bg-amber-500',
        yellow: 'bg-yellow-500',
        orange: 'bg-orange-500'
      },
      text: {
        purple: 'text-purple-600',
        blue: 'text-blue-600',
        pink: 'text-pink-600',
        rose: 'text-rose-600',
        green: 'text-green-600',
        emerald: 'text-emerald-600',
        teal: 'text-teal-600',
        indigo: 'text-indigo-600',
        cyan: 'text-cyan-600',
        amber: 'text-amber-600',
        yellow: 'text-yellow-600',
        orange: 'text-orange-600'
      },
      border: {
        purple: 'border-purple-500',
        blue: 'border-blue-500',
        pink: 'border-pink-500',
        rose: 'border-rose-500',
        green: 'border-green-500',
        emerald: 'border-emerald-500',
        teal: 'border-teal-500',
        indigo: 'border-indigo-500',
        cyan: 'border-cyan-500',
        amber: 'border-amber-500',
        yellow: 'border-yellow-500',
        orange: 'border-orange-500'
      }
    };
    return colorMap[type][color] || colorMap[type]['purple'];
  };

  const configuracionItems = [
    {
      id: 'empresa',
      titulo: 'Información de la Empresa',
      descripcion: 'Configura el nombre y datos básicos de tu empresa',
      icono: Building2,
      configurado: !!configuracion.nombre && configuracion.nombre !== 'Beauty Salon Total Control',
      valor: configuracion.nombre,
      accion: () => abrirModal('empresa')
    },
    {
      id: 'colores',
      titulo: 'Colores y Tema',
      descripcion: 'Personaliza los colores de la aplicación',
      icono: Palette,
      configurado: true,
      valor: `Tema ${configuracion.colores.primario}`,
      preview: (
        <div className="flex gap-1">
          <div className={`w-4 h-4 rounded-full ${getColorClass(configuracion.colores.primario)}`}></div>
          <div className={`w-4 h-4 rounded-full ${getColorClass(configuracion.colores.secundario)}`}></div>
          <div className={`w-4 h-4 rounded-full ${getColorClass(configuracion.colores.acento)}`}></div>
        </div>
      ),
      accion: () => alert('Función de colores disponible próximamente')
    },
    {
      id: 'logo',
      titulo: 'Logo de la Empresa',
      descripcion: 'Sube el logo que aparecerá en la aplicación',
      icono: Image,
      configurado: !!configuracion.logo,
      valor: configuracion.logo ? 'Logo configurado' : 'Sin logo',
      preview: configuracion.logo && (
        <img src={configuracion.logo} alt="Logo" className="w-8 h-8 object-contain" />
      ),
      accion: () => alert('Función de logo disponible próximamente')
    },
    {
      id: 'email',
      titulo: 'Configuración de Email',
      descripcion: 'Configura el envío de emails automáticos',
      icono: Mail,
      configurado: configuracion.email.configurado,
      valor: configuracion.email.configurado 
        ? `Configurado con ${configuracion.email.servicio?.toUpperCase()}`
        : 'No configurado',
      accion: () => alert('Función de email disponible próximamente')
    }
  ];

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Configuración
        </h1>
        <p className="text-gray-600 mt-1">
          Personaliza la aplicación según las necesidades de tu empresa
        </p>
      </div>

      {/* Vista previa actual */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa Actual</h2>
        <div className="flex items-center gap-4">
          {configuracion.logo && (
            <img 
              src={configuracion.logo} 
              alt="Logo empresa" 
              className="w-12 h-12 object-contain"
            />
          )}
          <div>
            <h3 className={`text-xl font-bold ${getColorClass(configuracion.colores.primario, 'text')}`}>
              {configuracion.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">Colores actuales:</span>
              <div className="flex gap-1">
                <div className={`w-4 h-4 rounded-full ${getColorClass(configuracion.colores.primario)}`}></div>
                <div className={`w-4 h-4 rounded-full ${getColorClass(configuracion.colores.secundario)}`}></div>
                <div className={`w-4 h-4 rounded-full ${getColorClass(configuracion.colores.acento)}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opciones de configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configuracionItems.map((item) => {
          const IconComponent = item.icono;
          
          return (
            <div key={item.id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${getColorClass(configuracion.colores.primario)} rounded-lg flex items-center justify-center`}>
                    <IconComponent size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.titulo}</h3>
                    <p className="text-sm text-gray-600">{item.descripcion}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {item.preview}
                  {item.configurado ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    <XCircle size={20} className="text-red-500" />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Estado actual: </span>
                  {item.valor}
                </p>
              </div>

              <button
                onClick={item.accion}
                className={`w-full ${getColorClass(configuracion.colores.primario)} text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity duration-200`}
              >
                {item.configurado ? 'Modificar' : 'Configurar'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Estado general */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Estado de la Configuración</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {configuracionItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                item.configurado ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-700">{item.titulo}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-sm text-gray-600">
            <span className="font-medium">
              {configuracionItems.filter(item => item.configurado).length} de {configuracionItems.length}
            </span> configuraciones completadas
          </p>
        </div>
      </div>

      {/* Modal de empresa */}
      <ConfiguracionEmpresaModal
        isOpen={modalAbierto === 'empresa'}
        configuracion={configuracion}
        onSave={actualizarNombre}
        onClose={cerrarModal}
      />
    </div>
  );
}