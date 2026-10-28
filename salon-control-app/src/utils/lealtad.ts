// Club Cristina Borquez: programa de lealtad por puntos (versión 4, octubre 2026).
// Lógica pura, sin base de datos: los puntos se recalculan siempre desde las
// citas cobradas y las ventas, así nunca quedan desfasados y cada movimiento
// se puede explicar a la clienta. Arranca en limpio el 1 de enero de 2027.
//
// Reglas aprobadas el 22 de octubre de 2026:
// - Cinco niveles con colores de la marca: Marfil, Miel, Ámbar, Dorado y Ónix. El nivel lo marcan los puntos
//   disponibles, contando solo los ganados en los últimos 12 meses: gastar puntos (regalos, saldo, tarjeta) baja
//   el nivel; así nadie se confía en los niveles altos.
// - 1 punto por cada $10 en servicios y por cada $5 en producto, multiplicado por el nivel.
// - Puntos dobles en el mes de cumpleaños y en los días flojos (martes y miércoles); no se acumulan entre sí.
// - Bonos: bienvenida (más si llegó recomendada), reserva en línea y aniversario en el Club.
// - Tres tipos de beneficio, que siempre mejoran al subir y nunca se pierden de un nivel al siguiente:
//   1. Permanentes mientras se esté en el nivel, sin gastar puntos (BENEFICIOS_NIVEL: descuentos, flequillo, break;
//      Ónix además un antojo y una bebida de cortesía al mes). Café, té caliente y agua son de cortesía para todas.
//   2. Regalo de nivel: uno por nivel, cuesta puntos, se tacha al usarlo y se renueva cada 12 meses (REGALOS_NIVEL).
//   3. Celebraciones gratis: cumpleaños, aniversario, amiga recomendada y constancia.
// - Inactividad por días desde la última visita o compra: 5% a los 75, 7% a los 90 y 12% cada 30 días más.
//   Dorado y Ónix tienen 15 días más de gracia en cada tramo.
// - Las prioridades de agenda (sábados, diciembre, novias) son gestión interna de Cristina: no se publican.

export type Nivel = 'marfil' | 'miel' | 'ambar' | 'dorado' | 'onix';
export const NIVELES: Nivel[] = ['marfil', 'miel', 'ambar', 'dorado', 'onix'];
export type ClaveRegalo = 'regaloMiel' | 'regaloAmbar' | 'regaloDorado' | 'regaloOnix';
export type ClaveBeneficio = 'cumple' | 'constancia' | 'flequillo' | 'antojoOnix' | 'referida' | ClaveRegalo;

/** Canje registrado en la clienta: una cortesía o regalo, o puntos cambiados por saldo o por tarjeta de regalo */
export interface Canje {
  clave: ClaveBeneficio | 'saldo' | 'tarjeta';
  fecha: string; // ISO
  citaId?: string;
  puntos?: number;
}

export interface ParametrosCirculo {
  version: number;               // los ajustes guardados de otra versión se ignoran
  inicio: string;                // YYYY-MM-DD
  bienvenida: number;
  bienvenidaReferida: number;    // extra de bienvenida para la clienta que llegó recomendada
  pesosPorPuntoServicio: number; // pesos en servicios (sin propina) por cada punto
  pesosPorPuntoProducto: number; // pesos en producto por cada punto
  reservaEnLinea: number;        // cita reservada desde la app
  referida: number;              // amiga recomendada que pagó otro servicio (sin descuento)
  referidaDescuento: number;     // % en la próxima cita por amiga que pagó diseño de color o maquillaje
  referidaTope: number;          // tope en pesos de ese descuento
  miel: number;                  // puntos disponibles (de los últimos 12 meses) para cada nivel
  ambar: number;
  dorado: number;
  onix: number;
  multiplicadorMiel: number;     // puntos por compra en cada nivel (Marfil = 1)
  multiplicadorAmbar: number;
  multiplicadorDorado: number;
  multiplicadorOnix: number;
  pesosPorPuntoCanje: number;    // saldo a favor por cada punto canjeado
  canjeMinimo: number;           // puntos mínimos para canjear
  aniversarioDias: number;       // el aniversario cuenta si vino en estos últimos días
  inactividad1Dias: number;      // primer descuento por inactividad
  inactividad1Pct: number;
  inactividad2Dias: number;      // segundo descuento
  inactividad2Pct: number;
  inactividadCadaDias: number;   // después, cada cuántos días
  inactividadPct: number;        // y cuánto
  graciaExtraAltos: number;      // días extra de gracia en cada tramo para Dorado y Ónix
  constanciaVisitas: number;     // visitas seguidas para la ampolleta de constancia
  constanciaDias: number;        // días máximos entre una visita y la siguiente para no romper la racha
}

