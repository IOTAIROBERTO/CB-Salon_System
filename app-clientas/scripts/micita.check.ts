// Check: npx esbuild scripts/micita.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module
// «Mi cita»: enlace personal de la cita (ver, cambiar y cancelar sola con la política de 48 h y el saldo a favor),
// «no llegó» libera la agenda y el anticipo que se queda el salón cuenta como ingreso. Dexie Cloud simulado con fetch.
import assert from 'node:assert/strict';
import { atender } from '../api/salon';
import { ingresoCita } from '../../salon-control-app/src/utils/reportUtils';

const HORA = 3600 * 1000;
const dia = (n: number) => new Date(Date.now() - 7 * HORA + n * 86400000).toISOString().slice(0, 10);
const diaHabil = (desde: number) => {   // el primer lunes a viernes desde `desde` días (el horario inicial abre de lunes a sábado)
  for (let n = desde; ; n++) if (![0, 6].includes(new Date(`${dia(n)}T12:00:00Z`).getUTCDay())) return dia(n);
};
const lejos = diaHabil(5), otroLejos = diaHabil(Math.round((Date.parse(`${lejos}T12:00:00Z`) - Date.parse(`${dia(0)}T12:00:00Z`)) / 86400000) + 1);

const tablas: Record<string, any[]> = {
  configuracion: [{ id: 'settings', datosPago: 'BBVA 0123 4567' }],
  servicios: [{ id: 's1', nombre: 'Corte de cabello', categoria: 'corte', precioSugerido: 500, anticipoSugerido: 150, duracion: 60 }],
  clientes: [{ id: 'k1', nombre: 'Laura Pérez Soto', telefono: '6621234567' }],
  empleados: [], empleadoEvents: [], citas: [], avisos: [], fotos: [], movimientosSaldo: []
};
for (const filas of Object.values(tablas)) for (const f of filas) f.realmId ??= 'r';
globalThis.fetch = (async (entrada: any, init: any = {}) => {
  const url = new URL(String(entrada));
  const resp = (d: unknown, status = 200) => new Response(d === null ? null : JSON.stringify(d), { status });
  if (url.pathname === '/token') return resp({ accessToken: 'd' });
  const [, , tabla, id] = url.pathname.split('/');
  // Como Dexie Cloud: guardar reemplaza el objeto entero (lo que va sin valor desaparece)
  if ((init.method || 'GET') === 'POST') { for (const o of JSON.parse(init.body)) tablas[tabla] = [...tablas[tabla].filter(f => f.id !== o.id), o]; return resp(null); }
  if (id) { const f = tablas[tabla].find(x => x.id === decodeURIComponent(id)); return f ? resp(f) : resp(null, 404); }
  return resp(tablas[tabla].filter(f => [...url.searchParams].every(([k, v]) => f[k] === v)));
}) as typeof fetch;

const env = { DEXIE_URL: 'http://dexie', DEXIE_CLIENT_ID: 'x', DEXIE_CLIENT_SECRET: 'y' } as any;
const ctx = { waitUntil() {}, passThroughOnException() {} } as any;
let ip = 0;
const pedir = (ruta: string, cuerpo?: object) => atender(new Request(`https://app/api/${ruta}`, cuerpo
  ? { method: 'POST', body: JSON.stringify(cuerpo), headers: { 'CF-Connecting-IP': `10.2.0.${++ip}` } } : undefined), env, ctx);
const cita = (id: string) => tablas.citas.find(c => c.id === id);

// 1. Al apartar desde la app, la respuesta trae su enlace y la cita guarda el secreto
const r = await (await pedir('citas', { nombre: 'Laura Pérez Soto', telefono: '6621234567', servicioId: 's1', fecha: lejos, hora: '10:00' })).json();
assert.match(r.cita.enlace, /^cita_app_[\w]+\.[a-f0-9]{32}$/);
const ref = r.cita.enlace, id = ref.split('.')[0];
assert.equal(cita(id).enlace, ref.split('.')[1]);

// 2. Ver: solo su nombre de pila, sin teléfono; datos de pago solo si su anticipo por transferencia sigue pendiente
let v = await (await pedir(`cita/${ref}`)).json();
assert.equal(v.nombre, 'Laura');
assert.ok(!JSON.stringify(v).includes('6621234567') && !JSON.stringify(v).includes('Soto'));
assert.deepEqual([v.estado, v.precio, v.precioAcordado, v.anticipo, v.anticipoPagado, v.datosPago, v.puedeCancelar, v.puedeReagendar],
  ['pendiente', 500, false, 150, false, '', true, true]);
