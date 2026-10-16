// src/utils/clientesUtils.ts
import { Cliente, ClienteFormData, ClientesStats } from '../types/clientes';
import { parseFechaLocal } from './dateValidation';

export const validateClienteForm = (formData: ClienteFormData): string | null => {
  if (!formData.nombre.trim()) {
    return 'El nombre del cliente es obligatorio';
  }

  if (!formData.cumple) {
    return 'La fecha de cumpleaños es obligatoria';
  }

  if (formData.telefono && formData.telefono.replace(/\D/g, '').length < 10) {
    return 'El teléfono debe tener al menos 10 dígitos, con lada';
  }

  if (formData.email && !isValidEmail(formData.email)) {
    return 'El formato del email no es válido';
  }

  return null;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateClienteId = (): string => {
  return `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (dateString: string): string => {
  try {
    return parseFechaLocal(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

export const formatDateBirthday = (dateString: string): string => {
  try {
    const date = parseFechaLocal(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long'
    });
  } catch (error) {
    return dateString;
  }
};

// Nueva función para calcular la edad
export const calcularEdad = (fechaNacimiento: string): number => {
  try {
    const today = new Date();
    const birthDate = parseFechaLocal(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    return 0;
  }
};

// Nueva función para formatear cumpleaños con edad
export const formatBirthdayWithAge = (fechaNacimiento: string): string => {
  try {
    const date = parseFechaLocal(fechaNacimiento);
    const edad = calcularEdad(fechaNacimiento);

    const fechaFormateada = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long'
    });

    return `${fechaFormateada} (${edad} años)`;
  } catch (error) {
    return fechaNacimiento;
  }
};

// Función mejorada para verificar si es cumpleaños hoy
export const esCumpleanosHoy = (fechaNacimiento: string): boolean => {
  try {
    const today = new Date();
    const birthDate = parseFechaLocal(fechaNacimiento);

    return today.getMonth() === birthDate.getMonth() &&
      today.getDate() === birthDate.getDate();
  } catch (error) {
    return false;
  }
};

export const calculateStats = (clientes: Cliente[]): ClientesStats => {
  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter(c => c.activo).length;
  const clientesInactivos = clientes.filter(c => !c.activo).length;
  const conEmail = clientes.filter(c => c.email && c.email.trim() !== '').length;
  const conTelefono = clientes.filter(c => c.telefono && c.telefono.trim() !== '').length;

  return {
    totalClientes,
    clientesActivos,
    clientesInactivos,
    conEmail,
    conTelefono
  };
};

export const getCumpleanerosMes = (clientes: Cliente[]): Cliente[] => {
  const mesActual = new Date().getMonth() + 1;
  return clientes.filter(cliente => {
    try {
      const fechaCumple = parseFechaLocal(cliente.cumple);
      return fechaCumple.getMonth() + 1 === mesActual && cliente.activo;
    } catch (error) {
      return false;
    }
  }).sort((a, b) => {
    try {
      const fechaA = parseFechaLocal(a.cumple).getDate();
      const fechaB = parseFechaLocal(b.cumple).getDate();
      return fechaA - fechaB;
    } catch (error) {
      return 0;
    }
  });
};

// This utility now needs to be async if it query Dexie, 
// but since it's used synchronously in many places, we'll keep a simpler version for now
// or better, migrate the callers.
export const hasClienteRegistros = (clienteId: string): boolean => {
  // We'll keep this as a optimistic check since full migration involves async/await
  // If we really need precision, we should use a hook in the component.
  return true; // Simplified for UI safety during deletion
};