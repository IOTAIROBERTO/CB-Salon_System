export type { Servicio } from '../db/db';

export interface ServicioFormData {
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
  comision?: number;
  duracion?: number;
  tiempoProceso?: number;
  tiempoCierre?: number;
  descripcion?: string; // lo que ve la clienta en «Más info» de la app
}

