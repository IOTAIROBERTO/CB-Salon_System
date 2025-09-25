// src/components/common/EmpresaInfo.tsx
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useConfiguracion } from '../../hooks/useConfiguracion';

interface EmpresaInfoProps {
  variant?: 'card' | 'inline' | 'footer';
  showLogo?: boolean;
  showHorarios?: boolean;
  className?: string;
}

export default function EmpresaInfo({ 
  variant = 'card', 
  showLogo = true, 
  showHorarios = false,
  className = '' 
}: EmpresaInfoProps) {
  const { configuracion, estaAbierto, getHorario } = useConfiguracion();

  const renderCard = () => (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {showLogo && configuracion.logo && (
        <div className="mb-4 text-center">
          <img
            src={configuracion.logo}
            alt={`Logo de ${configuracion.nombre}`}
            className="h-32 w-auto mx-auto object-contain" // Era h-16, ahora h-32 (más grande)
          />
        </div>
      )}
      
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">{configuracion.nombre}</h3>
        
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm">{configuracion.direccion}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Phone size={16} className="flex-shrink-0" />
          <span className="text-sm">{configuracion.telefono}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Mail size={16} className="flex-shrink-0" />
          <span className="text-sm">{configuracion.email}</span>
        </div>

        {showHorarios && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Horarios</span>
            </div>
            <div className="space-y-1">
              {Object.entries(configuracion.horarios).map(([dia, horario]) => (
                <div key={dia} className="flex justify-between text-xs">
                  <span className="capitalize font-medium">{dia}:</span>
                  <span className={`${horario.abierto ? 'text-green-600' : 'text-red-600'}`}>
                    {horario.abierto ? `${horario.inicio} - ${horario.fin}` : 'Cerrado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderInline = () => (
    <div className={`flex items-center gap-4 ${className}`}>
      {showLogo && configuracion.logo && (
        <img
          src={configuracion.logo}
          alt={`Logo de ${configuracion.nombre}`}
          className="h-16 w-16 object-contain rounded" // Era h-8 w-8, ahora h-16 w-16
        />
      )}
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900">{configuracion.nombre}</span>
        <span className="text-sm text-gray-600">{configuracion.telefono}</span>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className={`text-center space-y-2 ${className}`}>
      {showLogo && configuracion.logo && (
        <div className="mb-3">
          <img
            src={configuracion.logo}
            alt={`Logo de ${configuracion.nombre}`}
            className="h-24 w-auto mx-auto object-contain" // Era h-12, ahora h-24 (más grande)
          />
        </div>
      )}
      
      <h4 className="font-semibold text-gray-900">{configuracion.nombre}</h4>
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <MapPin size={14} />
          <span>{configuracion.direccion}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Phone size={14} />
          <span>{configuracion.telefono}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Mail size={14} />
          <span>{configuracion.email}</span>
        </div>
      </div>
    </div>
  );

  switch (variant) {
    case 'inline':
      return renderInline();
    case 'footer':
      return renderFooter();
    default:
      return renderCard();
  }
}

// Componente específico para mostrar estado actual del salón
export function EstadoSalon({ className = '' }: { className?: string }) {
  const { configuracion, estaAbierto, getHorario } = useConfiguracion();
  const diaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
  const horarioHoy = getHorario(diaActual);
  const abierto = estaAbierto(diaActual);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      abierto ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    } ${className}`}>
      <div className={`w-2 h-2 rounded-full ${abierto ? 'bg-green-500' : 'bg-red-500'}`} />
      <span>
        {abierto 
          ? `Abierto hasta las ${horarioHoy.fin}`
          : 'Cerrado'
        }
      </span>
    </div>
  );
}