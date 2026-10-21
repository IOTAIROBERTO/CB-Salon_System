// Agenda: horarios libres según la duración de cada servicio, el horario del
// salón, quién atiende y las citas ya agendadas. Lógica pura, sin base de
// datos: CB Control la usa al agendar y la app de clientas la usará igual.
//
// Un servicio ocupa a quien atiende en su tiempo activo; durante el tiempo de
// proceso (por ejemplo, mientras el tinte actúa) esa persona puede empezar otra
// cita. Al final de cada cita se suma el margen para limpiar y preparar.

export type DiaSemana = '0' | '1' | '2' | '3' | '4' | '5' | '6'; // 0 = domingo
export interface HorarioDia { abre: string; cierra: string; descansoDe?: string; descansoA?: string }
export type HorarioSemana = Partial<Record<DiaSemana, HorarioDia | null>>;
/** Bloqueo de agenda: `personaId` o 'todas'; fechas locales 'YYYY-MM-DDTHH:mm' */
export interface Bloqueo { id: string; personaId: string; desde: string; hasta: string; motivo?: string }
/** Servicios largos: si duran al menos `horas`, no se ofrecen después de `ultimaHora` (Cristina puede saltarlo a mano, con aviso) */
export interface LimiteLargo { horas: number; ultimaHora: string }
export interface ConfigAgenda {
  horario: HorarioSemana;
  margen: number;            // minutos entre citas
  intervalo: number;         // cada cuántos minutos se ofrecen horarios
  anticipacionHoras: number; // mínimo para que una clienta aparte
  maxDias: number;           // hasta cuántos días adelante
  bloqueos: Bloqueo[];
  largos?: LimiteLargo[];
}
/** Quién atiende: sin categorías hace todos los servicios */
export interface Persona { id: string; nombre: string; categorias?: string[] }

export const DUENA = 'cristina';

const abierto = (abre: string, cierra: string): HorarioDia => ({ abre, cierra });
// Lunes a sábado de 10 a 19 (respuestas de octubre 2026). El domingo no se
// ofrece: se abre solo con citas que agenda el salón a mano.
export const AGENDA_INICIAL: ConfigAgenda = {
  horario: {
    '0': null,
    '1': abierto('10:00', '19:00'), '2': abierto('10:00', '19:00'), '3': abierto('10:00', '19:00'),
    '4': abierto('10:00', '19:00'), '5': abierto('10:00', '19:00'), '6': abierto('10:00', '19:00')
  },
  margen: 15, intervalo: 30, anticipacionHoras: 3, maxDias: 60, bloqueos: [],
  // Un trabajo largo empieza temprano: de 4 h o más, a más tardar 13:00; de 2 h o más, 16:00
  largos: [{ horas: 4, ultimaHora: '13:00' }, { horas: 2, ultimaHora: '16:00' }]
};

/** Hora límite para empezar un servicio de `minutos` (la regla más estricta que le aplica) */
export const limiteInicio = (minutos: number, config: ConfigAgenda) =>
  (config.largos ?? AGENDA_INICIAL.largos ?? [])
    .filter(l => minutos >= l.horas * 60)
    .sort((a, b) => b.horas - a.horas)[0];

interface ServicioA { id: string; nombre?: string; categoria?: string; duracion?: number; tiempoProceso?: number; tiempoCierre?: number }
interface CitaA {
  id?: string; fecha: string; hora: string; estado?: string; servicioId: string;
  serviciosAdicionales?: { servicioId: string }[]; atiendeId?: string;
}
export interface Tramo { de: number; a: number }

export const aMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
export const aHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const solapa = (x: Tramo, y: Tramo) => x.de < y.a && y.de < x.a;
export const atiende = (c: { atiendeId?: string }) => c.atiendeId || DUENA;
export const diaSemana = (fecha: string) => String(new Date(`${fecha}T12:00:00`).getDay()) as DiaSemana;

/** Tiempos de un servicio: activo al inicio, proceso (libre) y activo al cierre */
export const tiemposServicio = (s?: ServicioA) => {
  const total = s?.duracion || 60;
  const proceso = Math.min(Math.max(s?.tiempoProceso || 0, 0), total);
  const cierre = Math.min(Math.max(s?.tiempoCierre || 0, 0), total - proceso);
  return { total, proceso, cierre, inicio: total - proceso - cierre };
};

/** Tramos en que la cita ocupa a quien atiende (con margen) y hora de término */
export const tramosCita = (inicio: number, servicioId: string, adicionales: string[], servicios: ServicioA[], margen: number) => {
  const t = tiemposServicio(servicios.find(s => s.id === servicioId));
  const extra = adicionales.reduce((m, id) => m + (servicios.find(s => s.id === id)?.duracion || 30), 0);
  const fin = inicio + t.total + extra;
  const conMargen = (m: number): Tramo[] => (t.proceso > 0
    ? [{ de: inicio, a: inicio + t.inicio }, { de: inicio + t.inicio + t.proceso, a: fin + m }]
    : [{ de: inicio, a: fin + m }]).filter(x => x.a > x.de);
  // El margen solo separa citas entre sí; contra descansos y bloqueos cuenta el servicio
  return { tramos: conMargen(margen), sinMargen: conMargen(0), fin };
};

const tramosDeCita = (c: CitaA, servicios: ServicioA[], margen: number) =>
  tramosCita(aMin(c.hora), c.servicioId, (c.serviciosAdicionales || []).map(a => a.servicioId), servicios, margen);

/** Parte del bloqueo que cae en la fecha, en minutos del día */
const tramoBloqueo = (b: Bloqueo, fecha: string): Tramo | null => {
  const [dd, hd = '00:00'] = b.desde.split('T');
  const [dh, hh = '23:59'] = b.hasta.split('T');
  if (fecha < dd || fecha > dh) return null;
  return { de: fecha === dd ? aMin(hd) : 0, a: fecha === dh ? aMin(hh) : 24 * 60 };
};

