// Google Calendar desde el servidor con una cuenta de servicio: sin ventanas de permiso ni tokens que venzan.
// Cristina comparte su calendario con el correo de la cuenta de servicio («Hacer cambios en eventos»); cada auxiliar
// que tenga «Google Calendar ID» en CB Control comparte el suyo igual.
// - La app de clientas descuenta en tiempo real lo que esté «Ocupado» en esos calendarios (cada consulta lo lee).
// - El Worker cb-avisos, cada minuto: copia las citas activas y los días del equipo a Google (espejo) y guarda lo
//   ocupado en Google en CB Control (configuracion/ocupadoGoogle), que lo usa como bloqueos de su agenda.
// Sin los secretos no hace nada: la agenda sigue funcionando solo con CB Control.
import { aMin, DUENA, tramosCita, type Bloqueo } from '../../salon-control-app/src/utils/agenda';
import { nombreUbicacion, ZONAS_INICIALES } from '../../salon-control-app/src/utils/zonas';
import { guardar, leer, uno, type EnvDexie } from './dexie';

export interface EnvGoogle {
  GOOGLE_CUENTA_SERVICIO?: string;   // el JSON completo de la llave de la cuenta de servicio
  GOOGLE_CALENDARIO?: string;        // calendario de Cristina (su correo de Gmail)
}

export const googleListo = (env: EnvGoogle) => !!(env.GOOGLE_CUENTA_SERVICIO && env.GOOGLE_CALENDARIO);

