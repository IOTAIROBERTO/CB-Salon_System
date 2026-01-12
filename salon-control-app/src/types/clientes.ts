export interface Cliente {
  id: string;
  nombre: string;
  cumple?: string;
  comentarios?: string;
  activo?: boolean;
  email?: string;
  telefono?: string;
  fechaRegistro?: string;
  ultimaVisita?: string;
}

export interface ClienteFormData {
  nombre: string;
  cumple?: string;
  comentarios?: string;
  activo: boolean;
  email: string;
  telefono: string;
}

export interface ClientesStats {
  totalClientes: number;
  clientesActivos: number;
  clientesInactivos: number;
  conEmail: number;
  conTelefono: number;
}

export type ViewMode = 'table' | 'cards';

export const CLIENTES_INICIALES: Cliente[] = [
  {
    id: 'c1',
    nombre: 'Ana López',
    cumple: '1990-06-15',
    comentarios: 'Prefiere cortes modernos',
    activo: true,
    email: 'ana.lopez@email.com',
    telefono: '+5215512345678',
    fechaRegistro: '2024-01-15'
  },
  {
    id: 'c2',
    nombre: 'María García',
    cumple: '1985-11-23',
    comentarios: 'Cliente VIP',
    activo: true,
    email: 'maria.garcia@email.com',
    telefono: '+5215587654321',
    fechaRegistro: '2024-02-10'
  }
];