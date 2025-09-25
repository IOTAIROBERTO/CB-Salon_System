import { ServicioFormData } from '../types/catalogo';

export const validateServicioForm = (formData: ServicioFormData): string | null => {
  if (!formData.nombre.trim()) {
    return 'El nombre del servicio es obligatorio';
  }
  
  if (formData.precioSugerido <= 0) {
    return 'El precio sugerido debe ser mayor a 0';
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
  return `$${price.toLocaleString()}`;
};