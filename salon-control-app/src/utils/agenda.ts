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
/** Liberación progresiva: con más de `masDeHoras` de anticipación, la mañana se guarda para trabajos de `horas` o más */
export interface NivelProteccion { masDeHoras: number; horas: number }
export interface Proteccion { desde: string; hasta: string; niveles: NivelProteccion[] }
/** Hueco para comer: `minutos` libres entre `desde` y `hasta`. El tiempo de proceso de un color cuenta como libre */
export interface Comida { desde: string; hasta: string; minutos: number }
export interface ConfigAgenda {
  horario: HorarioSemana;
  margen: number;            // minutos de preparación entre clientas
  intervalo: number;         // cada cuántos minutos se ofrecen horarios
  anticipacionHoras: number; // mínimo para que una clienta aparte
  maxDias: number;           // hasta cuántos días adelante
  bloqueos: Bloqueo[];
  largos?: LimiteLargo[];
  proteccion?: Proteccion | null; // null: sin mañana protegida
  comida?: Comida | null;         // null: sin hueco de comida
  plazoPropuestaHoras?: number;   // tiempo de la clienta para aceptar la hora que le propone Cristina
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
  margen: 20, intervalo: 30, anticipacionHoras: 3, maxDias: 60, bloqueos: [],
  // Un trabajo largo empieza temprano: de 4 h o más, a más tardar 13:00; de 2 h o más, 16:00
  largos: [{ horas: 4, ultimaHora: '13:00' }, { horas: 2, ultimaHora: '16:00' }],
  // La mañana se guarda para trabajos largos y se va soltando conforme se acerca el día
  proteccion: { desde: '09:00', hasta: '13:00', niveles: [{ masDeHoras: 168, horas: 6 }, { masDeHoras: 72, horas: 4 }, { masDeHoras: 48, horas: 2 }] },
  comida: { desde: '13:00', hasta: '15:00', minutos: 30 },
  plazoPropuestaHoras: 24
};

