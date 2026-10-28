// Check: npx esbuild scripts/google.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module
// Google Calendar y Dexie Cloud simulados con fetch: firma del JWT, lo ocupado para la agenda y el espejo de citas.
import assert from 'node:assert/strict';
import { espejo, ocupadoGoogle } from '../api/google';

const dia = (n: number) => new Date(Date.now() - 7 * 3600 * 1000 + n * 86400000).toISOString().slice(0, 10);
const hoy = dia(0), manana = dia(1), pasado = dia(2);

// Llave de cuenta de servicio de prueba
const par = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', par.privateKey)).toString('base64');
const env = {
  GOOGLE_CUENTA_SERVICIO: JSON.stringify({ client_email: 'cb@proyecto.iam.gserviceaccount.com', private_key: `-----BEGIN PRIVATE KEY-----\n${pkcs8}\n-----END PRIVATE KEY-----\n` }),
  GOOGLE_CALENDARIO: 'cristina@gmail.com', DEXIE_URL: 'http://dexie', DEXIE_CLIENT_ID: 'x', DEXIE_CLIENT_SECRET: 'y'
};

const tablas: Record<string, any[]> = {
  servicios: [{ id: 's1', nombre: 'Corte', duracion: 60, precioSugerido: 500 }],
  empleados: [{ id: 'e1', nombre: 'Ana', googleCalendarId: 'ana@gmail.com', activo: true, tomaCitas: true }],
  empleadoEvents: [{ id: 'ev1', empleadoId: 'e1', tipo: 'vacaciones', fechaInicio: manana, fechaFin: manana }],
  clientes: [{ id: 'k1', nombre: 'Laura Pérez', telefono: '6621234567' }],
  configuracion: [{ id: 'settings', realmId: 'rlm1' }],
  members: [{ realmId: 'rlm1', userId: 'u-cris', roles: ['duena'] }, { realmId: 'rlm1', userId: 'u-aux', roles: ['empleada'] }],
  realms: [{ realmId: 'rlm1', owner: 'u-rob' }, { realmId: 'u-aux', owner: 'u-aux' }],
  citas: [
    { id: 'c1', clienteId: 'k1', servicioId: 's1', fecha: manana, hora: '10:00', estado: 'pendiente' },
    { id: 'c2', clienteId: 'k1', servicioId: 's1', fecha: manana, hora: '12:00', estado: 'confirmada', atiendeId: 'e1' },
    { id: 'c3', clienteId: 'k1', servicioId: 's1', fecha: hoy, hora: '09:00', estado: 'completada' },
    { id: 'c4', clienteId: 'k1', servicioId: 's1', fecha: dia(-1), hora: '09:00', estado: 'confirmada' }
  ]
};
const marca = (cbId: string, firma = 'vieja') => ({ private: { cb: '1', cbId, firma } });
const hora = (f: string, h: string) => ({ dateTime: `${f}T${h}:00-07:00` });
let n = 0;
const google: Record<string, any[]> = {
  'cristina@gmail.com': [
    { id: 'g1', summary: 'Cita Edna', start: hora(manana, '15:00'), end: hora(manana, '16:00') },                // ocupado (apuntada a mano)
    { id: 'g2', start: hora(manana, '17:00'), end: hora(manana, '18:00'), transparency: 'transparent' },          // disponible
    { id: 'g3', start: { date: pasado }, end: { date: dia(3) } },                                                 // día completo ocupado
    { id: 'g4', start: hora(manana, '13:00'), end: hora(manana, '14:00'), attendees: [{ self: true, responseStatus: 'declined' }] },
    { id: 'g5', start: hora(hoy, '09:00'), end: hora(hoy, '10:00'), extendedProperties: marca('cita:c3') },     // completada: se queda
    { id: 'g6', start: hora(manana, '10:00'), end: hora(manana, '11:00'), extendedProperties: marca('cita:c1') }, // cambió: se reescribe
    { id: 'g7', start: hora(manana, '11:00'), end: hora(manana, '12:00'), extendedProperties: marca('cita:borrada') }
  ],
  'ana@gmail.com': []
};
const llamadas: string[] = [];

