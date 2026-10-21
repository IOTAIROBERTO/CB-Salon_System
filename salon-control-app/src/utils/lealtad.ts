// Círculo CB: programa de lealtad por puntos (rediseño de octubre 2026).
// Lógica pura, sin base de datos: los puntos se recalculan siempre desde las
// citas cobradas y las ventas, así nunca quedan desfasados y cada movimiento
// se puede explicar a la clienta. Arranca en limpio el 1 de enero de 2027.
//
// - Bienvenida al activar la tarjeta (primera visita o compra del programa).
// - Puntos por cada $10 en servicios y, al doble, por cada $10 en producto.
// - Bonos: reserva en línea, visita en su mes de cumpleaños, amiga recomendada.
// - Cada mes completo sin visita ni compra se pierde un porcentaje de puntos.
// - El nivel sale de los puntos; los beneficios dependen del nivel.

export type Nivel = 'marfil' | 'dorado' | 'onix';
export type ClaveBeneficio = 'cumple' | 'referido' | 'matizAnual' | 'ampolleta' | 'mascarilla';

export interface Canje {
  clave: ClaveBeneficio;
  fecha: string; // ISO
  citaId?: string;
}

export interface ParametrosCirculo {
  inicio: string;               // YYYY-MM-DD
  bienvenida: number;
  porDiezServicio: number;      // puntos por cada $10 en servicios (sin propina)
  porDiezProducto: number;      // puntos por cada $10 en producto
  reservaEnLinea: number;       // cita reservada desde la app
  cumpleanos: number;           // primera visita en su mes de cumpleaños
  referida: number;             // amiga recomendada que pagó un servicio de color
  inactividadPorcentaje: number; // % de puntos que se pierde por mes completo sin visita
  dorado: number;               // puntos para Dorado
  onix: number;                 // puntos para Ónix
}

export const PARAMETROS_CIRCULO: ParametrosCirculo = {
  inicio: '2027-01-01',
  bienvenida: 100,
  porDiezServicio: 1,
  porDiezProducto: 2,
  reservaEnLinea: 50,
  cumpleanos: 100,
  referida: 150,
  inactividadPorcentaje: 10,
  dorado: 600,
  onix: 1500
};

export const parametrosDe = (settings?: { circulo?: Partial<ParametrosCirculo> } | null): ParametrosCirculo =>
  ({ ...PARAMETROS_CIRCULO, ...(settings?.circulo || {}) });

export const NOMBRE_NIVEL: Record<Nivel, string> = { marfil: 'Marfil', dorado: 'Dorado', onix: 'Ónix' };
/** Nombre del programa: siempre con el nombre completo del salón (decisión de octubre 2026) */
export const NOMBRE_CIRCULO = 'Club Cristina Borquez';

export const BENEFICIOS: Record<ClaveBeneficio, { titulo: string; servicioId: string }> = {
  cumple: { titulo: 'Despunte o flequillo de cortesía (cumpleaños)', servicioId: 's02' },
  referido: { titulo: 'Matiz corto de cortesía (trajo a una amiga)', servicioId: 's10' },
  matizAnual: { titulo: 'Matiz corto anual de cortesía', servicioId: 's10' },
  ampolleta: { titulo: 'Ampolleta de hidratación de cortesía', servicioId: 's03' },
  mascarilla: { titulo: 'Mascarilla en cabina de cortesía', servicioId: 's06' }
};

interface CitaL { id?: string; clienteId: string; servicioId: string; estado: string; fecha: string; fechaCompletada?: string; precioFinal?: number; propina?: number; origen?: string }
interface VentaL { clienteId: string; fecha: string; total: number; productos?: unknown[] }
interface ClienteL { id: string; cumple?: string; referidaPor?: string; canjes?: Canje[] }
interface ServicioL { id: string; categoria?: string }

export interface Movimiento { fecha: string; concepto: string; puntos: number }
export interface EstadoCirculo { puntos: number; nivel: Nivel; movimientos: Movimiento[]; activa: boolean }