/** Lo que elige la clienta: el día y la parte del día en que le acomoda empezar */
export type Franja = 'manana' | 'mediodia' | 'tarde' | 'cualquiera';
export interface Preferencia { fecha: string; franja: Franja }
export const FRANJAS: { id: Exclude<Franja, 'cualquiera'>; nombre: string; detalle: string; de: number; a: number }[] = [
  { id: 'manana', nombre: 'Mañana', detalle: 'antes de la 1', de: 0, a: 13 * 60 },
  { id: 'mediodia', nombre: 'Mediodía', detalle: 'de 1 a 4', de: 13 * 60, a: 16 * 60 },
  { id: 'tarde', nombre: 'Tarde', detalle: 'desde las 4', de: 16 * 60, a: 24 * 60 }
];
export const NOMBRE_FRANJA: Record<Franja, string> = { manana: 'Mañana', mediodia: 'Mediodía', tarde: 'Tarde', cualquiera: 'Cualquier hora' };
export const franjaDe = (hora: string) => FRANJAS.find(f => aMin(hora) >= f.de && aMin(hora) < f.a)?.id ?? 'tarde';
/** Franjas del día con al menos un horario libre */
export const franjasLibres = (horas: string[]) => FRANJAS.filter(f => horas.some(h => franjaDe(h) === f.id)).map(f => f.id);
/** Falta ponerle hora: solicitud nueva o clienta que pidió cambiar la suya */
export const porAsignar = (c: { estado?: string; cambioPedido?: boolean }) => c.estado === 'solicitud' || !!c.cambioPedido;
/** «mar 10 nov · tarde; jue 12 nov · cualquier hora» */
export const resumenPreferencias = (lista: Preferencia[] = []) => lista.map(p =>
  `${new Date(`${p.fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')} · ${NOMBRE_FRANJA[p.franja].toLowerCase()}`).join('; ');
/** Fin de la solicitud: pasada su última preferencia ya no hay nada que asignar */
export const ultimaPreferencia = (c: { fecha: string; preferencias?: Preferencia[] }) =>
  (c.preferencias || []).reduce((m, p) => (p.fecha > m ? p.fecha : m), c.fecha);

/** Hora límite para empezar un servicio de `minutos` (la regla más estricta que le aplica) */
export const limiteInicio = (minutos: number, config: ConfigAgenda) =>
  (config.largos ?? AGENDA_INICIAL.largos ?? [])
    .filter(l => minutos >= l.horas * 60)
    .sort((a, b) => b.horas - a.horas)[0];

interface ServicioA { id: string; nombre?: string; categoria?: string; duracion?: number; tiempoProceso?: number; tiempoCierre?: number; prioritario?: boolean; archivado?: boolean }
interface CitaA {
  id?: string; fecha: string; hora: string; estado?: string; servicioId: string;
  serviciosAdicionales?: { servicioId: string }[]; atiendeId?: string;
}
export interface Tramo { de: number; a: number }

export const aMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
export const aHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const solapa = (x: Tramo, y: Tramo) => x.de < y.a && y.de < x.a;
export const atiende = (c: { atiendeId?: string }) => c.atiendeId || DUENA;
/** Cancelada, «no llegó» o solicitud todavía sin hora: no ocupa a nadie */
export const libera = (c: { estado?: string }) => c.estado === 'cancelada' || c.estado === 'no_llego' || c.estado === 'solicitud';
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
    if (c.fecha !== fecha || libera(c) || c.id === ignorarCitaId || atiende(c) !== personaId) continue;
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
type Ocupado = ReturnType<typeof ocupacion>;

/** ¿Cabe un trabajo de `minutos` que empiece entre `desde` y `hasta`, con lo ocupado y `extra`? */
const cabeTrabajo = (minutos: number, ocupado: Ocupado, extra: Tramo[], h: HorarioDia, desde: number, hasta: number, config: ConfigAgenda) => {
  for (let s = Math.max(aMin(h.abre), desde); s < hasta; s += config.intervalo) {
    if (s + minutos + config.margen > aMin(h.cierra)) return false;
    const conMargen = { de: s, a: s + minutos + config.margen }, sinMargen = { de: s, a: s + minutos };
    if (![...ocupado.citas, ...extra].some(y => solapa(conMargen, y)) && !ocupado.fijos.some(y => solapa(sinMargen, y))) return true;
  }
  return false;
};

/**
 * Regla de oportunidad: un servicio más corto que el trabajo que se está guardando no toma la mañana mientras ese trabajo
 * todavía quepa ahí, ni se pone más tarde si con eso ya no cabría. Lo que no se pueda aprovechar para un trabajo largo (un
 * hueco de 2 h entre dos citas) sí se ofrece, y dentro de 48 h la mañana queda libre para todas.
 */
export const rompeProteccion = (o: {
  persona: Persona; fecha: string; inicio: number; fin: number; tramos: Tramo[]; servicio?: ServicioA;
  servicios: ServicioA[]; config: ConfigAgenda; ocupado: Ocupado; ahora: Date;
}) => {
  const p = o.config.proteccion, h = o.config.horario[diaSemana(o.fecha)];
  if (!p || !h) return false;
  const faltan = (new Date(`${o.fecha}T${aHora(o.inicio)}:00`).getTime() - o.ahora.getTime()) / 3600000;
  const nivel = [...p.niveles].sort((a, b) => b.masDeHoras - a.masDeHoras).find(n => faltan > n.masDeHoras);
  if (!nivel) return false;
  // Nunca se guarda para algo más largo que lo que esa persona hace (si no, «no cabe» y la protección se apagaría sola)
  const maximo = Math.max(0, ...o.servicios.filter(s => !s.archivado && puedeHacer(o.persona, s)).map(s => tiemposServicio(s).total));
  const minutos = Math.min(nivel.horas * 60, maximo);
  if (!minutos || o.fin - o.inicio >= minutos || o.servicio?.prioritario) return false;
  const desde = aMin(p.desde), hasta = aMin(p.hasta);
  if (!cabeTrabajo(minutos, o.ocupado, [], h, desde, hasta, o.config)) return false;   // ya no hay nada que proteger
  if (o.inicio < hasta && o.fin > desde) return true;
  return !cabeTrabajo(minutos, o.ocupado, o.tramos, h, desde, hasta, o.config);
};

/** ¿Queda hueco para comer? El proceso de un color cuenta como libre; la preparación entre clientas, no */
export const hayComida = (comida: Comida, h: HorarioDia, ocupado: Ocupado, extra: Tramo[] = []) => {
  const de = Math.max(aMin(comida.desde), aMin(h.abre)), a = Math.min(aMin(comida.hasta), aMin(h.cierra));
  if (a - de < comida.minutos) return true;   // ese día no aplica
  if (h.descansoDe && h.descansoA && Math.min(aMin(h.descansoA), a) - Math.max(aMin(h.descansoDe), de) >= comida.minutos) return true;
  let cursor = de;
  for (const t of [...ocupado.citas, ...ocupado.fijos, ...extra].sort((x, y) => x.de - y.de)) {
    if (Math.min(t.de, a) - cursor >= comida.minutos) return true;
    cursor = Math.max(cursor, t.a);
  }
  return a - cursor >= comida.minutos;
};
/** Solo cuenta lo que esta cita le quita: si ese día ya no había hueco, no es culpa de ella */
export const rompeComida = (config: ConfigAgenda, fecha: string, ocupado: Ocupado, tramos: Tramo[]) => {
  const h = config.horario[diaSemana(fecha)];
  return !!config.comida && !!h && hayComida(config.comida, h, ocupado, []) && !hayComida(config.comida, h, ocupado, tramos);
};

/**
 * Horarios en que alguien que hace el servicio está libre de principio a fin. Para las clientas (`respetarAnticipacion`)
 * aplica además la mañana protegida y la comida; en CB Control Cristina manda y solo ve avisos (`choques`).
 */
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
    const conComida: HorarioLibre[] = [], sinComida: HorarioLibre[] = [];
    for (let t = aMin(h.abre); t < aMin(h.cierra); t += config.intervalo) {
      const { tramos, sinMargen, fin } = tramosCita(t, servicioId, adicionales, servicios, config.margen);
      if (fin + config.margen > aMin(h.cierra)) break;   // la preparación de después también cuenta antes de cerrar
      const largo = limiteInicio(fin - t, config);
      if (largo && t > aMin(largo.ultimaHora)) continue;
      if (new Date(`${fecha}T${aHora(t)}:00`) < limite) continue;
      if (tramos.some(x => ocupado.citas.some(y => solapa(x, y))) || sinMargen.some(x => ocupado.fijos.some(y => solapa(x, y)))) continue;
      if (respetarAnticipacion && rompeProteccion({ persona: p, fecha, inicio: t, fin, tramos, servicio, servicios, config, ocupado, ahora })) continue;
      (respetarAnticipacion && rompeComida(config, fecha, ocupado, tramos) ? sinComida : conComida).push({ hora: aHora(t), personaId: p.id });
    }
    // Si ningún inicio deja comer (un color de 5 h sin proceso), se ofrece igual: Cristina lo ve al asignar
    res.push(...(conComida.length ? conComida : sinComida));
  }
  return res.sort((a, b) => a.hora.localeCompare(b.hora));
};

