// Círculo CB: programa de lealtad por puntos (rediseño de octubre 2026).
// Lógica pura, sin base de datos: los puntos se recalculan siempre desde las
// citas cobradas y las ventas, así nunca quedan desfasados y cada movimiento
// se puede explicar a la clienta. Arranca en limpio el 1 de enero de 2027.
//
// Diseño con las respuestas de la v3:
// - Bienvenida al activar la tarjeta (primera visita o compra del programa).
// - Un punto por cada $20 en servicios y por cada $10 en producto, multiplicado por
//   el nivel en que va la clienta: Marfil 1x, Dorado 1.15x, Ónix 1.37x.
// - Bonos fijos: reserva en línea, visita en su mes de cumpleaños, amiga recomendada.
// - Cada mes completo sin visita ni compra se pierde un porcentaje (meses de gracia opcionales).
// - Descuento en productos que se desbloquea con los puntos (5%, 10% y 15%).
// - Los puntos se canjean por saldo a favor (productos, color, maquillaje o corte).
// - Cortesías: detalle de cumpleaños y corte de cabello por constancia.

export type Nivel = 'marfil' | 'dorado' | 'onix';
export type ClaveBeneficio = 'cumple' | 'constancia';

/** Canje registrado en la clienta: una cortesía, o puntos cambiados por saldo ('saldo' con puntos) */
export interface Canje {
  clave: ClaveBeneficio | 'saldo';
  fecha: string; // ISO
  citaId?: string;
  puntos?: number;
}

export interface ParametrosCirculo {
  inicio: string;               // YYYY-MM-DD
  bienvenida: number;
  pesosPorPuntoServicio: number; // pesos en servicios (sin propina) por cada punto
  pesosPorPuntoProducto: number; // pesos en producto por cada punto
  reservaEnLinea: number;       // cita reservada desde la app
  cumpleanos: number;           // primera visita en su mes de cumpleaños
  referida: number;             // amiga recomendada que pagó un servicio de color
  inactividadPorcentaje: number; // % de puntos que se pierde por mes completo sin visita
  mesesDeGracia: number;        // meses seguidos sin visita que no castigan (0 = castiga desde el primer mes)
  dorado: number;               // puntos para Dorado
  onix: number;                 // puntos para Ónix
  multiplicadorDorado: number;  // puntos por compra en Dorado (Marfil = 1)
  multiplicadorOnix: number;    // puntos por compra en Ónix
  pesosPorPuntoCanje: number;   // saldo a favor por cada punto canjeado
  canjeMinimo: number;          // puntos mínimos para canjear
  constanciaVisitas: number;    // visitas seguidas para el corte de cortesía
  constanciaDias: number;       // días máximos entre una visita y la siguiente para no romper la racha
}

export const PARAMETROS_CIRCULO: ParametrosCirculo = {
  inicio: '2027-01-01',
  bienvenida: 50,
  pesosPorPuntoServicio: 20,
  pesosPorPuntoProducto: 10,
  reservaEnLinea: 20,
  cumpleanos: 50,
  referida: 100,
  inactividadPorcentaje: 10,
  mesesDeGracia: 0,
  dorado: 500,
  onix: 1500,
  multiplicadorDorado: 1.15,
  multiplicadorOnix: 1.37,
  pesosPorPuntoCanje: 0.25,
  canjeMinimo: 200,
  constanciaVisitas: 5,
  constanciaDias: 70
};

/** Descuento en productos que se desbloquea: 5% al 70% de Dorado, 10% al 60% de Ónix, 15% a medio camino dentro de Ónix */
export const descuentosProducto = (p: ParametrosCirculo = PARAMETROS_CIRCULO) => [
  { pct: 5, puntos: Math.round(p.dorado * 0.7) },
  { pct: 10, puntos: Math.round(p.onix * 0.6) },
  { pct: 15, puntos: Math.round(p.onix * 1.5) }
];
export const descuentoProducto = (puntos: number, p: ParametrosCirculo = PARAMETROS_CIRCULO) =>
  descuentosProducto(p).filter(d => puntos >= d.puntos).reduce((m, d) => Math.max(m, d.pct), 0);
export const siguienteDescuento = (puntos: number, p: ParametrosCirculo = PARAMETROS_CIRCULO) =>
  descuentosProducto(p).find(d => puntos < d.puntos) || null;
export const multiplicador = (nivel: Nivel, p: ParametrosCirculo = PARAMETROS_CIRCULO) =>
  nivel === 'onix' ? p.multiplicadorOnix : nivel === 'dorado' ? p.multiplicadorDorado : 1;