const dia = (c: CitaL) => (c.fechaCompletada || c.fecha).slice(0, 10);
const mesDe = (fecha: string) => fecha.slice(0, 7);
const mesSiguiente = (mes: string) => {
  const [a, m] = mes.split('-').map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
};
const hoyISO = (hoy: Date) => `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

export const esServicioDeColor = (servicioId: string, servicios: ServicioL[]) =>
  servicios.find(s => s.id === servicioId)?.categoria === 'color';

export const nivelPorPuntos = (puntos: number, p: ParametrosCirculo = PARAMETROS_CIRCULO): Nivel =>
  puntos >= p.onix ? 'onix' : puntos >= p.dorado ? 'dorado' : 'marfil';

/** Cuántos puntos faltan para el siguiente nivel (null si ya es Ónix) */
export const siguienteNivel = (puntos: number, p: ParametrosCirculo = PARAMETROS_CIRCULO): { nivel: Nivel; falta: number } | null =>
  puntos < p.dorado ? { nivel: 'dorado', falta: p.dorado - puntos }
    : puntos < p.onix ? { nivel: 'onix', falta: p.onix - puntos }
      : null;

/** Puntos, nivel y movimientos de una clienta a la fecha */
export const estadoCirculo = (cliente: ClienteL, citas: CitaL[], ventas: VentaL[], clientes: ClienteL[], servicios: ServicioL[],
  p: ParametrosCirculo = PARAMETROS_CIRCULO, hoy = new Date()): EstadoCirculo => {
  const fin = hoyISO(hoy);
  const enRango = (f: string) => f >= p.inicio && f <= fin;
  type Ev = { fecha: string; concepto: string; puntos: number; visita: boolean };
  const eventos: Ev[] = [];
  const cumpleMes = cliente.cumple?.slice(5, 7);
  const cumpleAnios = new Set<string>();
  for (const c of citas.filter(c => c.clienteId === cliente.id && c.estado === 'completada' && enRango(dia(c))).sort((a, b) => dia(a).localeCompare(dia(b)))) {
    const f = dia(c);
    const monto = Math.max(0, (c.precioFinal || 0) - (c.propina || 0));
    eventos.push({ fecha: f, concepto: 'Visita', puntos: Math.floor(monto / 10) * p.porDiezServicio, visita: true });
    if (c.origen === 'app') eventos.push({ fecha: f, concepto: 'Reserva en línea', puntos: p.reservaEnLinea, visita: true });
    if (cumpleMes && f.slice(5, 7) === cumpleMes && !cumpleAnios.has(f.slice(0, 4))) {
      cumpleAnios.add(f.slice(0, 4));
      eventos.push({ fecha: f, concepto: 'Visita en su cumpleaños', puntos: p.cumpleanos, visita: true });
    }
  }
  for (const v of ventas.filter(v => v.clienteId === cliente.id && (v.productos?.length ?? 0) > 0 && enRango(v.fecha.slice(0, 10)))) {
    eventos.push({ fecha: v.fecha.slice(0, 10), concepto: 'Compra de producto', puntos: Math.floor((v.total || 0) / 10) * p.porDiezProducto, visita: true });
  }
  for (const amiga of clientes.filter(c => c.referidaPor === cliente.id)) {
    const color = citas.filter(x => x.clienteId === amiga.id && x.estado === 'completada' && esServicioDeColor(x.servicioId, servicios) && enRango(dia(x)))
      .map(dia).sort()[0];
    if (color) eventos.push({ fecha: color, concepto: 'Amiga recomendada', puntos: p.referida, visita: false });
  }
  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const movimientos: Movimiento[] = [];
  let puntos = 0;
  const primera = eventos.find(e => e.visita);
  if (!primera) return { puntos: 0, nivel: 'marfil', movimientos, activa: false };
  movimientos.push({ fecha: primera.fecha, concepto: `Bienvenida al ${NOMBRE_CIRCULO}`, puntos: p.bienvenida });
  puntos += p.bienvenida;
  // Mes por mes desde que se activó: suma lo del mes y, si el mes ya pasó sin visita, descuenta.
  for (let mes = mesDe(primera.fecha); mes <= mesDe(fin); mes = mesSiguiente(mes)) {
    const delMes = eventos.filter(e => mesDe(e.fecha) === mes);
    for (const e of delMes) {
      if (!e.puntos) continue;
      movimientos.push({ fecha: e.fecha, concepto: e.concepto, puntos: e.puntos });
      puntos += e.puntos;
    }
    if (mes < mesDe(fin) && !delMes.some(e => e.visita)) {
      const pierde = Math.floor((puntos * p.inactividadPorcentaje) / 100);
      if (pierde) {
        movimientos.push({ fecha: `${mes}-28`, concepto: 'Mes sin visita', puntos: -pierde });
        puntos -= pierde;
      }
    }
  }
  return { puntos, nivel: nivelPorPuntos(puntos, p), movimientos, activa: true };
};

/** Cortesía que se aplica en cada servicio de color según el nivel */
export const beneficioEnColor = (nivel: Nivel): ClaveBeneficio | null =>
  nivel === 'onix' ? 'mascarilla' : nivel === 'dorado' ? 'ampolleta' : null;

/** Amigas recomendadas que ya pagaron al menos un servicio de color */
export const referidasConColor = (clienteId: string, clientes: ClienteL[], citas: CitaL[], servicios: ServicioL[]) =>
  clientes.filter(c => c.referidaPor === clienteId &&
    citas.some(x => x.clienteId === c.id && x.estado === 'completada' && esServicioDeColor(x.servicioId, servicios))).length;

const UN_ANIO = 365 * 24 * 60 * 60 * 1000;
const desdeHaceUnAnio = (hoy: Date) => new Date(hoy.getTime() - UN_ANIO).toISOString().slice(0, 10);

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

/** Código de la clienta para su tarjeta (QR o código de barras): CB + 6 caracteres, fijo para su id */
export const codigoClienta = (id: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return 'CB' + (h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(-6);
};

/** wa.me con el teléfono de la clienta (10 dígitos de México → 52) */
export const enlaceWhatsApp = (telefono: string | undefined, texto: string) => {
  const digitos = (telefono || '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  const numero = digitos.length === 10 ? '52' + digitos : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
};
