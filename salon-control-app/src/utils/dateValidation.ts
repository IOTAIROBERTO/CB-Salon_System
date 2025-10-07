// src/utils/dateValidation.ts
// GUARDAR COMO: salon-control-app/src/utils/dateValidation.ts

/**
 * Obtiene la fecha y hora actual en formato ISO
 */
export const obtenerFechaHoraActual = () => {
  return new Date();
};

/**
 * Obtiene la fecha mínima permitida (hoy)
 * @returns string en formato YYYY-MM-DD
 */
export const obtenerFechaMinima = (): string => {
  const hoy = new Date();
  return hoy.toISOString().split('T')[0];
};

/**
 * Valida si una fecha es anterior a hoy
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @returns true si la fecha es pasada, false si es hoy o futura
 */
export const esFechaPasada = (fecha: string): boolean => {
  if (!fecha) return false;
  
  const fechaSeleccionada = new Date(fecha + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return fechaSeleccionada < hoy;
};

/**
 * Valida si una hora es anterior a la hora actual (solo para el día de hoy)
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @param hora - Hora en formato HH:MM
 * @returns true si la hora es pasada (solo aplica para el día de hoy)
 */
export const esHoraPasada = (fecha: string, hora: string): boolean => {
  if (!fecha || !hora) return false;
  
  const fechaSeleccionada = new Date(fecha + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Solo validar hora si es el día de hoy
  if (fechaSeleccionada.getTime() !== hoy.getTime()) {
    return false;
  }
  
  const ahora = new Date();
  const [horaSeleccionada, minutoSeleccionado] = hora.split(':').map(Number);
  const fechaHoraSeleccionada = new Date();
  fechaHoraSeleccionada.setHours(horaSeleccionada, minutoSeleccionado, 0, 0);
  
  return fechaHoraSeleccionada < ahora;
};

/**
 * Valida si una fecha y hora combinadas son válidas (no en el pasado)
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @param hora - Hora en formato HH:MM
 * @returns objeto con validación y mensaje de error
 */
export const validarFechaHora = (fecha: string, hora: string): { 
  valido: boolean; 
  mensaje?: string;
} => {
  if (!fecha) {
    return { valido: false, mensaje: 'Debe seleccionar una fecha' };
  }
  
  if (!hora) {
    return { valido: false, mensaje: 'Debe seleccionar una hora' };
  }
  
  if (esFechaPasada(fecha)) {
    return { 
      valido: false, 
      mensaje: 'No se puede agendar una cita en una fecha pasada' 
    };
  }
  
  if (esHoraPasada(fecha, hora)) {
    return { 
      valido: false, 
      mensaje: 'No se puede agendar una cita en una hora pasada' 
    };
  }
  
  return { valido: true };
};

/**
 * Obtiene un mensaje descriptivo de error para fechas/horas inválidas
 */
export const obtenerMensajeError = (fecha: string, hora: string): string | null => {
  const validacion = validarFechaHora(fecha, hora);
  return validacion.valido ? null : validacion.mensaje || null;
};

/**
 * Formatea una fecha para mostrar en formato legible
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @returns string en formato DD/MM/YYYY
 */
export const formatearFechaLegible = (fecha: string): string => {
  if (!fecha) return '';
  
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Formatea una hora para mostrar en formato legible
 * @param hora - Hora en formato HH:MM
 * @returns string en formato HH:MM AM/PM
 */
export const formatearHoraLegible = (hora: string): string => {
  if (!hora) return '';
  
  const [hours, minutes] = hora.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};