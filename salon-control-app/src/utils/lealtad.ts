// Círculo CB: programa de lealtad (propuesta aprobada en octubre 2026).
// Lógica pura, sin base de datos: el nivel se calcula siempre con las citas
// cobradas y las ventas de los últimos 12 meses, así nunca queda desfasado.

export type Nivel = 'marfil' | 'dorado' | 'onix';
export type ClaveBeneficio = 'cumple' | 'referido' | 'matizAnual' | 'ampolleta' | 'mascarilla';

export interface Canje {
  clave: ClaveBeneficio;
  fecha: string; // ISO
  citaId?: string;
}

export const NIVELES: Record<Nivel, { nombre: string; desde: number }> = {
  marfil: { nombre: 'Marfil', desde: 0 },
  dorado: { nombre: 'Dorado', desde: 5000 },
  onix: { nombre: 'Ónix', desde: 12000 }
};

export const BENEFICIOS: Record<ClaveBeneficio, { titulo: string; servicioId: string }> = {
  cumple: { titulo: 'Despunte o flequillo de cortesía (cumpleaños)', servicioId: 's02' },
  referido: { titulo: 'Matiz corto de cortesía (trajo a una amiga)', servicioId: 's10' },
  matizAnual: { titulo: 'Matiz corto anual de cortesía', servicioId: 's10' },
  ampolleta: { titulo: 'Ampolleta de hidratación de cortesía', servicioId: 's03' },
  mascarilla: { titulo: 'Mascarilla en cabina de cortesía', servicioId: 's06' }
};

interface CitaL { clienteId: string; servicioId: string; estado: string; fecha: string; fechaCompletada?: string; precioFinal?: number; propina?: number }
interface VentaL { clienteId: string; fecha: string; total: number }
interface ClienteL { id: string; cumple?: string; referidaPor?: string; canjes?: Canje[] }
interface ServicioL { id: string; categoria?: string }

const UN_ANIO = 365 * 24 * 60 * 60 * 1000;
const desdeHaceUnAnio = (hoy: Date) => new Date(hoy.getTime() - UN_ANIO).toISOString().slice(0, 10);

/** Lo que gastó la clienta en 12 meses: citas cobradas sin propina + producto */
export const gastoDoceMeses = (clienteId: string, citas: CitaL[], ventas: VentaL[], hoy = new Date()) => {
  const desde = desdeHaceUnAnio(hoy);
  const servicios = citas
    .filter(c => c.clienteId === clienteId && c.estado === 'completada' && (c.fechaCompletada || c.fecha).slice(0, 10) >= desde)
    .reduce((t, c) => t + (c.precioFinal || 0) - (c.propina || 0), 0); // igual que Reportes
  const productos = ventas
    .filter(v => v.clienteId === clienteId && v.fecha.slice(0, 10) >= desde)
    .reduce((t, v) => t + (v.total || 0), 0);
  return servicios + productos;
};

export const nivelDe = (gasto: number): Nivel =>
  gasto >= NIVELES.onix.desde ? 'onix' : gasto >= NIVELES.dorado.desde ? 'dorado' : 'marfil';

/** Cuánto falta para el siguiente nivel (null si ya es Ónix) */
export const siguienteNivel = (gasto: number): { nivel: Nivel; falta: number } | null =>
  gasto < NIVELES.dorado.desde ? { nivel: 'dorado', falta: NIVELES.dorado.desde - gasto }
    : gasto < NIVELES.onix.desde ? { nivel: 'onix', falta: NIVELES.onix.desde - gasto }
      : null;

export const esServicioDeColor = (servicioId: string, servicios: ServicioL[]) =>
  servicios.find(s => s.id === servicioId)?.categoria === 'color';

/** Cortesía que se aplica en cada servicio de color según el nivel */
export const beneficioEnColor = (nivel: Nivel): ClaveBeneficio | null =>
  nivel === 'onix' ? 'mascarilla' : nivel === 'dorado' ? 'ampolleta' : null;

/** Amigas recomendadas que ya pagaron al menos un servicio de color */
export const referidasConColor = (clienteId: string, clientes: ClienteL[], citas: CitaL[], servicios: ServicioL[]) =>
  clientes.filter(c => c.referidaPor === clienteId &&
    citas.some(x => x.clienteId === c.id && x.estado === 'completada' && esServicioDeColor(x.servicioId, servicios))).length;

/**
 * Beneficios de uso limitado que la clienta puede canjear hoy.
 * (Los de cada color, ampolleta o mascarilla, se ofrecen en el cobro.)
 */
// ponytail: el matiz por referido no vence; agregar los 3 meses de vigencia si se abusa.
export const beneficiosDisponibles = (cliente: ClienteL, nivel: Nivel, clientes: ClienteL[], citas: CitaL[], servicios: ServicioL[], hoy = new Date()): ClaveBeneficio[] => {
  const canjes = cliente.canjes || [];
  const res: ClaveBeneficio[] = [];
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = String(hoy.getFullYear());
  if (cliente.cumple?.slice(5, 7) === mes && !canjes.some(c => c.clave === 'cumple' && c.fecha.startsWith(anio))) res.push('cumple');
  if (nivel === 'onix' && !canjes.some(c => c.clave === 'matizAnual' && c.fecha.slice(0, 10) >= desdeHaceUnAnio(hoy))) res.push('matizAnual');
  const pendientes = referidasConColor(cliente.id, clientes, citas, servicios) - canjes.filter(c => c.clave === 'referido').length;
  for (let i = 0; i < pendientes; i++) res.push('referido');
  return res;
};

/** wa.me con el teléfono de la clienta (10 dígitos de México → 52) */
export const enlaceWhatsApp = (telefono: string | undefined, texto: string) => {
  const digitos = (telefono || '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  const numero = digitos.length === 10 ? '52' + digitos : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
};