export interface Sugerencia extends HorarioLibre { fecha: string; puntos: number; motivos: string[]; avisos: string[] }

/**
 * Las mejores horas para asignar una solicitud, con su porqué. Ofrece todo lo que esté libre (Cristina manda), pero baja lo
 * que rompa una regla y lo avisa. Pesos: preferencia de la clienta 40, regla rota −40/−25, junto a otra cita 20, hueco
 * muerto −15, primera del día o mañana bien usada 10, y salir temprano hasta 9.
 */
export const sugerirHorarios = (o: {
  preferencias: Preferencia[]; servicioId: string; adicionales?: string[]; personas: Persona[]; citas: CitaA[];
  servicios: ServicioA[]; config: ConfigAgenda; ahora?: Date; ignorarCitaId?: string; limite?: number;
}): Sugerencia[] => {
  const { preferencias, servicioId, adicionales = [], personas, servicios, config, ahora = new Date(), limite = 3 } = o;
  const servicio = servicios.find(s => s.id === servicioId);
  const masCorto = Math.min(...servicios.filter(s => !s.archivado).map(s => tiemposServicio(s).total), 60);
  const cerca = (g: number) => g >= 0 && g < config.intervalo;
  const todas: Sugerencia[] = [];
  for (const fecha of [...new Set(preferencias.map(p => p.fecha))]) {
    const h = config.horario[diaSemana(fecha)];
    const citas = o.citas.filter(c => c.fecha === fecha);
    if (!h) continue;
    for (const l of horariosLibres({ fecha, servicioId, adicionales, personas, citas, servicios, config, ahora, ignorarCitaId: o.ignorarCitaId, respetarAnticipacion: false })) {
      const persona = personas.find(p => p.id === l.personaId)!;
      const ocupado = ocupacion(l.personaId, fecha, citas, servicios, config, o.ignorarCitaId);
      const inicio = aMin(l.hora), { tramos, fin } = tramosCita(inicio, servicioId, adicionales, servicios, config.margen);
      const motivos: string[] = [], avisos: string[] = [];
      let puntos = Math.min(Math.floor((aMin(h.cierra) - fin) / 60), 9);
      const orden = preferencias.findIndex(p => p.fecha === fecha && (p.franja === 'cualquiera' || p.franja === franjaDe(l.hora)));
      if (orden >= 0) { puntos += 40 - orden * 5; motivos.push(orden === 0 ? 'Su primera opción' : `Su opción ${orden + 1}`); }
      else { puntos += 10; avisos.push('Fuera de la franja que pidió'); }
      if (rompeProteccion({ persona, fecha, inicio, fin, tramos, servicio, servicios, config, ocupado, ahora })) { puntos -= 40; avisos.push('Ocupa la mañana que se guarda para trabajos largos'); }
      else if (config.proteccion && inicio < aMin(config.proteccion.hasta) && fin - inicio >= 120) { puntos += 10; motivos.push('Aprovecha la mañana'); }
      if (rompeComida(config, fecha, ocupado, tramos)) { puntos -= 25; avisos.push('No deja hueco para comer'); }
      // Lo que queda antes y después: lo ideal es pegar con otra cita o con la apertura; un hueco donde no cabe nada se pierde
      const finTrabajo = tramos[tramos.length - 1].a, todo = [...ocupado.citas, ...ocupado.fijos];
      const antes = inicio - Math.max(aMin(h.abre), ...todo.filter(t => t.a <= inicio).map(t => t.a));
      const despues = Math.min(aMin(h.cierra), ...todo.filter(t => t.de >= finTrabajo).map(t => t.de)) - finTrabajo;
      if (ocupado.citas.some(t => cerca(inicio - t.a) || cerca(t.de - finTrabajo))) { puntos += 20; motivos.push('Junto a otra cita'); }
      else if (inicio === aMin(h.abre)) { puntos += 10; motivos.push('Primera del día'); }
      const hueco = [antes, despues].find(g => g >= config.intervalo && g < masCorto + config.margen);
      if (hueco) { puntos -= 15; avisos.push(`Deja un hueco de ${hueco} min`); }
      todas.push({ ...l, fecha, puntos, motivos, avisos });
    }
  }
  todas.sort((a, b) => b.puntos - a.puntos || `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
  // Tres opciones de verdad distintas: no 10:00, 10:30 y 11:00 del mismo día
  const lista: Sugerencia[] = [];
  for (const s of todas) {
    if (lista.length < limite && !lista.some(x => x.fecha === s.fecha && x.personaId === s.personaId && Math.abs(aMin(x.hora) - aMin(s.hora)) < 90)) lista.push(s);
  }
  return lista;
};

/** Avisos si una cita choca: otras citas, horario, descanso, bloqueos, mañana protegida o comida */
export const choques = (cita: CitaA, citas: CitaA[], servicios: ServicioA[], config: ConfigAgenda, ahora = new Date()): string[] => {
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
    if (c.id === cita.id || c.fecha !== cita.fecha || libera(c) || atiende(c) !== quien) continue;
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
  const ocupado = ocupacion(quien, cita.fecha, citas, servicios, config, cita.id);
  if (rompeProteccion({ persona: { id: quien, nombre: '' }, fecha: cita.fecha, inicio: ini, fin, tramos, servicio: servicios.find(s => s.id === cita.servicioId), servicios, config, ocupado, ahora }))
    avisos.push('Ocupa la mañana que se guarda para trabajos largos');
  if (rompeComida(config, cita.fecha, ocupado, tramos)) avisos.push('No deja hueco para comer');
  return avisos;
};