globalThis.fetch = (async (entrada: any, init: any = {}) => {
  const url = new URL(String(entrada)), metodo = init.method || 'GET';
  const resp = (datos: unknown, status = 200) => new Response(datos === null ? null : JSON.stringify(datos), { status });
  if (url.host === 'oauth2.googleapis.com') {
    const [h, p, f] = new URLSearchParams(String(init.body)).get('assertion')!.split('.');
    const bytes = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    assert.ok(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', par.publicKey, bytes(f), new TextEncoder().encode(`${h}.${p}`)), 'firma del JWT');
    assert.equal(JSON.parse(bytes(p).toString()).iss, 'cb@proyecto.iam.gserviceaccount.com');
    return resp({ access_token: 'tok', expires_in: 3600 });
  }
  if (url.host === 'dexie') {
    if (url.pathname === '/token') return resp({ accessToken: 'd' });
    const [, , tabla, id] = url.pathname.split('/');
    if (metodo === 'POST') {
      llamadas.push(`POST dexie ${tabla}`);
      for (const o of JSON.parse(init.body)) tablas[tabla] = [...tablas[tabla].filter(f => f.id !== o.id), o];
      return resp(null);
    }
    const filas = tablas[tabla].filter(f => [...url.searchParams].every(([k, v]) => f[k] === v));
    return id ? resp(tablas[tabla].find(f => f.id === id) ?? null, tablas[tabla].some(f => f.id === id) ? 200 : 404) : resp(filas);
  }
  assert.equal(init.headers.Authorization, 'Bearer tok');
  const [, cal, , eventoId] = url.pathname.replace('/calendar/v3/calendars/', '/').split('/').map(decodeURIComponent);
  llamadas.push(`${metodo} ${cal}${eventoId ? ` ${eventoId}` : ''}`);
  const lista = google[cal];
  if (!lista) return resp({ error: { code: 404, message: 'Not Found' } }, 404);   // calendario sin compartir
  if (metodo === 'GET') {
    const min = url.searchParams.get('timeMin'), max = url.searchParams.get('timeMax');
    const fin = (e: any) => new Date(e.end.dateTime || `${e.end.date}T00:00:00-07:00`).getTime();
    const ini = (e: any) => new Date(e.start.dateTime || `${e.start.date}T00:00:00-07:00`).getTime();
    return resp({ items: lista.filter(e => (!min || fin(e) > new Date(min).getTime()) && (!max || ini(e) < new Date(max).getTime()) &&
      (!url.searchParams.get('privateExtendedProperty') || e.extendedProperties?.private?.cb === '1')) });
  }
  if (metodo === 'DELETE') { google[cal] = lista.filter(e => e.id !== eventoId); return resp(null, 204); }
  if (eventoId && !lista.some(e => e.id === eventoId)) return resp({ error: { code: 404 } }, 404);   // como Google: no existe
  const ev = { ...JSON.parse(init.body), id: eventoId || `nuevo${++n}` };
  google[cal] = [...lista.filter(e => e.id !== ev.id), ev];
  return resp(ev);
}) as typeof fetch;

// Lo ocupado: solo g1 y el día completo (no lo disponible, ni lo rechazado, ni las copias de CB Control)
const bloqueos = await ocupadoGoogle(env, [{ personaId: 'cristina', calendario: 'cristina@gmail.com' }], manana, dia(3));
assert.deepEqual(bloqueos.map(b => [b.desde, b.hasta]), [[`${manana}T15:00`, `${manana}T16:00`], [`${pasado}T00:00`, `${dia(3)}T00:00`]]);

// Espejo: c1 se reescribe, c2 y las vacaciones van al calendario de Ana, la borrada sale, la completada se queda, c4 (ayer) no entra
assert.deepEqual(await espejo(env), { creados: 2, cambiados: 1, borrados: 1, pendientes: 0, errores: 0, ocupado: 2 });
// Lo ocupado queda en CB Control (sin títulos), con el realm del salón
const guardado = tablas.configuracion.find(f => f.id === 'ocupadoGoogle');
assert.equal(guardado.realmId, 'rlm1');
assert.deepEqual(guardado.bloqueos.map((b: any) => [b.personaId, b.desde, b.hasta, b.motivo]),
  [['cristina', `${manana}T15:00`, `${manana}T16:00`, 'Google Calendar'], ['cristina', `${pasado}T00:00`, `${dia(3)}T00:00`, 'Google Calendar']]);
const c1 = google['cristina@gmail.com'].find(e => e.extendedProperties?.private?.cbId === 'cita:c1');
assert.equal(c1.summary, '(Por confirmar) Corte - Laura Pérez');
assert.equal(c1.end.dateTime, new Date(`${manana}T11:00:00-07:00`).toISOString());
assert.ok(c1.description.includes('Tel: 6621234567'));
assert.ok(google['cristina@gmail.com'].some(e => e.id === 'g5') && !google['cristina@gmail.com'].some(e => e.id === 'g7'));
assert.deepEqual(google['ana@gmail.com'].map(e => e.extendedProperties.private.cbId).sort(), ['cita:c2', 'evento:ev1']);
assert.deepEqual(google['ana@gmail.com'].find(e => e.extendedProperties.private.cbId === 'evento:ev1').end, { date: pasado });

// Segunda vuelta sin cambios: no escribe nada (ni en Google ni en CB Control)
llamadas.length = 0;
assert.deepEqual(await espejo(env), { creados: 0, cambiados: 0, borrados: 0, pendientes: 0, errores: 0, ocupado: 'igual' });
assert.ok(llamadas.every(l => l.startsWith('GET')));

// La cita pasa a Ana: sale del calendario de Cristina y entra al de Ana
tablas.citas[0].atiendeId = 'e1';
assert.deepEqual(await espejo(env), { creados: 1, cambiados: 0, borrados: 1, pendientes: 0, errores: 0, ocupado: 'igual' });

// Ana anota algo ocupado en su Google: se agrega a CB Control con su id
google['ana@gmail.com'].push({ id: 'a1', start: hora(pasado, '11:00'), end: hora(pasado, '12:00') });
assert.equal((await espejo(env)).ocupado, 3);
assert.ok(tablas.configuracion.find(f => f.id === 'ocupadoGoogle').bloqueos.some((b: any) => b.personaId === 'e1' && b.desde === `${pasado}T11:00`));

// Si Google falla, lo guardado no se toca
const antes = tablas.configuracion.find(f => f.id === 'ocupadoGoogle');
tablas.empleados[0].googleCalendarId = 'sin-compartir@gmail.com';
const r = await espejo(env);
assert.equal(r.ocupado, 'error');
assert.equal(r.errores, 1);   // el espejo de ese calendario también falla, el de Cristina sigue
assert.equal(tablas.configuracion.find(f => f.id === 'ocupadoGoogle'), antes);

// Eventos de Cristina con hora que CB Control no creó: van a la lista «De Google, sin registrar» (con su título)
tablas.empleados[0].googleCalendarId = 'ana@gmail.com';
await espejo(env);
const sinRegistrar = tablas.configuracion.find(f => f.id === 'eventosGoogle').eventos;
assert.deepEqual(sinRegistrar.map((e: any) => [e.id, e.titulo, e.desde, e.hasta]), [['g1', 'Cita Edna', `${manana}T15:00`, `${manana}T16:00`]]);

// Registrarla como cita adopta ese mismo evento (no se duplica) y sale de la lista
// Nadie más puede pedir adoptar: una auxiliar (aunque sea dueña de su realm privado) o un evento fuera de la lista
tablas.citas.push({ id: 'c8', clienteId: 'k1', servicioId: 's1', fecha: manana, hora: '17:00', estado: 'confirmada', googleAdoptar: 'g1', owner: 'u-aux', realmId: 'rlm1' });
tablas.citas.push({ id: 'c11', clienteId: 'k1', servicioId: 's1', fecha: manana, hora: '18:00', estado: 'confirmada', googleAdoptar: 'g2', owner: 'u-cris', realmId: 'rlm1' });
llamadas.length = 0;
await espejo(env);
assert.ok(!llamadas.some(l => /PUT .* g[12]$/.test(l)));   // ni g1 ni g2 se tocaron
assert.equal(google['cristina@gmail.com'].find(e => e.id === 'g1').summary, 'Cita Edna');
tablas.citas = tablas.citas.filter(c => c.id !== 'c8' && c.id !== 'c11');
google['cristina@gmail.com'] = google['cristina@gmail.com'].filter(e => !['cita:c8', 'cita:c11'].includes(e.extendedProperties?.private?.cbId));

// La dueña sí: su cita adopta el evento de la lista
tablas.citas.push({ id: 'c9', clienteId: 'k1', servicioId: 's1', fecha: manana, hora: '15:00', estado: 'confirmada', googleAdoptar: 'g1', owner: 'u-cris', realmId: 'rlm1' });
llamadas.length = 0;
const adopcion = await espejo(env);
assert.equal(adopcion.creados, 0);
assert.ok(llamadas.includes('PUT cristina@gmail.com g1'));
const g1 = google['cristina@gmail.com'].find(e => e.id === 'g1');
assert.equal(g1.extendedProperties.private.cbId, 'cita:c9');
assert.equal(g1.summary, 'Corte - Laura Pérez');
assert.deepEqual(await espejo(env).then(r => [r.creados, r.cambiados, r.errores]), [0, 0, 0]);   // ya es su copia
assert.deepEqual(tablas.configuracion.find(f => f.id === 'eventosGoogle').eventos, []);   // y a la vuelta siguiente sale de la lista

// Si el evento ya no está en Google (ni en la lista), se crea la copia normal
tablas.citas.push({ id: 'c10', clienteId: 'k1', servicioId: 's1', fecha: pasado, hora: '12:00', estado: 'confirmada', googleAdoptar: 'borrado', owner: 'u-rob', realmId: 'rlm1' });
assert.equal((await espejo(env)).creados, 1);

console.log('google ok');