/** Saldo a favor por canjear esos puntos (redondeado a pesos) */
export const montoCanje = (puntos: number, p: ParametrosCirculo = PARAMETROS_CIRCULO) => Math.round(puntos * p.pesosPorPuntoCanje);

export const parametrosDe = (settings?: { circulo?: Partial<ParametrosCirculo> } | null): ParametrosCirculo =>
  ({ ...PARAMETROS_CIRCULO, ...(settings?.circulo || {}) });

export const NOMBRE_NIVEL: Record<Nivel, string> = { marfil: 'Marfil', dorado: 'Dorado', onix: 'Ónix' };
/** Nombre del programa: siempre con el nombre completo del salón (decisión de octubre 2026) */
export const NOMBRE_CIRCULO = 'Club Cristina Borquez';

export const BENEFICIOS: Record<ClaveBeneficio, { titulo: string; servicioId: string }> = {
  cumple: { titulo: 'Detalle de cumpleaños (cepillo, mini tratamiento o dulces con el logo)', servicioId: '' },
  constancia: { titulo: 'Corte de cabello de cortesía (por constancia)', servicioId: 's01' }
};
/** Título de un canje (también de canjes viejos que ya no existen) */
export const tituloCanje = (c: { clave: string; puntos?: number }) =>
  c.clave === 'saldo' ? `${c.puntos} puntos cambiados por saldo` : (BENEFICIOS as Record<string, { titulo: string }>)[c.clave]?.titulo || c.clave;

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

/** Saldo a favor de la clienta (movimientosSaldo): los de origen 'club' traen los puntos canjeados */
interface MovimientoL { clienteId: string; fecha: string; puntos?: number; origen?: string }

/** Puntos, nivel y movimientos de una clienta a la fecha. Los canjes por saldo se leen de movimientosSaldo,
 *  que solo escribe la Dueña, para que nadie más pueda devolver puntos ya cambiados por dinero. */
export const estadoCirculo = (cliente: ClienteL, citas: CitaL[], ventas: VentaL[], clientes: ClienteL[], servicios: ServicioL[],
  p: ParametrosCirculo = PARAMETROS_CIRCULO, hoy = new Date(), saldo: MovimientoL[] = []): EstadoCirculo => {
  const fin = hoyISO(hoy);
  const enRango = (f: string) => f >= p.inicio && f <= fin;
  type Ev = { fecha: string; concepto: string; puntos: number; visita: boolean; compra?: boolean };
  const eventos: Ev[] = [];
  const cumpleMes = cliente.cumple?.slice(5, 7);
  const cumpleAnios = new Set<string>();
  for (const c of citas.filter(c => c.clienteId === cliente.id && c.estado === 'completada' && enRango(dia(c))).sort((a, b) => dia(a).localeCompare(dia(b)))) {
    const f = dia(c);
    const monto = Math.max(0, (c.precioFinal || 0) - (c.propina || 0));
    eventos.push({ fecha: f, concepto: 'Visita', puntos: Math.floor(monto / p.pesosPorPuntoServicio), visita: true, compra: true });
    if (c.origen === 'app') eventos.push({ fecha: f, concepto: 'Reserva en línea', puntos: p.reservaEnLinea, visita: true });
    if (cumpleMes && f.slice(5, 7) === cumpleMes && !cumpleAnios.has(f.slice(0, 4))) {
      cumpleAnios.add(f.slice(0, 4));
      eventos.push({ fecha: f, concepto: 'Visita en su cumpleaños', puntos: p.cumpleanos, visita: true });
    }
  }
  for (const v of ventas.filter(v => v.clienteId === cliente.id && (v.productos?.length ?? 0) > 0 && enRango(v.fecha.slice(0, 10)))) {
    eventos.push({ fecha: v.fecha.slice(0, 10), concepto: 'Compra de producto', puntos: Math.floor((v.total || 0) / p.pesosPorPuntoProducto), visita: true, compra: true });
  }
  for (const amiga of clientes.filter(c => c.referidaPor === cliente.id)) {
    const color = citas.filter(x => x.clienteId === amiga.id && x.estado === 'completada' && esServicioDeColor(x.servicioId, servicios) && enRango(dia(x)))
      .map(dia).sort()[0];
    if (color) eventos.push({ fecha: color, concepto: 'Amiga recomendada', puntos: p.referida, visita: false });
  }
  for (const m of saldo.filter(m => m.clienteId === cliente.id && m.origen === 'club' && m.puntos && enRango(m.fecha.slice(0, 10)))) {
    eventos.push({ fecha: m.fecha.slice(0, 10), concepto: 'Canje por saldo a favor', puntos: -m.puntos!, visita: false });
  }
  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const movimientos: Movimiento[] = [];
  let puntos = 0;
  const primera = eventos.find(e => e.visita);
  if (!primera) return { puntos: 0, nivel: 'marfil', movimientos, activa: false };
  movimientos.push({ fecha: primera.fecha, concepto: `Bienvenida al ${NOMBRE_CIRCULO}`, puntos: p.bienvenida });
  puntos += p.bienvenida;
  // Mes por mes desde que se activó: suma lo del mes y, pasados los meses de gracia sin visita, descuenta.
  let sinVisita = 0;
  for (let mes = mesDe(primera.fecha); mes <= mesDe(fin); mes = mesSiguiente(mes)) {
    const delMes = eventos.filter(e => mesDe(e.fecha) === mes);
    for (const e of delMes) {
      // Las compras suman con el multiplicador del nivel en que va la clienta en ese momento
      const x = e.compra ? multiplicador(nivelPorPuntos(puntos, p), p) : 1;
      const pts = e.compra ? Math.floor(e.puntos * x + 1e-6) : e.puntos; // + 1e-6: 100 × 1.15 da 114.999… en flotante
      if (!pts) continue;
      movimientos.push({ fecha: e.fecha, concepto: x > 1 ? `${e.concepto} (×${x})` : e.concepto, puntos: pts });
      puntos += pts;
    }
    if (delMes.some(e => e.visita)) sinVisita = 0;
    else if (mes < mesDe(fin) && ++sinVisita > p.mesesDeGracia) {
      const pierde = Math.floor((puntos * p.inactividadPorcentaje) / 100);
      if (pierde) {
        movimientos.push({ fecha: `${mes}-28`, concepto: 'Mes sin visita', puntos: -pierde });
        puntos -= pierde;
      }
    }
  }
  return { puntos, nivel: nivelPorPuntos(puntos, p), movimientos, activa: true };
};