// Hermosillo (y Arizona) no cambian de horario: UTC−7 todo el año
const ZONA = 'America/Hermosillo', DESFASE = '-07:00';
const hoyLocal = () => new Date(Date.now() - 7 * 3600 * 1000).toISOString().slice(0, 10);
const diaSiguiente = (f: string) => { const d = new Date(`${f}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

const b64url = (datos: string | ArrayBuffer) =>
  btoa(typeof datos === 'string' ? datos : String.fromCharCode(...new Uint8Array(datos))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

let token: { valor: string; vence: number; cuenta: string } | null = null;   // dura 1 h; se renueva a los 50 min

/** Token de acceso con un JWT firmado por la llave de la cuenta de servicio (RS256) */
async function autorizacion(env: EnvGoogle) {
  const cuenta = JSON.parse(env.GOOGLE_CUENTA_SERVICIO!) as { client_email: string; private_key: string };
  if (token && token.cuenta === cuenta.client_email && token.vence > Date.now()) return token.valor;
  const ahora = Math.floor(Date.now() / 1000);
  const datos = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({
    iss: cuenta.client_email, scope: 'https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600
  }))}`;
  const der = Uint8Array.from(atob(cuenta.private_key.replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
  const llave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', llave, new TextEncoder().encode(datos));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${datos}.${b64url(firma)}` })
  });
  if (!r.ok) throw new Error(`Google token ${r.status} ${(await r.text()).slice(0, 200)}`);
  const { access_token } = await r.json() as { access_token: string };
  token = { valor: access_token, vence: Date.now() + 50 * 60 * 1000, cuenta: cuenta.client_email };
  return access_token;
}

async function pedir(env: EnvGoogle, ruta: string, init: RequestInit = {}) {
  const r = await fetch(`https://www.googleapis.com/calendar/v3${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${await autorizacion(env)}`, 'Content-Type': 'application/json' }
  });
  if (init.method === 'DELETE' && (r.status === 404 || r.status === 410)) return null;   // ya no estaba
  if (!r.ok) throw new Error(`Google ${init.method || 'GET'} ${ruta.split('?')[0]} ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json() as Promise<any>;
}

const rutaEventos = (calendario: string) => `/calendars/${encodeURIComponent(calendario)}/events`;

/** Eventos de un calendario (repeticiones ya separadas), todas las páginas */
async function eventos(env: EnvGoogle, calendario: string, filtros: Record<string, string>) {
  const lista: any[] = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ singleEvents: 'true', maxResults: '2500', ...filtros, ...(pageToken ? { pageToken } : {}) });
    const r = await pedir(env, `${rutaEventos(calendario)}?${q}`);
    lista.push(...(r?.items || []));
    pageToken = r?.nextPageToken || '';
  } while (pageToken);
  return lista;
}

/** Hora local de Hermosillo 'YYYY-MM-DDTHH:mm' (los de día completo empiezan a las 00:00; su fin ya es el día siguiente) */
const horaLocal = (t: { date?: string; dateTime?: string }) =>
  t.dateTime ? new Date(new Date(t.dateTime).getTime() - 7 * 3600 * 1000).toISOString().slice(0, 16) : `${t.date}T00:00`;

/** Un evento quita horario si está «Ocupado», no lo rechazó y no es una copia de CB Control (esas ya están en la agenda) */
export const ocupa = (e: any) =>
  e.status !== 'cancelled' && e.transparency !== 'transparent' && !e.extendedProperties?.private?.cb &&
  !e.attendees?.some((a: any) => a.self && a.responseStatus === 'declined');

export const aBloqueo = (e: any, personaId: string): Bloqueo =>
  ({ id: `g_${e.id}`, personaId, desde: horaLocal(e.start), hasta: horaLocal(e.end), motivo: 'Google Calendar' });

type CalendarioPersona = { personaId: string; calendario: string };

const ocupadoDe = (env: EnvGoogle, { personaId, calendario }: CalendarioPersona, desde: string, hasta: string) =>
  eventos(env, calendario, {
    timeMin: `${desde}T00:00:00${DESFASE}`, timeMax: `${hasta}T00:00:00${DESFASE}`,
    fields: 'items(id,status,start,end,transparency,attendees(self,responseStatus),extendedProperties),nextPageToken'
  }).then(l => l.filter(ocupa).map(e => aBloqueo(e, personaId)));

/** Lo ocupado en Google de cada persona entre dos fechas (fin exclusivo), como bloqueos de agenda.
 *  Si Google falla se registra y la agenda sigue sin esos bloqueos (la cita igual llega «por confirmar»). */
export async function ocupadoGoogle(env: EnvGoogle, calendarios: CalendarioPersona[], desde: string, hasta: string) {
  if (!googleListo(env)) return [];
  const listas = await Promise.all(calendarios.map(c => ocupadoDe(env, c, desde, hasta)
    .catch(e => { console.log('Google ocupado', (e as Error).message); return [] as Bloqueo[]; })));
  return listas.flat();
}

/** Calendario de cada persona que toma citas: Cristina y las auxiliares con «Google Calendar ID» */
export const calendariosAgenda = (env: EnvGoogle, empleados: any[]): CalendarioPersona[] => [
  { personaId: DUENA, calendario: env.GOOGLE_CALENDARIO || '' },
  ...empleados.filter(e => e.activo && e.tomaCitas && e.googleCalendarId?.trim()).map(e => ({ personaId: e.id, calendario: e.googleCalendarId.trim() }))
];

// ---------- Ocupado → CB Control ----------

const DIAS_OCUPADO = 180;   // las novias apartan con meses de anticipación

/** Guarda lo ocupado en Google (sin títulos) en configuracion/ocupadoGoogle para que la agenda de CB Control lo
 *  respete. Solo escribe si cambió; si un calendario falla no toca lo guardado (no borra bloqueos por un error). */
async function ocupadoACBControl(env: EnvGoogle & EnvDexie, empleados: any[], hoy: string) {
  let hasta = hoy;
  for (let i = 0; i < DIAS_OCUPADO; i++) hasta = diaSiguiente(hasta);
  const bloqueos = (await Promise.all(calendariosAgenda(env, empleados).map(c => ocupadoDe(env, c, hoy, hasta)))).flat();
  const firma = await huella(bloqueos);
  const guardado = await uno<any>(env, 'configuracion', 'ocupadoGoogle');
  if (guardado?.firma === firma) return 'igual';
  const realmId = guardado?.realmId || (await uno<any>(env, 'configuracion', 'settings'))?.realmId;
  if (!realmId) throw new Error('Sin realm del salón en configuración');
  await guardar(env, 'configuracion', [{ id: 'ocupadoGoogle', bloqueos, firma, actualizado: new Date().toISOString(), realmId }]);
  return bloqueos.length;
}

// ---------- Espejo: CB Control → Google ----------

const VERSION = 'v1';   // cambiarla reescribe todos los eventos (si cambia el formato)
const ACTIVAS = ['pendiente', 'confirmada', 'iniciada'];
// Cuántas escrituras por vuelta: el plan gratis de Workers permite 50 consultas por ejecución; lo demás sigue al minuto
const TOPE_ESCRITURAS = 20;

async function huella(datos: unknown) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([VERSION, datos])));
  return [...new Uint8Array(h)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface Deseado { cbId: string; calendario: string; firma: string; cuerpo: (clientes: Map<string, any>) => object }
interface Accion { tipo: 'crear' | 'cambiar' | 'borrar'; calendario: string; eventoId?: string; deseado?: Deseado }

/** Qué hacer en un calendario: crea lo que falta, reescribe lo que cambió y borra lo que ya no va
 *  (incluye duplicados). Las citas completadas se quedan como registro; `completada` dice cuáles lo están. */
export function planCalendario(calendario: string, quiero: Map<string, Deseado>, existentes: any[], completada: (cbId: string) => boolean): Accion[] {
  const acciones: Accion[] = [];
  const vistos = new Set<string>();
  for (const ev of existentes) {
    const p = ev.extendedProperties?.private || {};
    const d = quiero.get(p.cbId);
    if (d && !vistos.has(p.cbId)) {
      vistos.add(p.cbId);
      if (p.firma !== d.firma) acciones.push({ tipo: 'cambiar', calendario, eventoId: ev.id, deseado: d });
    } else if (d || !completada(p.cbId)) acciones.push({ tipo: 'borrar', calendario, eventoId: ev.id });
  }
  for (const [cbId, d] of quiero) if (!vistos.has(cbId)) acciones.push({ tipo: 'crear', calendario, deseado: d });
  return acciones;
}

const conMarca = (d: Deseado, cuerpo: object) =>
  ({ ...cuerpo, extendedProperties: { private: { cb: '1', cbId: d.cbId, firma: d.firma } } });

/** Copia a Google las citas activas desde hoy y los días de apoyo/vacaciones del equipo, y lo ocupado en Google a
 *  CB Control. Corre cada minuto. */
export async function espejo(env: EnvGoogle & EnvDexie) {
  if (!googleListo(env)) return { motivo: 'Google sin conectar' };
  const hoy = hoyLocal();
  const [citas, servicios, empleados, eventosEquipo] = await Promise.all([
    Promise.all(ACTIVAS.map(estado => leer<any>(env, 'citas', { estado }))).then(l => l.flat()),
    leer<any>(env, 'servicios'), leer<any>(env, 'empleados'), leer<any>(env, 'empleadoEvents')
  ]);
  const ocupado = await ocupadoACBControl(env, empleados, hoy)
    .catch(e => { console.log('Google ocupado→CB Control', (e as Error).message); return 'error'; });
  const principal = env.GOOGLE_CALENDARIO!;
  const calendarioDe = (empleadoId?: string) => empleados.find(e => e.id === empleadoId)?.googleCalendarId?.trim() || principal;
  const deseados: Deseado[] = [];

  for (const c of citas.filter(c => c.fecha >= hoy && c.hora)) {
    const s = servicios.find(x => x.id === c.servicioId);
    const adicionales = (c.serviciosAdicionales || []).map((a: any) => a.servicioId);
    const inicio = new Date(`${c.fecha}T${c.hora}:00${DESFASE}`);
    const fin = new Date(inicio.getTime() + (tramosCita(aMin(c.hora), c.servicioId, adicionales, servicios, 0).fin - aMin(c.hora)) * 60000);
    const servicio = [s?.nombre || 'Cita', ...adicionales.map((id: string) => servicios.find(x => x.id === id)?.nombre).filter(Boolean)].join(' + ');
    const datos = [c.fecha, c.hora, c.estado, servicio, c.clienteId, c.precioFinal || s?.precioSugerido, c.montoAnticipo, c.anticipoConfirmado,
      c.ubicacion, c.descripcionTrabajo, c.notas, c.origen, fin.getTime()];
    deseados.push({
      cbId: `cita:${c.id}`, calendario: calendarioDe(c.atiendeId || c.empleadoIds?.[0]), firma: await huella(datos),
      cuerpo: clientes => {
        const cl = clientes.get(c.clienteId);
        return {
          summary: `${c.estado === 'pendiente' ? '(Por confirmar) ' : ''}${servicio} - ${cl?.nombre || 'Clienta'}`,
          description: [
            `Clienta: ${cl?.nombre || '—'}`, cl?.telefono && `Tel: ${cl.telefono}`, `Servicio: ${servicio}`,
            `Precio: $${Number(c.precioFinal || s?.precioSugerido || 0).toLocaleString('es-MX')}`,
            c.montoAnticipo && `Anticipo: $${Number(c.montoAnticipo).toLocaleString('es-MX')} ${c.anticipoConfirmado ? '(pagado)' : '(pendiente)'}`,
            `Estado: ${c.estado}`, c.origen === 'app' && 'Agendada desde la app',
            c.ubicacion && c.ubicacion !== 'salon' && `Lugar: ${nombreUbicacion(c.ubicacion, ZONAS_INICIALES)}`,
            c.descripcionTrabajo && `Trabajo: ${c.descripcionTrabajo}`, c.notas && `Notas: ${c.notas}`,
            'Copiada de CB Control: los cambios se hacen allá.'
          ].filter(Boolean).join('\n'),
          start: { dateTime: inicio.toISOString(), timeZone: ZONA },
          end: { dateTime: fin.toISOString(), timeZone: ZONA }
        };
      }
    });
  }

  for (const e of eventosEquipo.filter(e => e.fechaFin >= hoy)) {
    const emp = empleados.find(x => x.id === e.empleadoId);
    const titulo = `${String(e.tipo || 'evento').replace('_', ' ').toUpperCase()}: ${emp?.nombre || 'Equipo'}`;
    deseados.push({
      cbId: `evento:${e.id}`, calendario: calendarioDe(e.empleadoId), firma: await huella([titulo, e.fechaInicio, e.fechaFin, e.descripcion]),
      cuerpo: () => ({
        summary: titulo,
        description: [e.descripcion && `Notas: ${e.descripcion}`, 'Copiado de CB Control: los cambios se hacen allá.'].filter(Boolean).join('\n'),
        start: { date: e.fechaInicio }, end: { date: diaSiguiente(e.fechaFin) },
        transparency: 'transparent'   // el día de una auxiliar no ocupa a Cristina
      })
    });
  }

  // Cada calendario se revisa entero (también los de auxiliares sin citas: ahí se borra lo que ya no va)
  const porCalendario = new Map<string, Map<string, Deseado>>();
  for (const cal of [principal, ...empleados.map(e => e.googleCalendarId?.trim()).filter(Boolean)]) porCalendario.set(cal, new Map());
  for (const d of deseados) porCalendario.get(d.calendario)!.set(d.cbId, d);

  const acciones: Accion[] = [];
  let errores = 0;
  for (const [calendario, quiero] of porCalendario) {
    let existentes: any[];
    try {
      existentes = await eventos(env, calendario, {
        privateExtendedProperty: 'cb=1', timeMin: `${hoy}T00:00:00${DESFASE}`, fields: 'items(id,extendedProperties),nextPageToken'
      });
    } catch (e) { console.log('Google espejo', calendario, (e as Error).message); errores++; continue; }   // calendario sin compartir
    // Las citas que ya no están activas: solo las completadas se quedan (pocas: las de hoy)
    const fuera = existentes.map(ev => ev.extendedProperties?.private?.cbId as string)
      .filter(id => id?.startsWith('cita:') && !quiero.has(id));
    const completadas = new Set<string>();
    for (const id of new Set(fuera)) if ((await uno<any>(env, 'citas', id.slice(5)))?.estado === 'completada') completadas.add(id);
    acciones.push(...planCalendario(calendario, quiero, existentes, id => completadas.has(id)));
  }

  const ahora = acciones.slice(0, TOPE_ESCRITURAS);
  // ponytail: los datos de la clienta se leen solo si hay algo que escribir; si cambia su nombre o teléfono, su evento
  // se actualiza hasta que cambie la cita (meter cliente.nombre/telefono a la firma si hace falta)
  const clientes = ahora.some(a => a.tipo !== 'borrar')
    ? new Map((await leer<any>(env, 'clientes')).map(c => [c.id, c])) : new Map<string, any>();
  const hechos = { creados: 0, cambiados: 0, borrados: 0 };
  for (const a of ahora) {
    try {
      if (a.tipo === 'borrar') { await pedir(env, `${rutaEventos(a.calendario)}/${a.eventoId}`, { method: 'DELETE' }); hechos.borrados++; }
      else if (a.tipo === 'cambiar') { await pedir(env, `${rutaEventos(a.calendario)}/${a.eventoId}`, { method: 'PUT', body: JSON.stringify(conMarca(a.deseado!, a.deseado!.cuerpo(clientes))) }); hechos.cambiados++; }
      else { await pedir(env, rutaEventos(a.calendario), { method: 'POST', body: JSON.stringify(conMarca(a.deseado!, a.deseado!.cuerpo(clientes))) }); hechos.creados++; }
    } catch (e) { console.log('Google espejo', a.tipo, (e as Error).message); errores++; }
  }
  return { ...hechos, pendientes: acciones.length - ahora.length, errores, ocupado };
}
