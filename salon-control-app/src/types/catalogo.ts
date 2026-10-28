export type { Servicio } from '../db/db';

export interface ServicioFormData {
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
  comision?: number;
  duracion?: number;
  tiempoProceso?: number;
  tiempoCierre?: number;
  descripcionApp?: string; // lo que ve la clienta en «Más info» de la app (descripcion = notas internas)
  categoria?: string; // agrupa el servicio en la app y en las listas (utils/precios: CATEGORIAS)
}