export const PARAMETROS_CIRCULO: ParametrosCirculo = {
  version: 4,
  inicio: '2027-01-01',
  bienvenida: 100,
  bienvenidaReferida: 100,
  pesosPorPuntoServicio: 10,
  pesosPorPuntoProducto: 5,
  reservaEnLinea: 40,
  referida: 200,
  referidaDescuento: 20,
  referidaTope: 600,
  miel: 150,   // v3: niveles rápidos (típica de color cada 8 semanas: Miel en la 1.ª visita, Ámbar ~3 meses, Dorado ~7)
  ambar: 500,
  dorado: 1000,
  onix: 1700,
  multiplicadorMiel: 1.05,
  multiplicadorAmbar: 1.1,
  multiplicadorDorado: 1.2,
  multiplicadorOnix: 1.3,
  pesosPorPuntoCanje: 0.25,
  canjeMinimo: 200,
  aniversarioDias: 90,
  inactividad1Dias: 75,
  inactividad1Pct: 5,
  inactividad2Dias: 90,
  inactividad2Pct: 7,
  inactividadCadaDias: 30,
  inactividadPct: 12,
  graciaExtraAltos: 15,
  constanciaVisitas: 5,
  constanciaDias: 70
};

export const NOMBRE_NIVEL: Record<Nivel, string> = { marfil: 'Marfil', miel: 'Miel', ambar: 'Ámbar', dorado: 'Dorado', onix: 'Ónix' };
/** Nombre del programa: siempre con el nombre completo del salón (decisión de octubre 2026) */
export const NOMBRE_CIRCULO = 'Club Cristina Borquez';

/** Días con puntos dobles (0 = domingo): martes y miércoles, los más flojos de la agenda */
export const DIAS_PUNTOS_DOBLES = [2, 3];

/** Servicios que, pagados por una amiga recomendada, dan el descuento: diseño de color (babylights, balayage,
 *  diseño, coronilla) y maquillaje social o de novia */
export const SERVICIOS_REFERIDA = ['s14', 's15', 's16', 's17', 's18', 's29', 's23', 's24', 's25', 's26', 's30', 's31'];
/** Maquillaje social y corte o peinado con descuento de nivel; los paquetes de novia no entran */
export const SERVICIOS_MAQUILLAJE = ['s23', 's24'];
export const SERVICIOS_CORTE_PEINADO = ['s01', 's02', 's04', 's21', 's22'];

/** 1. Permanentes: mientras esté en el nivel y sin gastar puntos. Cada nivel mejora al anterior. */
// antojosComida: todo lo de comer del menú de antojos (data/menuAntojos.ts); las bebidas no llevan descuento
export const BENEFICIOS_NIVEL: Record<Nivel, { productos: number; maquillaje: number; cortePeinado: number; tarjeta: number; flequillo: boolean; antojosComida: number; antojoCortesia: boolean }> = {
  marfil: { productos: 0, maquillaje: 0, cortePeinado: 0, tarjeta: 0, flequillo: false, antojosComida: 0, antojoCortesia: false },
  miel: { productos: 3, maquillaje: 5, cortePeinado: 0, tarjeta: 0, flequillo: false, antojosComida: 0, antojoCortesia: false },
  ambar: { productos: 5, maquillaje: 10, cortePeinado: 5, tarjeta: 5, flequillo: true, antojosComida: 5, antojoCortesia: false },
  dorado: { productos: 8, maquillaje: 12, cortePeinado: 10, tarjeta: 10, flequillo: true, antojosComida: 10, antojoCortesia: false },
  onix: { productos: 10, maquillaje: 15, cortePeinado: 15, tarjeta: 15, flequillo: true, antojosComida: 15, antojoCortesia: true }
};
/** Lista legible de lo permanente de un nivel (para la app, la ficha y los mensajes) */
export const permanentesDe = (nivel: Nivel, p: ParametrosCirculo = PARAMETROS_CIRCULO) => {
  const b = BENEFICIOS_NIVEL[nivel];
  return [
    multiplicador(nivel, p) > 1 ? `Tus compras suman ×${multiplicador(nivel, p)} puntos` : '',
    b.productos ? `${b.productos}% en productos` : '',
    b.maquillaje ? `${b.maquillaje}% en maquillaje social` : '',
    b.cortePeinado ? `${b.cortePeinado}% en corte y peinado` : '',
    b.flequillo ? 'Despunte de flequillo gratis, uno al mes' : '',
    b.antojosComida ? `${b.antojosComida}% en la comida del break (no incluye bebidas)` : '',
    b.antojoCortesia ? 'Comida y bebida del break de cortesía, una vez al mes' : '',
    b.tarjeta ? `Si cambias tus puntos por una tarjeta de regalo, valen ${b.tarjeta}% más` : ''
  ].filter(Boolean);
};

