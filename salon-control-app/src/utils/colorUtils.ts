// src/utils/colorUtils.ts - Versión simplificada sin dependencias circulares
export const getColorClasses = (color: string) => {
  const colorMap: Record<string, {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
    bgLight: string;
    textDark: string;
  }> = {
    purple: {
      bg: 'bg-purple-600',
      bgHover: 'hover:bg-purple-700',
      text: 'text-purple-600',
      border: 'border-purple-500',
      bgLight: 'bg-purple-50',
      textDark: 'text-purple-800'
    },
    blue: {
      bg: 'bg-blue-600',
      bgHover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      border: 'border-blue-500',
      bgLight: 'bg-blue-50',
      textDark: 'text-blue-800'
    },
    pink: {
      bg: 'bg-pink-600',
      bgHover: 'hover:bg-pink-700',
      text: 'text-pink-600',
      border: 'border-pink-500',
      bgLight: 'bg-pink-50',
      textDark: 'text-pink-800'
    },
    rose: {
      bg: 'bg-rose-600',
      bgHover: 'hover:bg-rose-700',
      text: 'text-rose-600',
      border: 'border-rose-500',
      bgLight: 'bg-rose-50',
      textDark: 'text-rose-800'
    },
    green: {
      bg: 'bg-green-600',
      bgHover: 'hover:bg-green-700',
      text: 'text-green-600',
      border: 'border-green-500',
      bgLight: 'bg-green-50',
      textDark: 'text-green-800'
    },
    emerald: {
      bg: 'bg-emerald-600',
      bgHover: 'hover:bg-emerald-700',
      text: 'text-emerald-600',
      border: 'border-emerald-500',
      bgLight: 'bg-emerald-50',
      textDark: 'text-emerald-800'
    },
    teal: {
      bg: 'bg-teal-600',
      bgHover: 'hover:bg-teal-700',
      text: 'text-teal-600',
      border: 'border-teal-500',
      bgLight: 'bg-teal-50',
      textDark: 'text-teal-800'
    },
    indigo: {
      bg: 'bg-indigo-600',
      bgHover: 'hover:bg-indigo-700',
      text: 'text-indigo-600',
      border: 'border-indigo-500',
      bgLight: 'bg-indigo-50',
      textDark: 'text-indigo-800'
    },
    cyan: {
      bg: 'bg-cyan-600',
      bgHover: 'hover:bg-cyan-700',
      text: 'text-cyan-600',
      border: 'border-cyan-500',
      bgLight: 'bg-cyan-50',
      textDark: 'text-cyan-800'
    },
    amber: {
      bg: 'bg-amber-600',
      bgHover: 'hover:bg-amber-700',
      text: 'text-amber-600',
      border: 'border-amber-500',
      bgLight: 'bg-amber-50',
      textDark: 'text-amber-800'
    },
    yellow: {
      bg: 'bg-yellow-600',
      bgHover: 'hover:bg-yellow-700',
      text: 'text-yellow-600',
      border: 'border-yellow-500',
      bgLight: 'bg-yellow-50',
      textDark: 'text-yellow-800'
    },
    orange: {
      bg: 'bg-orange-600',
      bgHover: 'hover:bg-orange-700',
      text: 'text-orange-600',
      border: 'border-orange-500',
      bgLight: 'bg-orange-50',
      textDark: 'text-orange-800'
    }
  };

  return colorMap[color] || colorMap.purple;
};

// Función simple para obtener colores sin hook
export const getDefaultThemeColors = () => {
  return {
    primary: getColorClasses('purple'),
    secondary: getColorClasses('blue'),
    accent: getColorClasses('pink'),
  };
};