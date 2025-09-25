// src/components/common/LogoEmpresa.tsx
import { useState, useEffect } from 'react';
import { Building } from 'lucide-react';

interface LogoEmpresaProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'nav';
  className?: string;
  showText?: boolean;
  hideTextWhenLogo?: boolean; // Nueva prop para ocultar texto cuando hay logo
}

interface ConfiguracionEmpresa {
  nombre: string;
  logo: string | null;
}

export default function LogoEmpresa({ 
  size = 'md', 
  className = '', 
  showText = true,
  hideTextWhenLogo = false 
}: LogoEmpresaProps) {
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
        // Mantener valores por defecto en caso de error
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
          // Mantener configuración actual en caso de error
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar eventos personalizados para cambios en la misma pestaña
    window.addEventListener('configuracion-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('configuracion-updated', handleStorageChange);
    };
  }, []);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-12 w-12';
      case 'lg':
        return 'h-20 w-20';
      case 'xl':
        return 'h-24 w-24';
      case 'nav':
        return 'h-40 w-40'; // Tamaño específico para navegación - 5x más grande que el original (h-8)
      default:
        return 'h-16 w-16';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-base';
      case 'lg':
        return 'text-2xl';
      case 'xl':
        return 'text-3xl';
      case 'nav':
        return 'text-4xl'; // Texto muy grande para navegación
      default:
        return 'text-xl';
    }
  };

  // Determinar si mostrar texto
  const shouldShowText = showText && !(hideTextWhenLogo && configuracion.logo);

  return (
    <div className={`flex items-center ${size === 'nav' ? 'gap-4' : 'gap-3'} ${className}`}>
      {/* Logo o icono por defecto */}
      <div className={`flex-shrink-0 ${getSizeClasses()}`}>
        {configuracion.logo ? (
          <img
            src={configuracion.logo}
            alt={`Logo de ${configuracion.nombre}`}
            className={`${getSizeClasses()} object-contain rounded`}
            onError={(e) => {
              // Si hay error al cargar la imagen, mostrar icono por defecto
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <Building className={`${getSizeClasses()} text-purple-600`} />
        )}
        {/* Icono de respaldo */}
        {configuracion.logo && (
          <Building className={`${getSizeClasses()} text-purple-600 hidden`} />
        )}
      </div>

      {/* Nombre del salón - Solo mostrar si shouldShowText es true */}
      {shouldShowText && (
        <span className={`font-bold text-white ${getTextSize()}`}>
          {configuracion.nombre}
        </span>
      )}
    </div>
  );
}