/** 2. Regalo de nivel: uno por nivel, cuesta puntos, se tacha al usarlo y vuelve a estar disponible a los 12 meses */
export const REGALOS_NIVEL: Record<ClaveRegalo, { nivel: Nivel; titulo: string; servicioId: string; precio: number; puntos: number }> = {
  regaloMiel: { nivel: 'miel', titulo: 'Ampolleta de hidratación', servicioId: 's03', precio: 150, puntos: 200 },
  regaloAmbar: { nivel: 'ambar', titulo: 'Mascarilla para el cabello', servicioId: 's06', precio: 500, puntos: 400 },
  regaloDorado: { nivel: 'dorado', titulo: 'Corte de cabello', servicioId: 's01', precio: 500, puntos: 450 },
  regaloOnix: { nivel: 'onix', titulo: 'Corte + ampolleta de hidratación', servicioId: 's04', precio: 650, puntos: 550 }
};
export const CLAVES_REGALO = Object.keys(REGALOS_NIVEL) as ClaveRegalo[];
export const esRegalo = (clave: string): clave is ClaveRegalo => clave in REGALOS_NIVEL;
/** Puntos que cuesta usar ese beneficio (solo los regalos de nivel cuestan) */
export const costoPuntos = (clave: string) => esRegalo(clave) ? REGALOS_NIVEL[clave].puntos : 0;

/** 3. Celebraciones gratis. Cumpleaños: puntos dobles todo el mes y una sorpresa; qué sorpresa lo deciden Cristina o Roberto. */
const CUMPLE = { titulo: 'Sorpresa por tu cumpleaños', servicioId: '' };
export const beneficioCumple = (_nivel?: Nivel) => CUMPLE;
/** Puntos de aniversario en el Club (si vino en los últimos 90 días) */
export const ANIVERSARIO_PUNTOS: Record<Nivel, number> = { marfil: 100, miel: 150, ambar: 200, dorado: 250, onix: 300 };

export const BENEFICIOS: Record<Exclude<ClaveBeneficio, ClaveRegalo>, { titulo: string; servicioId: string }> = {
  cumple: { titulo: 'Sorpresa por tu cumpleaños', servicioId: '' },
  constancia: { titulo: 'Ampolleta de hidratación por constancia', servicioId: 's03' },
  flequillo: { titulo: 'Despunte de flequillo del mes', servicioId: 's02' },
  antojoOnix: { titulo: 'Break de cortesía del mes (comida y bebida)', servicioId: '' },
  referida: { titulo: 'Descuento por amiga recomendada', servicioId: '' }
};
export const datosBeneficio = (clave: ClaveBeneficio, nivel: Nivel) => {
  if (esRegalo(clave)) { const r = REGALOS_NIVEL[clave]; return { titulo: `Regalo ${NOMBRE_NIVEL[r.nivel]}: ${r.titulo} (${r.puntos} pts)`, servicioId: r.servicioId }; }
  return clave === 'cumple' ? beneficioCumple(nivel) : BENEFICIOS[clave];
};

/** Título de un canje (también de canjes viejos que ya no existen) */
export const tituloCanje = (c: { clave: string; puntos?: number }) =>
  c.clave === 'saldo' ? `${c.puntos} puntos cambiados por saldo`
    : c.clave === 'tarjeta' ? `${c.puntos} puntos cambiados por tarjeta de regalo`
      : esRegalo(c.clave) ? `Regalo ${NOMBRE_NIVEL[REGALOS_NIVEL[c.clave].nivel]}: ${REGALOS_NIVEL[c.clave].titulo} (${REGALOS_NIVEL[c.clave].puntos} pts)`
        : (BENEFICIOS as Record<string, { titulo: string }>)[c.clave]?.titulo || c.clave;

