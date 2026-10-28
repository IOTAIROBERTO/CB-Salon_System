// Check: npx esbuild scripts/reservas.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module
// Reglas contra citas falsas: «no soy robot» (Turnstile), código por WhatsApp antes de apartar y recordatorio al salón de
// las citas sin confirmar. Dexie Cloud, Turnstile y WhatsApp simulados con fetch.
import assert from 'node:assert/strict';
import { atender } from '../api/salon';
import { firmar } from '../api/sesion';
import { recordarAlSalon } from '../avisos/index';

const HORA = 3600 * 1000;
const dia = (n: number) => new Date(Date.now() - 7 * HORA + n * 86400000).toISOString().slice(0, 10);
let lunes = dia(3);   // el primer lunes con al menos 3 días de anticipación
while (new Date(`${lunes}T12:00:00Z`).getUTCDay() !== 1) lunes = dia(Math.round((Date.parse(`${lunes}T12:00:00Z`) - Date.parse(`${dia(0)}T12:00:00Z`)) / 86400000) + 1);

const tablas: Record<string, any[]> = {
  configuracion: [{ id: 'settings', realmId: 'r' }],
  servicios: [{ id: 's1', nombre: 'Corte de cabello', categoria: 'corte', precioSugerido: 500, duracion: 60 },
    { id: 's07', nombre: 'Retoque de raíz', precioSugerido: 550, duracion: 90 }],
  empleados: [], empleadoEvents: [], clientes: [], citas: [], avisos: [], fotos: []
};
const whatsapp: string[] = [];
globalThis.fetch = (async (entrada: any, init: any = {}) => {
  const url = new URL(String(entrada));
  const resp = (d: unknown, status = 200) => new Response(d === null ? null : JSON.stringify(d), { status });
  if (url.host === 'challenges.cloudflare.com') return resp({ success: new URLSearchParams(init.body).get('response') === 'humana' });
  if (url.host === 'graph.facebook.com') { whatsapp.push(JSON.parse(init.body).template.name); return resp({ ok: true }); }
  if (url.pathname === '/token') return resp({ accessToken: 'd' });
  const [, , tabla, id] = url.pathname.split('/');
  if ((init.method || 'GET') === 'POST') { for (const o of JSON.parse(init.body)) tablas[tabla] = [...tablas[tabla].filter(f => f.id !== o.id), o]; return resp(null); }
  if (id) { const f = tablas[tabla].find(x => x.id === decodeURIComponent(id)); return f ? resp(f) : resp(null, 404); }
  return resp(tablas[tabla].filter(f => [...url.searchParams].every(([k, v]) => f[k] === v)));
}) as typeof fetch;

