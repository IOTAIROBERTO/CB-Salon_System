// Datos públicos del salón (Manual de marca, octubre 2026).
// Son los valores por defecto: lo guardado en Configuración tiene prioridad.
export const DATOS_SALON = {
  nombre: 'Cristina Bórquez Beauty Salon',
  nombreCorto: 'Cristina Bórquez',
  telefono: '662 161 4688',
  whatsapp: '526621614688',
  direccion: 'Plaza Galilea, Av. Saturnino Campoy 869, Col. Álvaro Obregón, 83170 Hermosillo, Son.',
  email: 'cristinaeborquez@gmail.com',
  instagram: '@cristinaborquez.beauty'
};

// Dónde se hace el trabajo de una cita. Sin valor = en el salón.
export const UBICACIONES = {
  salon: 'Hermosillo · en el salón',
  fuera: 'Fuera de Hermosillo',
  mexico: 'México en general',
  tucson: 'Tucson',
  phoenix: 'Phoenix',
  eua: 'EUA en general'
} as const;
export type Ubicacion = keyof typeof UBICACIONES;
