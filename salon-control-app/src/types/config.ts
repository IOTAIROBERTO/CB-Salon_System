// src/types/config.ts
export interface ConfiguracionEmpresa {
  nombre: string;
  logo?: string;
  colores: {
    primario: string;
    secundario: string;
    acento: string;
  };
  email: {
    configurado: boolean;
    servicio: 'emailjs' | 'smtp' | null;
    emailjs?: {
      serviceId: string;
      templateId: string;
      publicKey: string;
    };
    smtp?: {
      host: string;
      puerto: number;
      usuario: string;
      password: string;
    };
  };
}

export const CONFIGURACION_DEFAULT: ConfiguracionEmpresa = {
  nombre: 'Beauty Salon Total Control',
  colores: {
    primario: 'purple',
    secundario: 'blue', 
    acento: 'pink'
  },
  email: {
    configurado: false,
    servicio: null
  }
};

export const TEMAS_DISPONIBLES = [
  {
    nombre: 'Púrpura Clásico',
    valor: 'purple',
    colores: {
      primario: 'purple',
      secundario: 'blue',
      acento: 'pink'
    }
  },
  {
    nombre: 'Rosa Elegante', 
    valor: 'pink',
    colores: {
      primario: 'pink',
      secundario: 'purple',
      acento: 'rose'
    }
  },
  {
    nombre: 'Azul Profesional',
    valor: 'blue',
    colores: {
      primario: 'blue',
      secundario: 'indigo',
      acento: 'cyan'
    }
  },
  {
    nombre: 'Verde Natura',
    valor: 'green',
    colores: {
      primario: 'green',
      secundario: 'emerald',
      acento: 'teal'
    }
  },
  {
    nombre: 'Dorado Premium',
    valor: 'amber',
    colores: {
      primario: 'amber',
      secundario: 'yellow',
      acento: 'orange'
    }
  }
];