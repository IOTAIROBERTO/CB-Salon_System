// Zonas fuera de Hermosillo: catálogo editable en Catálogo → «Zonas fuera de
// Hermosillo» (se guarda en configuracion.settings.zonas). Ningún nombre de
// ciudad queda fijo en el código: estos son solo los valores iniciales.
//
// Regla del salón: fuera de Hermosillo solo se hacen servicios de novia
// (maquillaje y peinado, y el paquete con la mamá). El diseño de color sale
// solo en las zonas marcadas (Arizona) y con un mínimo de clientas.

export interface Zona {
  id: string;
  nombre: string;          // «Bahía de Kino», «Phoenix y alrededores»…
  region: string;          // Para agrupar en el menú: «Sonora», «Arizona»…
  km: number;              // Ida y vuelta, para el traslado
  dias: number;            // Días de viaje (viáticos)
  color: boolean;          // ¿Se hacen diseños de color en esta zona?
  minimoClientas?: number; // Mínimo de clientas para ir (color)
  anticipacionDias?: number; // Con cuánta anticipación se agenda
  activa: boolean;
}

export const SALON = 'salon';
export const NOMBRE_SALON = 'Hermosillo · en el salón';

export const ZONAS_INICIALES: Zona[] = [
  { id: 'kino', nombre: 'Bahía de Kino', region: 'Sonora', km: 220, dias: 1, color: false, anticipacionDias: 7, activa: true },
  { id: 'guaymas', nombre: 'Guaymas', region: 'Sonora', km: 260, dias: 1, color: false, anticipacionDias: 7, activa: true },
  { id: 'empalme', nombre: 'Empalme', region: 'Sonora', km: 250, dias: 1, color: false, anticipacionDias: 7, activa: true },
  { id: 'san-carlos', nombre: 'San Carlos', region: 'Sonora', km: 300, dias: 2, color: false, anticipacionDias: 7, activa: true },
  // Mínimo = clientas para ganar más que quedándose en el salón en un viaje de 3 días, sin asistente: Cristina
  // atiende 1 o 2 por día de trabajo con descanso en medio (6 o 7 por semana), gasolina por tanque del Mazda 2 (21 oct): Tucson a US$200 y Phoenix a US$220 («Calculadora de viajes - Arizona y Sonora»)
  { id: 'tucson', nombre: 'Tucson y alrededores', region: 'Arizona', km: 730, dias: 2, color: true, minimoClientas: 4, anticipacionDias: 14, activa: true },
  { id: 'phoenix', nombre: 'Phoenix, Glendale y Scottsdale', region: 'Arizona', km: 1150, dias: 3, color: true, minimoClientas: 3, anticipacionDias: 14, activa: true }
];

// Citas guardadas con el esquema anterior (lista fija de ubicaciones)
const ANTERIORES: Record<string, string> = {
  fuera: 'Fuera de Hermosillo', mexico: 'México en general', tucson: 'Tucson', phoenix: 'Phoenix', eua: 'EUA en general'
};

export const zonasDe = (settings?: { zonas?: Zona[] } | null): Zona[] => settings?.zonas?.length ? settings.zonas : ZONAS_INICIALES;

/** Nombre que se muestra para la ubicación de una cita */
export const nombreUbicacion = (ubicacion: string | undefined, zonas: Zona[]) =>
  !ubicacion || ubicacion === SALON ? NOMBRE_SALON
    : zonas.find(z => z.id === ubicacion)?.nombre ?? ANTERIORES[ubicacion] ?? ubicacion;

/** Id nuevo para una zona a partir de su nombre */
export const idZona = (nombre: string, existentes: Zona[]) => {
  const base = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'zona';
  let id = base, n = 2;
  while (id === SALON || existentes.some(z => z.id === id)) id = `${base}-${n++}`;
  return id;
};
