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
  archivado?: boolean; // Fuera del catálogo; se conserva por las citas viejas
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

