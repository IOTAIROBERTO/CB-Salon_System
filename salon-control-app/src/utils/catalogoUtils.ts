import { ServicioFormData } from '../types/catalogo';
import { formatCurrency } from './financialUtils';

export const validateServicioForm = (formData: ServicioFormData): string | null => {
  if (!formData.nombre.trim()) {
    return 'El nombre del servicio es obligatorio';
  }

  if (formData.precioSugerido <= 0) {
    return 'El precio sugerido debe ser mayor a 0';
  }

  if ((formData.tiempoProceso || 0) + (formData.tiempoCierre || 0) > (formData.duracion || 60)) {
    return 'El proceso más el cierre no pueden pasar de la duración total';
  }

  if (formData.anticipoSugerido < 0) {
    return 'El anticipo no puede ser negativo';
  }

  return null;
};

export const generateServicioId = (): string => {
  return 's' + Date.now();
};

export const formatPrice = (price: number): string => {
  return formatCurrency(price);
};