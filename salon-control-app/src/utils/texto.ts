/** Sin acentos ni mayúsculas, para comparar nombres escritos a mano */
export const normalizar = (s = '') =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Últimos 10 dígitos de un teléfono (ignora lada de país y formato) */
export const telefono10 = (t = '') => t.replace(/\D/g, '').slice(-10);