Object.assign(cita(id), { precioAcordado: 650, formaAnticipo: 'transferencia' });
v = await (await pedir(`cita/${ref}`)).json();
assert.deepEqual([v.precio, v.precioAcordado, v.datosPago], [650, true, 'BBVA 0123 4567']);
// Enlace con otro secreto, mal formado o de otra cuenta: «no válido», sin decir si la cita existe
assert.equal((await pedir(`cita/${id}.${'0'.repeat(32)}`)).status, 404);
assert.equal((await pedir(`cita/${id}`)).status, 404);
tablas.citas.push({ ...cita(id), id: 'ajena', realmId: 'otra' });
assert.equal((await pedir(`cita/ajena.${ref.split('.')[1]}`)).status, 404);

// 3. Cambiar: a un horario ocupado no; a uno libre sí (sigue como estaba, el recordatorio se vuelve a mandar)
tablas.citas.push({ id: 'otra', clienteId: 'k9', servicioId: 's1', fecha: otroLejos, hora: '12:00', estado: 'confirmada', realmId: 'r' });
assert.equal((await pedir(`cita/${ref}/reagendar`, { fecha: otroLejos, hora: '12:00' })).status, 409);
assert.equal((await pedir(`cita/${ref}/reagendar`, { fecha: dia(0), hora: '12:00' })).status, 400);   // hoy, no
cita(id).recordatorio = '2026-01-01T00:00:00Z';
v = await (await pedir(`cita/${ref}/reagendar`, { fecha: otroLejos, hora: '15:00' })).json();
assert.deepEqual([v.fecha, v.hora, v.estado], [otroLejos, '15:00', 'pendiente']);
assert.equal(cita(id).recordatorio, undefined);
assert.ok(tablas.avisos.some(a => /Cambió su cita/.test(a.titulo) && a.refId === id));
// Cambiar dentro de la misma hora no choca consigo misma
assert.equal((await pedir(`cita/${ref}/reagendar`, { fecha: otroLejos, hora: '15:30' })).status, 200);

// 4. «No llegó» y canceladas no ocupan: ese horario vuelve a estar libre
tablas.citas.find(c => c.id === 'otra').estado = 'no_llego';
const libres = await (await pedir(`disponibilidad?servicioId=s1&desde=${otroLejos}&dias=1`)).json();
assert.ok(libres.dias[0].horas.includes('12:00'));

// 5. Cancelar con 48 h o más y anticipo pagado: pasa a saldo a favor, una sola vez
Object.assign(cita(id), { anticipoConfirmado: true, montoAnticipo: 150, estado: 'confirmada' });
v = await (await pedir(`cita/${ref}/cancelar`, {})).json();
assert.deepEqual([v.estado, v.anticipoASaldo, v.puedeCancelar, v.puedeReagendar], ['cancelada', 150, false, false]);
assert.equal((await pedir(`cita/${ref}/cancelar`, {})).status, 409);
assert.deepEqual(tablas.movimientosSaldo.map(m => [m.clienteId, m.monto, m.citaId]), [['k1', 150, id]]);
assert.ok(tablas.avisos.some(a => /Canceló su cita/.test(a.titulo) && /saldo a favor/.test(a.detalle)));
assert.equal(ingresoCita(cita(id)), 150);   // ingreso al recibirlo; al usar el saldo en otro cobro ya no vuelve a contar

// 6. Con menos de 48 h: no se puede cambiar; al cancelar, el anticipo se pierde (y cuenta como ingreso), sin saldo
const tarde = { id: 'tarde', clienteId: 'k1', servicioId: 's1', fecha: dia(1), hora: '23:00', estado: 'confirmada',
  anticipoConfirmado: true, montoAnticipo: 200, enlace: 'a'.repeat(32), realmId: 'r' };
tablas.citas.push(tarde);
v = await (await pedir(`cita/tarde.${'a'.repeat(32)}`)).json();
assert.deepEqual([v.sinCosto, v.puedeCancelar, v.puedeReagendar], [false, true, false]);
assert.equal((await pedir(`cita/tarde.${'a'.repeat(32)}/reagendar`, { fecha: otroLejos, hora: '17:00' })).status, 409);
v = await (await pedir(`cita/tarde.${'a'.repeat(32)}/cancelar`, {})).json();
assert.deepEqual([v.estado, v.anticipoPerdido, v.anticipoASaldo], ['cancelada', 200, undefined]);
assert.equal(tablas.movimientosSaldo.length, 1);
assert.equal(ingresoCita(cita('tarde')), 200);
assert.equal(ingresoCita({ ...cita('tarde'), estado: 'no_llego', anticipoPerdido: undefined }), 0);   // sin anticipo pagado, nada

console.log('micita ok');