const orden = (n: Nivel) => NIVELES.indexOf(n);
export const umbral = (nivel: Nivel, p: ParametrosCirculo = PARAMETROS_CIRCULO) => nivel === 'marfil' ? 0 : p[nivel];
export const multiplicador = (nivel: Nivel, p: ParametrosCirculo = PARAMETROS_CIRCULO) =>
  ({ marfil: 1, miel: p.multiplicadorMiel, ambar: p.multiplicadorAmbar, dorado: p.multiplicadorDorado, onix: p.multiplicadorOnix })[nivel];
export const descuentoProducto = (nivel: Nivel) => BENEFICIOS_NIVEL[nivel].productos;
/** Descuento permanente del nivel para un servicio: maquillaje social, corte y peinado */
export const descuentoServicio = (nivel: Nivel, servicioId: string) =>
  SERVICIOS_MAQUILLAJE.includes(servicioId) ? BENEFICIOS_NIVEL[nivel].maquillaje
    : SERVICIOS_CORTE_PEINADO.includes(servicioId) ? BENEFICIOS_NIVEL[nivel].cortePeinado : 0;
/** Saldo a favor por canjear esos puntos (redondeado a pesos) */
export const montoCanje = (puntos: number, p: ParametrosCirculo = PARAMETROS_CIRCULO) => Math.round(puntos * p.pesosPorPuntoCanje);
/** Regla de todos los niveles: los puntos valen dinero y se usan como saldo a favor o tarjeta de regalo */
export const REGLA_CANJE = 'En cualquier nivel cambias tus puntos por saldo a favor o por una tarjeta de regalo para alguien más';
/** Aviso que acompaña cualquier uso de puntos */
export const AVISO_GASTO = 'Usar puntos baja tus puntos disponibles y puede bajarte de nivel: tú decides si los usas o sigues subiendo';
/** «Saldo actual: n puntos = $x» con lo que puede hacer con ellos (o cuántos le faltan para el mínimo de canje) */
export const textoSaldoPuntos = (puntos: number, p: ParametrosCirculo = PARAMETROS_CIRCULO) => {
  const saldo = `Saldo actual: ${puntos.toLocaleString('es-MX')} puntos = $${montoCanje(puntos, p).toLocaleString('es-MX')}`;
  return puntos >= p.canjeMinimo
    ? `${saldo}. Sigue acumulando o úsalos en tu siguiente compra de producto o servicio.`
    : `${saldo}. Sigue acumulando: desde ${p.canjeMinimo} puntos los usas en tu siguiente compra de producto o servicio.`;
};
/** Monto de la tarjeta de regalo por esos puntos: desde Ámbar rinden más */
export const montoTarjeta = (puntos: number, nivel: Nivel, p: ParametrosCirculo = PARAMETROS_CIRCULO) =>
  Math.round(puntos * p.pesosPorPuntoCanje * (1 + BENEFICIOS_NIVEL[nivel].tarjeta / 100) + 1e-6); // + 1e-6: 57.5 sale 57.4999… en flotante
/** Descuento por amiga recomendada sobre ese subtotal, como porcentaje con el tope aplicado */
export const porcentajeReferida = (subtotal: number, p: ParametrosCirculo = PARAMETROS_CIRCULO) =>
  subtotal > 0 ? Math.min(p.referidaDescuento, Math.floor((p.referidaTope / subtotal) * 1000) / 10) : 0;

/** Ajustes guardados en configuración; los de una versión anterior del programa no se usan */
export const parametrosDe = (settings?: { circulo?: Partial<ParametrosCirculo> } | null): ParametrosCirculo =>
  settings?.circulo?.version === PARAMETROS_CIRCULO.version ? { ...PARAMETROS_CIRCULO, ...settings.circulo } : PARAMETROS_CIRCULO;

interface CitaL { id?: string; clienteId: string; servicioId: string; estado: string; fecha: string; fechaCompletada?: string; precioFinal?: number; propina?: number; origen?: string }
interface VentaL { clienteId: string; fecha: string; total: number; productos?: unknown[] }
interface ClienteL { id: string; cumple?: string; referidaPor?: string; canjes?: Canje[] }
interface ServicioL { id: string; categoria?: string }

