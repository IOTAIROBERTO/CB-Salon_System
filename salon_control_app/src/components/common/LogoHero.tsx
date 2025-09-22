// src/components/common/LogoHero.tsx - Logo grande para páginas principales
import { useState, useEffect } from 'react';
import { Building } from 'lucide-react';

interface LogoHeroProps {
  size?: 'normal' | 'large' | 'xlarge';
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

interface ConfiguracionEmpresa {
  nombre: string;
  logo: string | null;
}

export default function LogoHero({ 
  size = 'large', 
  className = '', 
  showText = true,
  textClassName = '' 
}: LogoHeroProps) {
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>({
    nombre: 'Beauty Salon Total Control',
    logo: null
  });

  useEffect(() => {
    const configGuardada = localStorage.getItem('configuracion_empresa');
    if (configGuardada) {
      try {
        const config = JSON.parse(configGuardada);
        setConfiguracion({
          nombre: config?.nombre || 'Beauty Salon Total Control',
          logo: config?.logo || null
        });
      } catch (error) {
        console.error('Error al cargar configuración del logo:', error);
      }
    }
  }, []);

  // Escuchar cambios en la configuración
  useEffect(() => {
    const handleStorageChange = () => {
      const configGuardada = localStorage.getItem('configuracion_empresa');
      if (configGuardada) {
        try {
          const config = JSON.parse(configGuardada);
          setConfiguracion({
            nombre: config?.nombre || 'Beauty Salon Total Control',
            logo: config?.logo || null
          });
        } catch (error) {
          console.error('Error al actualizar configuración del logo:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('configuracion-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('configuracion-updated', handleStorageChange);
    };
  }, []);

  const getSizeClasses = () => {
    switch (size) {
      case 'normal':
        return 'h-32 w-32';
      case 'xlarge':
        return 'h-64 w-64';
      default: // large
        return 'h-48 w-48';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'normal':
        return 'text-2xl';
      case 'xlarge':
        return 'text-6xl';
      default: // large
        return 'text-4xl';
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Logo o icono por defecto */}
      <div className={`flex-shrink-0 ${getSizeClasses()}`}>
        {configuracion.logo ? (
          <img
            src={configuracion.logo}
            alt={`Logo de ${configuracion.nombre}`}
            className={`${getSizeClasses()} object-contain rounded-lg shadow-lg`}
            onError={(e) => {
              // Si hay error al cargar la imagen, mostrar icono por defecto
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <Building className={`${getSizeClasses()} text-purple-600 p-4 bg-white rounded-lg shadow-lg`} />
        )}
        {/* Icono de respaldo */}
        {configuracion.logo && (
          <Building className={`${getSizeClasses()} text-purple-600 p-4 bg-white rounded-lg shadow-lg hidden`} />
        )}
      </div>

      {/* Nombre del salón */}
      {showText && (
        <h1 className={`font-bold text-center ${getTextSize()} ${textClassName}`}>
          {configuracion.nombre}
        </h1>
      )}
    </div>
  );
}

// Componente específico para usar en páginas de presentación
export function LogoPresentation({ className = '' }: { className?: string }) {
  return (
    <LogoHero
      size="xlarge"
      className={`text-center py-12 ${className}`}
      showText={true}
      textClassName="text-gray-800 drop-shadow-lg"
    />
  );
}

// Componente para usar en headers de reportes o documentos
export function LogoDocument({ className = '' }: { className?: string }) {
  return (
    <LogoHero
      size="normal"
      className={`text-center py-6 ${className}`}
      showText={true}
      textClassName="text-gray-700"
    />
  );
}