const base = { DEXIE_URL: 'http://dexie', DEXIE_CLIENT_ID: 'x', DEXIE_CLIENT_SECRET: 'y', SESION_SECRETO: 'secreto' };
const ctx = { waitUntil() {}, passThroughOnException() {} } as any;
let ip = 0;
const post = (env: object, ruta: string, cuerpo: object, token?: string) => atender(new Request(`https://app/api/${ruta}`, {
  method: 'POST', body: JSON.stringify(cuerpo),
  headers: { 'CF-Connecting-IP': `10.1.0.${++ip}`, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}), env as any, ctx);
const ana = (tel: string) => ({ nombre: 'Ana López', telefono: tel });
const cita = (tel: string, extra = {}) => ({ ...ana(tel), servicioId: 's1', fecha: lunes, hora: '10:00', ...extra });

// Sin secreto de Turnstile no se pide (como hoy en producción)
assert.equal((await post(base, 'club', ana('6620000001'))).status, 201);

// Con secreto: sin token o con uno falso se rechaza y no se guarda nada; con el bueno pasa
const conRobot = { ...base, TURNSTILE_SECRETO: 's' };
const antes = tablas.clientes.length;
assert.equal((await post(conRobot, 'club', ana('6620000002'))).status, 403);
assert.equal((await post(conRobot, 'club', { ...ana('6620000002'), turnstile: 'robot' })).status, 403);
assert.equal((await post(conRobot, 'acceso/codigo', { telefono: '6620000002' })).status, 403);
assert.equal(tablas.clientes.length, antes);
assert.equal((await post(conRobot, 'club', { ...ana('6620000002'), turnstile: 'humana' })).status, 201);
assert.equal((await post(conRobot, 'citas', cita('6620000003', { turnstile: 'humana' }))).status, 201);

// Con WhatsApp conectado: sin código confirmado no se aparta horario (428, antes de gastar el token del robot)
const conWhatsApp = { ...conRobot, WA_TOKEN: 't', WA_PHONE_ID: 'p', WA_AVISOS: '526620000000' };
const citasAntes = tablas.citas.length;
const sinCodigo = await post(conWhatsApp, 'citas', cita('6620000004', { hora: '12:00', turnstile: 'humana' }));
assert.equal(sinCodigo.status, 428);
assert.match((await sinCodigo.json()).error, /código/);
assert.equal(tablas.citas.length, citasAntes);
// Con el teléfono confirmado (sesión) aparta sin robot, con el teléfono de la sesión y se le avisa por WhatsApp
const sesion = await firmar({ tipo: 'sesion', tel: '6620000004', vence: Date.now() + HORA }, base.SESION_SECRETO);
assert.equal((await post(conWhatsApp, 'citas', cita('6629999999', { hora: '12:00' }), sesion)).status, 201);
const nueva = tablas.citas.find(c => c.hora === '12:00');
assert.equal(tablas.clientes.find(c => c.id === nueva.clienteId).telefono, '6620000004');
assert.ok(nueva.creada && whatsapp.includes('cita_recibida'));

// El mismo día no se agenda en línea (Cristina lo revisa por WhatsApp): sin horarios y rechazo al pedirlo
const hoyDisp = await (await atender(new Request(`https://app/api/disponibilidad?servicioId=s1&desde=${dia(0)}&dias=1`), base as any, ctx)).json();
assert.deepEqual(hoyDisp.dias, [{ fecha: dia(0), horas: [] }]);
const paraHoy = await post(base, 'citas', cita('6620000005', { fecha: dia(0) }));
assert.equal(paraHoy.status, 400);
assert.match((await paraHoy.json()).error, /WhatsApp/);

// Catálogo: descripción de «Más info» (la de CB Control o la de respaldo) y categoría «otros» si falta
const catalogo = (await (await atender(new Request('https://app/api/servicios'), base as any, ctx)).json()).servicios;
assert.equal(catalogo.find((x: any) => x.id === 's07').descripcion.startsWith('Color solo en la raíz'), true);
assert.equal(catalogo.find((x: any) => x.id === 's07').categoria, 'otros');

// Preguntas del cabello y fotos: quedan en la cita y en «fotos»; lo inválido se descarta; el aviso lo resume
const jpg = 'data:image/jpeg;base64,' + 'A'.repeat(400);
assert.equal((await post(base, 'citas', cita('6620000006', { hora: '14:00',
  valoracion: { largo: 'hombros', color: 'tinte', quimicos: false, busca: 'Rubio miel', extra: 'x' },
  fotos: [jpg, jpg, '<svg onload=alert(1)>', 'data:image/svg+xml;base64,AAAA'] }))).status, 201);
const conFotos = tablas.citas.find(c => c.hora === '14:00');
assert.deepEqual(conFotos.valoracion, { largo: 'hombros', color: 'tinte', quimicos: false, busca: 'Rubio miel' });
assert.equal(tablas.fotos.filter(f => f.citaId === conFotos.id).length, 2);
assert.ok(tablas.avisos.some(a => a.refId === conFotos.id && /2 foto\(s\)/.test(a.detalle) && /cabello: hombros, tinte/.test(a.detalle)));
tablas.citas = tablas.citas.filter(c => c !== conFotos);

// Recordatorio al salón: citas de la app sin confirmar después de 2 h, cada 4 h, solo de 9 a 21 h (Hermosillo, UTC−7)
const a10 = Date.parse(`${dia(0)}T17:00:00Z`);   // 10:00 en Hermosillo
tablas.citas = tablas.citas.map(c => ({ ...c, creada: new Date(a10 - 3 * HORA).toISOString() }));
whatsapp.length = 0;
assert.equal(await recordarAlSalon(conWhatsApp as any, tablas.clientes, dia(0), Date.parse(`${dia(0)}T13:00:00Z`)), 0);   // 6:00: no
assert.equal(await recordarAlSalon(conWhatsApp as any, tablas.clientes, dia(0), a10), 2);
assert.deepEqual(whatsapp, ['aviso_salon']);   // un solo mensaje con las dos
assert.ok(tablas.citas.every(c => c.recordatorioSalon));
assert.equal(await recordarAlSalon(conWhatsApp as any, tablas.clientes, dia(0), a10 + 3 * HORA), 0);   // aún no pasan 4 h
assert.equal(await recordarAlSalon(conWhatsApp as any, tablas.clientes, dia(0), a10 + 5 * HORA), 2);
tablas.citas[0].estado = 'confirmada';   // la confirmada ya no se recuerda
assert.equal(await recordarAlSalon(conWhatsApp as any, tablas.clientes, dia(0), a10 + 10 * HORA), 1);

console.log('reservas ok');