/** Lo que ocupa a una persona en una fecha: sus citas (con margen) y lo fijo (descanso, bloqueos) */
export const ocupacion = (personaId: string, fecha: string, citas: CitaA[], servicios: ServicioA[], config: ConfigAgenda, ignorarCitaId?: string) => {
  const deCitas: Tramo[] = [];
  for (const c of citas) {
    if (c.fecha !== fecha || c.estado === 'cancelada' || c.id === ignorarCitaId || atiende(c) !== personaId) continue;
    deCitas.push(...tramosDeCita(c, servicios, config.margen).tramos);
  }
  const fijos: Tramo[] = [];
  const h = config.horario[diaSemana(fecha)];
  if (h?.descansoDe && h.descansoA) fijos.push({ de: aMin(h.descansoDe), a: aMin(h.descansoA) });
  for (const b of config.bloqueos || []) {
    if (b.personaId !== 'todas' && b.personaId !== personaId) continue;
    const t = tramoBloqueo(b, fecha);
    if (t) fijos.push(t);
  }
  return { citas: deCitas, fijos };
};

const puedeHacer = (p: Persona, s?: ServicioA) => !p.categorias?.length || (!!s?.categoria && p.categorias.includes(s.categoria));

export interface HorarioLibre { hora: string; personaId: string }

/** Horarios en que alguien que hace el servicio está libre de principio a fin */
export const horariosLibres = (o: {
  fecha: string; servicioId: string; adicionales?: string[]; personas: Persona[]; citas: CitaA[];
  servicios: ServicioA[]; config: ConfigAgenda; ahora?: Date; personaId?: string; ignorarCitaId?: string;
  respetarAnticipacion?: boolean;
}): HorarioLibre[] => {
  const { fecha, servicioId, adicionales = [], personas, citas, servicios, config, ahora = new Date(), respetarAnticipacion = true } = o;
  const h = config.horario[diaSemana(fecha)];
  if (!h) return [];
  const servicio = servicios.find(s => s.id === servicioId);
  const limite = new Date(ahora.getTime() + (respetarAnticipacion ? config.anticipacionHoras : 0) * 3600000);
  const maxFecha = new Date(ahora.getTime() + config.maxDias * 86400000);
  if (respetarAnticipacion && new Date(`${fecha}T00:00:00`) > maxFecha) return [];

  const res: HorarioLibre[] = [];
  for (const p of personas) {
    if ((o.personaId && p.id !== o.personaId) || !puedeHacer(p, servicio)) continue;
    const ocupado = ocupacion(p.id, fecha, citas, servicios, config, o.ignorarCitaId);
    for (let t = aMin(h.abre); t < aMin(h.cierra); t += config.intervalo) {
      const { tramos, sinMargen, fin } = tramosCita(t, servicioId, adicionales, servicios, config.margen);
      if (fin > aMin(h.cierra)) break;
      const largo = limiteInicio(fin - t, config);
      if (largo && t > aMin(largo.ultimaHora)) continue;
      if (new Date(`${fecha}T${aHora(t)}:00`) < limite) continue;
      if (tramos.some(x => ocupado.citas.some(y => solapa(x, y))) || sinMargen.some(x => ocupado.fijos.some(y => solapa(x, y)))) continue;
      res.push({ hora: aHora(t), personaId: p.id });
    }
  }
  return res.sort((a, b) => a.hora.localeCompare(b.hora));
};

/** Avisos si una cita choca: otras citas, horario, descanso o bloqueos */
export const choques = (cita: CitaA, citas: CitaA[], servicios: ServicioA[], config: ConfigAgenda): string[] => {
  const avisos: string[] = [];
  const quien = atiende(cita);
  const { tramos, sinMargen, fin } = tramosDeCita(cita, servicios, config.margen);
  const ini = aMin(cita.hora);
  const h = config.horario[diaSemana(cita.fecha)];
  if (!h) avisos.push('El salón está cerrado ese día');
  else {
    if (ini < aMin(h.abre)) avisos.push(`Empieza antes de abrir (${h.abre})`);
    if (fin > aMin(h.cierra)) avisos.push(`Termina a las ${aHora(fin)}, después del cierre (${h.cierra})`);
    const largo = limiteInicio(fin - ini, config);
    if (largo && ini > aMin(largo.ultimaHora)) avisos.push(`Trabajo de ${largo.horas} h o más: conviene empezar a más tardar a las ${largo.ultimaHora}`);
    if (h.descansoDe && h.descansoA && sinMargen.some(x => solapa(x, { de: aMin(h.descansoDe!), a: aMin(h.descansoA!) })))
      avisos.push(`Se cruza con el descanso (${h.descansoDe}–${h.descansoA})`);
  }
  for (const c of citas) {
    if (c.id === cita.id || c.fecha !== cita.fecha || c.estado === 'cancelada' || atiende(c) !== quien) continue;
    if (tramosDeCita(c, servicios, config.margen).tramos.some(x => tramos.some(y => solapa(x, y)))) {
      const nombre = servicios.find(s => s.id === c.servicioId)?.nombre || 'otra cita';
      avisos.push(`Se cruza con la cita de las ${c.hora} (${nombre})`);
    }
  }
  for (const b of config.bloqueos || []) {
    if (b.personaId !== 'todas' && b.personaId !== quien) continue;
    const t = tramoBloqueo(b, cita.fecha);
    if (t && sinMargen.some(x => solapa(x, t))) avisos.push(`Horario bloqueado${b.motivo ? `: ${b.motivo}` : ''}`);
  }
  return avisos;
};
