// Check: npx esbuild scripts/firma.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module
// Consentimiento firmado en la app con enlace personal (API /api/firma/<id> y /api/mi-club), con Dexie Cloud simulado.
import assert from 'node:assert/strict';
import { atender } from '../api/salon';
import { firmar } from '../api/sesion';

const hex = (n: number) => n.toString(16).padStart(32, '0');
const ID = `firma_${hex(1)}`, VENCIDO = `firma_${hex(2)}`;
const pronto = new Date(Date.now() + 86400000).toISOString(), ayer = new Date(Date.now() - 86400000).toISOString();
const tablas: Record<string, any[]> = {
  clientes: [{ id: 'k1', nombre: 'Laura Pérez', telefono: '6621234567', realmId: 'r' }],
  citas: [{ id: 'c1', clienteId: 'k1', servicioId: 's1', fecha: '2026-11-03', hora: '10:00', estado: 'confirmada' }],
  servicios: [{ id: 's1', nombre: 'Babylights' }],
  consentimientos: [
    { id: ID, clienteId: 'k1', citaId: 'c1', estado: 'pendiente', vence: pronto, fotos: false, redes: 'no', fecha: ayer, realmId: 'r' },
    { id: VENCIDO, clienteId: 'k1', estado: 'pendiente', vence: ayer, fotos: false, redes: 'no', fecha: ayer, realmId: 'r' }
  ],
  avisos: [], ventas: [], movimientosSaldo: [], configuracion: [{ id: 'settings', realmId: 'r' }]
};
globalThis.fetch = (async (entrada: any, init: any = {}) => {
  const url = new URL(String(entrada));
  const resp = (d: unknown, status = 200) => new Response(d === null ? null : JSON.stringify(d), { status });
  if (url.pathname === '/token') return resp({ accessToken: 'd' });
  const [, , tabla, id] = url.pathname.split('/');
  if ((init.method || 'GET') === 'POST') { for (const o of JSON.parse(init.body)) tablas[tabla] = [...tablas[tabla].filter(f => f.id !== o.id), o]; return resp(null); }
  if (id) { const f = tablas[tabla].find(x => x.id === decodeURIComponent(id)); return f ? resp(f) : resp(null, 404); }
  return resp(tablas[tabla].filter(f => [...url.searchParams].every(([k, v]) => f[k] === v)));
}) as typeof fetch;

const env = { DEXIE_URL: 'http://dexie', DEXIE_CLIENT_ID: 'x', DEXIE_CLIENT_SECRET: 'y', SESION_SECRETO: 'secreto-de-prueba' } as any;
const ctx = { waitUntil() {}, passThroughOnException() {} } as any;
let ip = 0;   // cada intento desde otra IP (el tope por IP es de la API, no de esta prueba)
const api = (ruta: string, cuerpo?: object, token?: string) => atender(new Request(`https://app/api/${ruta}`, cuerpo
  ? { method: 'POST', body: JSON.stringify(cuerpo), headers: { 'CF-Connecting-IP': `10.0.0.${++ip}`, 'User-Agent': 'prueba' } }
  : { headers: token ? { Authorization: `Bearer ${token}` } : {} }), env, ctx);
const firmaPng = 'data:image/png;base64,' + 'A'.repeat(2000);
const bien = { datosSalud: true, salud: [1, 4, 99, -1, 'x', 4], fotos: false, redes: 'con_rostro', marketing: true, nombreFirma: '  Laura   Pérez ', firma: firmaPng };

// Enlaces que no sirven
assert.equal((await api('firma/cualquier-cosa')).status, 404);
assert.equal((await api(`firma/firma_${hex(9)}`)).status, 404);
assert.equal((await api(`firma/${VENCIDO}`)).status, 410);

// Enlace válido: nombre, servicio y fecha de la cita
const ver = await api(`firma/${ID}`);
assert.equal(ver.status, 200);
assert.deepEqual(await ver.json(), { nombre: 'Laura Pérez', servicio: 'Babylights', fecha: '2026-11-03', hora: '10:00' });

// Mi Club con sesión: aparece por firmar (el vencido no)
const sesion = await firmar({ tipo: 'sesion', tel: '6621234567', vence: Date.now() + 3600000 }, env.SESION_SECRETO);
assert.deepEqual((await (await api('mi-club', undefined, sesion)).json()).porFirmar, [{ id: ID, servicio: 'Babylights', fecha: '2026-11-03' }]);

// Datos incompletos: no se guarda nada
assert.equal((await api(`firma/${ID}`, { ...bien, datosSalud: false })).status, 400);
assert.equal((await api(`firma/${ID}`, { ...bien, firma: 'data:image/png;base64,AAAA' })).status, 400);
assert.equal((await api(`firma/${ID}`, { ...bien, firma: '<svg onload=alert(1)>' })).status, 400);
assert.equal((await api(`firma/${ID}`, { ...bien, menor: true, tutor: '' })).status, 400);
assert.equal(tablas.consentimientos.find(c => c.id === ID).estado, 'pendiente');

// Firma correcta: respuestas limpias, sin fotos no hay redes, constancia y aviso a la campana
assert.equal((await api(`firma/${ID}`, bien)).status, 200);
const c = tablas.consentimientos.find(x => x.id === ID);
assert.equal(c.estado, 'firmado');
assert.deepEqual(c.salud, [1, 4]);
assert.equal(c.redes, 'no');
assert.equal(c.nombreFirma, 'Laura Pérez');
assert.equal(c.marketing, true);
assert.equal(c.realmId, 'r');
assert.match(c.evidencia.huella, /^[a-f0-9]{64}$/);
assert.equal(c.evidencia.agente, 'prueba');
assert.equal(c.evidencia.version, '2026-10');
assert.ok(tablas.avisos.some(a => a.tipo === 'sistema' && a.titulo.includes('Laura Pérez') && a.detalle.includes('2 punto(s) de salud') && a.refId === 'c1'));

// Un solo uso
assert.equal((await api(`firma/${ID}`, bien)).status, 409);
assert.equal((await api(`firma/${ID}`)).status, 409);
assert.deepEqual((await (await api('mi-club', undefined, sesion)).json()).porFirmar, []);

console.log('firma ok');