export interface Movimiento { fecha: string; concepto: string; puntos: number }
export interface EstadoCirculo {
  puntos: number;        // saldo de puntos para canjear
  puntosNivel: number;   // puntos ganados en los últimos 12 meses: deciden el nivel
  nivel: Nivel;
  movimientos: Movimiento[];
  activa: boolean;
}

const dia = (c: CitaL) => (c.fechaCompletada || c.fecha).slice(0, 10);
const hoyISO = (hoy: Date) => `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
const masDias = (fecha: string, n: number) => {
  const d = new Date(`${fecha}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
};
const diaSemana = (fecha: string) => new Date(`${fecha}T12:00:00Z`).getUTCDay();

export const esServicioDeColor = (servicioId: string, servicios: ServicioL[]) =>
  servicios.find(s => s.id === servicioId)?.categoria === 'color';

export const nivelPorPuntos = (puntosNivel: number, p: ParametrosCirculo = PARAMETROS_CIRCULO): Nivel =>
  [...NIVELES].reverse().find(n => puntosNivel >= umbral(n, p)) || 'marfil';

/** Cuántos puntos (de los últimos 12 meses) faltan para el siguiente nivel; null si ya es Ónix */
export const siguienteNivel = (puntosNivel: number, p: ParametrosCirculo = PARAMETROS_CIRCULO): { nivel: Nivel; falta: number; desde: number } | null => {
  const n = NIVELES.find(x => umbral(x, p) > puntosNivel);
  return n ? { nivel: n, falta: umbral(n, p) - puntosNivel, desde: umbral(n, p) } : null;
};

/** Primera cita pagada de cada amiga recomendada (desde el arranque): si fue diseño de color o maquillaje da descuento */
const primerasDeReferidas = (clienteId: string, clientes: ClienteL[], citas: CitaL[], p: ParametrosCirculo, fin: string) =>
  clientes.filter(c => c.referidaPor === clienteId).flatMap(amiga => {
    const primera = citas.filter(x => x.clienteId === amiga.id && x.estado === 'completada' && dia(x) >= p.inicio && dia(x) <= fin)
      .sort((a, b) => dia(a).localeCompare(dia(b)))[0];
    return primera ? [{ fecha: dia(primera), conDescuento: SERVICIOS_REFERIDA.includes(primera.servicioId) }] : [];
  });

/** Saldo a favor de la clienta (movimientosSaldo): los de origen 'club' traen los puntos canjeados */
interface MovimientoL { clienteId: string; fecha: string; puntos?: number; origen?: string; concepto?: string }

/** Puntos, nivel y movimientos de una clienta a la fecha. Los canjes se leen de movimientosSaldo,
 *  que solo escribe la Dueña, para que nadie más pueda devolver puntos ya cambiados por dinero. */