/** Amigas recomendadas que ya pagaron al menos un servicio de color */
export const referidasConColor = (clienteId: string, clientes: ClienteL[], citas: CitaL[], servicios: ServicioL[]) =>
  clientes.filter(c => c.referidaPor === clienteId &&
    citas.some(x => x.clienteId === c.id && x.estado === 'completada' && esServicioDeColor(x.servicioId, servicios))).length;

/** Visitas seguidas (sin pasar constanciaDias entre una y otra) desde el último corte de cortesía */
export const rachaConstancia = (cliente: ClienteL, citas: CitaL[], p: ParametrosCirculo = PARAMETROS_CIRCULO) => {
  const ultimoCanje = (cliente.canjes || []).filter(c => c.clave === 'constancia').map(c => c.fecha.slice(0, 10)).sort().pop() || '';
  const dias = [...new Set(citas.filter(c => c.clienteId === cliente.id && c.estado === 'completada' && dia(c) >= p.inicio).map(dia))].sort();
  let racha = 0, anterior = '';
  for (const d of dias) {
    const seguida = !!anterior && (new Date(`${d}T12:00:00`).getTime() - new Date(`${anterior}T12:00:00`).getTime()) / 86400000 <= p.constanciaDias;
    racha = seguida ? racha + 1 : 1;
    if (d <= ultimoCanje) racha = 0; // lo de antes del último corte ya se usó
    anterior = d;
  }
  return racha;
};

/** Cortesías que la clienta puede recibir hoy: detalle en su mes de cumpleaños y corte por constancia */
export const beneficiosDisponibles = (cliente: ClienteL, _nivel: Nivel, _clientes: ClienteL[], citas: CitaL[], _servicios: ServicioL[],
  hoy = new Date(), p: ParametrosCirculo = PARAMETROS_CIRCULO): ClaveBeneficio[] => {
  const canjes = cliente.canjes || [];
  const res: ClaveBeneficio[] = [];
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = String(hoy.getFullYear());
  if (cliente.cumple?.slice(5, 7) === mes && !canjes.some(c => c.clave === 'cumple' && c.fecha.startsWith(anio))) res.push('cumple');
  if (rachaConstancia(cliente, citas, p) >= p.constanciaVisitas) res.push('constancia');
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
