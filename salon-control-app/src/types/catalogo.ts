export interface Servicio {
  id: string;
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
  comision?: number;
  categoria?: string;
  duracion?: number; // minutos en total
  tiempoProceso?: number; // espera dentro de la duración (quien atiende queda libre)
  tiempoCierre?: number; // activo al final: enjuague, secado, peinado
}

export interface ServicioFormData {
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
  comision?: number;
  duracion?: number;
  tiempoProceso?: number;
  tiempoCierre?: number;
}

export const SERVICIOS_INICIALES: Servicio[] = [
  { id: 's1', nombre: 'Corte de cabello', precioSugerido: 450, anticipoSugerido: 150 },
  { id: 's2', nombre: 'Tinte completo', precioSugerido: 800, anticipoSugerido: 200 },
  { id: 's3', nombre: 'Manicure', precioSugerido: 200, anticipoSugerido: 0 }
];