export const estadoCirculo = (cliente: ClienteL, citas: CitaL[], ventas: VentaL[], clientes: ClienteL[], _servicios: ServicioL[],
  p: ParametrosCirculo = PARAMETROS_CIRCULO, hoy = new Date(), saldo: MovimientoL[] = []): EstadoCirculo => {
  const fin = hoyISO(hoy);
  const enRango = (f: string) => f >= p.inicio && f <= fin;
  type Ev = { fecha: string; concepto: string; puntos: number; visita: boolean; compra?: boolean; servicio?: boolean; aniversario?: number };
  const eventos: Ev[] = [];
  const cumpleMes = cliente.cumple?.slice(5, 7);
  for (const c of citas.filter(c => c.clienteId === cliente.id && c.estado === 'completada' && enRango(dia(c)))) {
    const f = dia(c);
    const monto = Math.max(0, (c.precioFinal || 0) - (c.propina || 0));
    eventos.push({ fecha: f, concepto: 'Visita', puntos: Math.floor(monto / p.pesosPorPuntoServicio), visita: true, compra: true, servicio: true });
    if (c.origen === 'app') eventos.push({ fecha: f, concepto: 'Reserva en línea', puntos: p.reservaEnLinea, visita: true });
  }
  for (const v of ventas.filter(v => v.clienteId === cliente.id && (v.productos?.length ?? 0) > 0 && enRango(v.fecha.slice(0, 10)))) {
    eventos.push({ fecha: v.fecha.slice(0, 10), concepto: 'Compra de producto', puntos: Math.floor((v.total || 0) / p.pesosPorPuntoProducto), visita: true, compra: true });
  }
  for (const r of primerasDeReferidas(cliente.id, clientes, citas, p, fin).filter(r => !r.conDescuento)) {
    eventos.push({ fecha: r.fecha, concepto: 'Amiga recomendada', puntos: p.referida, visita: false });
  }
  for (const m of saldo.filter(m => m.clienteId === cliente.id && m.origen === 'club' && m.puntos && enRango(m.fecha.slice(0, 10)))) {
    eventos.push({ fecha: m.fecha.slice(0, 10), concepto: m.concepto || 'Canje de puntos', puntos: -m.puntos!, visita: false });
  }
  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const movimientos: Movimiento[] = [];
  const primera = eventos.find(e => e.visita);
  if (!primera) return { puntos: 0, puntosNivel: 0, nivel: 'marfil', movimientos, activa: false };
  // Aniversarios en el Club (cuentan si vino en los últimos 90 días)
  for (let k = 1; ; k++) {
    const f = `${Number(primera.fecha.slice(0, 4)) + k}${primera.fecha.slice(4)}`;
    if (f > fin) break;
    eventos.push({ fecha: f, concepto: `${k}.º aniversario en el ${NOMBRE_CIRCULO}`, puntos: 0, visita: false, aniversario: k });
  }
  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  let puntos = 0;
  const ganados: { fecha: string; puntos: number }[] = [];   // lo ganado en los últimos 12 meses pone el techo del nivel
  // Nivel = puntos disponibles, contando solo lo ganado en 12 meses: gastar puntos baja el nivel; lo viejo ya no cuenta
  const puntosNivelAl = (f: string) => { const desde = masDias(f, -365); return Math.max(0, Math.min(puntos, ganados.filter(g => g.fecha > desde && g.fecha <= f).reduce((t, g) => t + g.puntos, 0))); };
  const nivelAl = (f: string) => nivelPorPuntos(puntosNivelAl(f), p);
  const sumar = (fecha: string, concepto: string, pts: number) => {
    movimientos.push({ fecha, concepto, puntos: pts });
    puntos += pts;
    if (pts > 0) ganados.push({ fecha, puntos: pts });
  };

  // Descuentos por inactividad pendientes desde la última visita, hasta la fecha «hasta» (sin incluirla)
  let ultimaVisita = primera.fecha;
  let tramosAplicados = 0;
  const aplicarInactividad = (hasta: string) => {
    for (;;) {
      const extra = orden(nivelAl(hasta)) >= orden('dorado') ? p.graciaExtraAltos : 0;
      const n = tramosAplicados;
      const dias = n === 0 ? p.inactividad1Dias : n === 1 ? p.inactividad2Dias : p.inactividad2Dias + (n - 1) * p.inactividadCadaDias;
      const pct = n === 0 ? p.inactividad1Pct : n === 1 ? p.inactividad2Pct : p.inactividadPct;
      const fecha = masDias(ultimaVisita, dias + extra);
      if (fecha >= hasta) return;
      tramosAplicados++;
      const pierde = Math.floor((Math.max(0, puntos) * pct) / 100);
      if (pierde) { movimientos.push({ fecha, concepto: `Sin visita desde hace ${dias + extra} días`, puntos: -pierde }); puntos -= pierde; }
    }
  };

  sumar(primera.fecha, `Bienvenida al ${NOMBRE_CIRCULO}`, p.bienvenida);
  if (cliente.referidaPor && p.bienvenidaReferida) sumar(primera.fecha, 'Bienvenida por venir recomendada', p.bienvenidaReferida);
  for (const e of eventos) {
    aplicarInactividad(e.fecha);
    if (e.visita) { ultimaVisita = e.fecha; tramosAplicados = 0; }
    if (e.aniversario) {
      if (ultimaVisita >= masDias(e.fecha, -p.aniversarioDias)) sumar(e.fecha, e.concepto, ANIVERSARIO_PUNTOS[nivelAl(e.fecha)]);
      continue;
    }
    if (!e.compra) { if (e.puntos) sumar(e.fecha, e.concepto, e.puntos); continue; }
    // Las compras suman con el multiplicador del nivel en que va la clienta; dobles en cumpleaños o martes y miércoles (servicios)
    const nivel = nivelAl(e.fecha);
    const x = multiplicador(nivel, p);
    const doble = (cumpleMes && e.fecha.slice(5, 7) === cumpleMes) ? 'cumpleaños' : (e.servicio && DIAS_PUNTOS_DOBLES.includes(diaSemana(e.fecha))) ? 'día doble' : '';
    const pts = Math.floor(e.puntos * x * (doble ? 2 : 1) + 1e-6); // + 1e-6: 100 × 1.1 da 110.000…01 o 109.999… en flotante
    if (!pts) continue;
    const notas = [x > 1 ? `×${x}` : '', doble ? `doble por ${doble}` : ''].filter(Boolean).join(', ');
    sumar(e.fecha, notas ? `${e.concepto} (${notas})` : e.concepto, pts);
  }
  aplicarInactividad(masDias(fin, 1));
  movimientos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  const puntosNivel = puntosNivelAl(fin);
  return { puntos, puntosNivel, nivel: nivelPorPuntos(puntosNivel, p), movimientos, activa: true };
};

