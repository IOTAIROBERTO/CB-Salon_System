export interface Servicio {
  id: string;
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
  comision?: number;
}

export interface ServicioFormData {
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
  comision?: number;
}

export const SERVICIOS_INICIALES: Servicio[] = [
  { id: 's1', nombre: 'Corte de cabello', precioSugerido: 450, anticipoSugerido: 150 },
  { id: 's2', nombre: 'Tinte completo', precioSugerido: 800, anticipoSugerido: 200 },
  { id: 's3', nombre: 'Manicure', precioSugerido: 200, anticipoSugerido: 0 }
];