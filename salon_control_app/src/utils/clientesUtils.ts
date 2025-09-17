// src/utils/clientesUtils.ts
import { Cliente, ClienteFormData, ClientesStats } from '../types/clientes';

export const validateClienteForm = (formData: ClienteFormData): string | null => {
  if (!formData.nombre.trim()) {
    return 'El nombre del cliente es obligatorio';
  }
  
  if (!formData.cumple) {
    return 'La fecha de cumpleaños es obligatoria';
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
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', {
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
    const date = new Date(dateString + 'T00:00:00');
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
    const birthDate = new Date(fechaNacimiento + 'T00:00:00');
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
    const date = new Date(fechaNacimiento + 'T00:00:00');
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
    const birthDate = new Date(fechaNacimiento + 'T00:00:00');
    
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
      const fechaCumple = new Date(cliente.cumple + 'T00:00:00');
      return fechaCumple.getMonth() + 1 === mesActual && cliente.activo;
    } catch (error) {
      return false;
    }
  }).sort((a, b) => {
    try {
      const fechaA = new Date(a.cumple + 'T00:00:00').getDate();
      const fechaB = new Date(b.cumple + 'T00:00:00').getDate();
      return fechaA - fechaB;
    } catch (error) {
      return 0;
    }
  });
};

export const hasClienteRegistros = (clienteId: string): boolean => {
  const citas = JSON.parse(localStorage.getItem('citas') || '[]');
  const servicios = JSON.parse(localStorage.getItem('serviciosRealizados') || '[]');
  
  return citas.some((cita: any) => cita.clienteId === clienteId) || 
         servicios.some((servicio: any) => servicio.clienteId === clienteId);
};