/** Descuentos del 20% por amiga recomendada que aún puede usar (uno por cada amiga que pagó diseño de color o maquillaje) */
export const descuentosReferidaDisponibles = (cliente: ClienteL, clientes: ClienteL[], citas: CitaL[], p: ParametrosCirculo = PARAMETROS_CIRCULO, hoy = new Date()) =>
  Math.max(0, primerasDeReferidas(cliente.id, clientes, citas, p, hoyISO(hoy)).filter(r => r.conDescuento).length
    - (cliente.canjes || []).filter(c => c.clave === 'referida').length);

/** Visitas seguidas (sin pasar constanciaDias entre una y otra) desde la última ampolleta de constancia */
export const rachaConstancia = (cliente: ClienteL, citas: CitaL[], p: ParametrosCirculo = PARAMETROS_CIRCULO) => {
  const ultimoCanje = (cliente.canjes || []).filter(c => c.clave === 'constancia').map(c => c.fecha.slice(0, 10)).sort().pop() || '';
  const dias = [...new Set(citas.filter(c => c.clienteId === cliente.id && c.estado === 'completada' && dia(c) >= p.inicio).map(dia))].sort();
  let racha = 0, anterior = '';
  for (const d of dias) {
    const seguida = !!anterior && (new Date(`${d}T12:00:00`).getTime() - new Date(`${anterior}T12:00:00`).getTime()) / 86400000 <= p.constanciaDias;
    racha = seguida ? racha + 1 : 1;
    if (d <= ultimoCanje) racha = 0; // lo de antes de la última cortesía ya se usó
    anterior = d;
  }
  return racha;
};

/** Lo que la clienta puede usar hoy: regalos de nivel (si le alcanzan los puntos) y celebraciones */
export const beneficiosDisponibles = (cliente: ClienteL, nivel: Nivel, clientes: ClienteL[], citas: CitaL[], _servicios: ServicioL[],
  hoy = new Date(), p: ParametrosCirculo = PARAMETROS_CIRCULO, puntos = Infinity): ClaveBeneficio[] => {
  const canjes = cliente.canjes || [];
  const res: ClaveBeneficio[] = [];
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = String(hoy.getFullYear());
  const usado = (clave: ClaveBeneficio, prefijo: string) => canjes.some(c => c.clave === clave && c.fecha.startsWith(prefijo));
  if (cliente.cumple?.slice(5, 7) === mes && !usado('cumple', anio)) res.push('cumple');
  if (rachaConstancia(cliente, citas, p) >= p.constanciaVisitas) res.push('constancia');
  // Regalos de nivel: todos los de su nivel y los de abajo, uno de cada uno; vuelven a los 12 meses de usarlos
  const haceUnAnio = masDias(hoyISO(hoy), -365);
  for (const clave of CLAVES_REGALO) {
    const r = REGALOS_NIVEL[clave];
    if (orden(nivel) >= orden(r.nivel) && r.puntos <= puntos && !canjes.some(c => c.clave === clave && c.fecha.slice(0, 10) > haceUnAnio)) res.push(clave);
  }
  if (orden(nivel) >= orden('ambar') && !usado('flequillo', `${anio}-${mes}`)) res.push('flequillo');
  if (BENEFICIOS_NIVEL[nivel].antojoCortesia && !usado('antojoOnix', `${anio}-${mes}`)) res.push('antojoOnix');
  for (let i = descuentosReferidaDisponibles(cliente, clientes, citas, p, hoy); i > 0; i--) res.push('referida');
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
