// Check: npx esbuild scripts/push.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module
// Web Push: cifrado contra el vector oficial del RFC 8291, firma VAPID y avisos de la campana al celular con Dexie Cloud
// y los servicios de push simulados con fetch.
import assert from 'node:assert/strict';
import { cifrar, vapid } from '../api/push';
import { avisosAlCelular } from '../avisos/index';

const deB64 = (s: string) => new Uint8Array(Buffer.from(s.replace(/\s/g, ''), 'base64url'));
const b64 = (b: ArrayBuffer | Uint8Array) => Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b)).toString('base64url');

// 1. RFC 8291, apéndice A: mismas llaves y sal → mismo cuerpo, byte por byte
const rfc = await cifrar(deB64('V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24'),
  'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', 'BTBZMqHH6r4Tts7J_aSIgg',
  { publica: deB64('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8'), d: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw' },
  deB64('DGv6ra1nlYgDCS1FRnbzlw'));
assert.equal(b64(rfc), b64(new Uint8Array([
  ...deB64('DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8'),
  ...deB64('8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ')])));

// Un «celular» de prueba: su par ECDH y su secreto de autenticación, para descifrar lo que le llega
const celular = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const p256dh = b64(await crypto.subtle.exportKey('raw', celular.publicKey));
const auth = b64(crypto.getRandomValues(new Uint8Array(16)));
async function descifrar(cuerpo: Uint8Array) {
  const sal = cuerpo.slice(0, 16), asPublica = cuerpo.slice(21, 86);
  assert.deepEqual([...cuerpo.slice(16, 21)], [0, 0, 16, 0, 65]);
  const secreto = await crypto.subtle.deriveBits({ name: 'ECDH', public: await crypto.subtle.importKey('raw', asPublica, { name: 'ECDH', namedCurve: 'P-256' }, false, []) }, celular.privateKey, 256);
  const hkdf = async (s: Uint8Array, ikm: ArrayBuffer, info: Uint8Array, n: number) => crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: s, info }, await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), n * 8);
  const t = (s: string) => new TextEncoder().encode(s);
  const ikm = await hkdf(deB64(auth), secreto, new Uint8Array([...t('WebPush: info\0'), ...deB64(p256dh), ...asPublica]), 32);
  const cek = await hkdf(sal, ikm, t('Content-Encoding: aes128gcm\0'), 16), nonce = await hkdf(sal, ikm, t('Content-Encoding: nonce\0'), 12);
  const claro = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']), cuerpo.slice(86)));
  assert.equal(claro.at(-1), 2);
  return JSON.parse(new TextDecoder().decode(claro.slice(0, -1)));
}

// 2. VAPID: JWT ES256 verificable con la llave pública, para el servicio de esa suscripción
const servidor = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const env = {
  VAPID_PUBLICA: b64(await crypto.subtle.exportKey('raw', servidor.publicKey)), VAPID_PRIVADA: (await crypto.subtle.exportKey('jwk', servidor.privateKey)).d!,
  DEXIE_URL: 'http://dexie', DEXIE_CLIENT_ID: 'x', DEXIE_CLIENT_SECRET: 'y'
};
const cabecera = await vapid(env, 'https://fcm.googleapis.com/fcm/send/abc');
const [, jwt, k] = cabecera.match(/^vapid t=([^,]+), k=(.+)$/)!;
assert.equal(k, env.VAPID_PUBLICA);
const [h, c, firma] = jwt.split('.');
assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, servidor.publicKey, deB64(firma), new TextEncoder().encode(`${h}.${c}`)));
assert.equal(JSON.parse(Buffer.from(c, 'base64url').toString()).aud, 'https://fcm.googleapis.com');

// 3. Avisos de la campana → celulares (Dexie Cloud y servicios de push simulados)
const ahora = Date.now(), hace = (min: number) => new Date(ahora - min * 60000).toISOString();
const tablas: Record<string, any[]> = {
  configuracion: [{ id: 'settings', realmId: 'r' }],
  realms: [{ realmId: 'r', owner: 'duena@salon.mx' }],
  members: [{ id: 'm1', realmId: 'r', userId: 'aux@salon.mx', email: 'aux@salon.mx', accepted: '2026-10-01' },
    { id: 'm2', realmId: 'r', email: 'invitada@salon.mx' }],                                   // invitada que no ha aceptado
  avisos: [
    { id: 'a1', fecha: hace(1), tipo: 'cita', titulo: 'Nueva cita desde la app: Laura', detalle: 'Babylights mañana 10:00', leido: false },
    { id: 'a2', fecha: hace(90), tipo: 'cita', titulo: 'Vieja', leido: false },                 // de hace más de media hora
    { id: 'a3', fecha: hace(2), tipo: 'club', titulo: 'Ya leída', leido: true },
    { id: 'a4', fecha: hace(3), tipo: 'sistema', titulo: 'Ya enviada', leido: false, push: hace(2) },
    { id: 'a5', fecha: hace(1), tipo: 'cita', titulo: 'De otra cuenta', leido: false, realmId: 'ajeno' }
  ],
  suscripciones: [
    { id: 'push_1', endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh, auth, owner: 'Duena@salon.mx' },
    { id: 'push_2', endpoint: 'https://web.push.apple.com/QGone', p256dh, auth, owner: 'aux@salon.mx' },   // desinstalada: 410
    { id: 'push_3', endpoint: 'https://atacante.example/robar', p256dh, auth, owner: 'aux@salon.mx' },     // no es servicio de push
    { id: 'push_4', endpoint: 'https://fcm.googleapis.com/fcm/send/ajena', p256dh, auth, owner: 'duena@salon.mx', realmId: 'ajeno' },
    { id: 'push_5', endpoint: 'https://fcm.googleapis.com/fcm/send/exaux', p256dh, auth, owner: 'exaux@salon.mx', usuario: 'duena@salon.mx' },  // ya no está en el equipo
    { id: 'push_6', endpoint: 'https://fcm.googleapis.com/fcm/send/inv', p256dh, auth, owner: 'invitada@salon.mx' }
  ]
};
for (const filas of Object.values(tablas)) for (const f of filas) f.realmId ??= 'r';
const enviados: { url: string; cuerpo: Uint8Array; headers: Record<string, string> }[] = [];
globalThis.fetch = (async (entrada: any, init: any = {}) => {
  const url = new URL(String(entrada)), metodo = init.method || 'GET';
  if (url.hostname !== 'dexie') {
    enviados.push({ url: url.href, cuerpo: init.body, headers: init.headers });
    return new Response(null, { status: url.hostname.endsWith('apple.com') ? 410 : 201 });
  }
  if (url.pathname === '/token') return Response.json({ accessToken: 't' });
  const [, , tabla, id] = url.pathname.split('/');
  if (metodo === 'DELETE') { tablas[tabla] = tablas[tabla].filter(f => f.id !== decodeURIComponent(id)); return new Response(null); }
  if (metodo === 'POST') {
    for (const o of JSON.parse(init.body)) tablas[tabla] = tablas[tabla].filter(f => f.id !== o.id).concat(o);
    return new Response(null);
  }
  if (id) return Response.json(tablas[tabla].find(f => f.id === decodeURIComponent(id)) ?? null);
  return Response.json(tablas[tabla]);
}) as typeof fetch;

assert.deepEqual(await avisosAlCelular(env as any, ahora), { avisos: 1, llegaron: 1 });
enviados.sort((a, b) => a.url.localeCompare(b.url));   // se mandan en paralelo
assert.deepEqual(enviados.map(e => e.url), ['https://fcm.googleapis.com/fcm/send/abc', 'https://web.push.apple.com/QGone']);
assert.equal(enviados[0].headers['Content-Encoding'], 'aes128gcm');
assert.deepEqual(await descifrar(enviados[0].cuerpo), { titulo: 'Nueva cita desde la app: Laura', detalle: 'Babylights mañana 10:00', id: 'a1' });
// Se borran: la de Apple (410), la que no es servicio de push y las de quien no está (o aún no) en el equipo; la de otra
// cuenta (otro realm) ni se ve
assert.deepEqual(tablas.suscripciones.map(s => s.id), ['push_1', 'push_4']);
assert.ok(tablas.avisos.find(a => a.id === 'a1').push);
assert.ok(!tablas.avisos.find(a => a.id === 'a2').push && !tablas.avisos.find(a => a.id === 'a5').push);

// Ya marcados: la siguiente vuelta no manda nada; varios nuevos a la vez llegan en un solo aviso
enviados.length = 0;
assert.deepEqual(await avisosAlCelular(env as any, ahora + 60000), { avisos: 0 });
tablas.avisos.push({ id: 'a6', fecha: hace(0), tipo: 'sistema', titulo: 'Consentimiento firmado en la app: Ana', leido: false, realmId: 'r' },
  { id: 'a7', fecha: hace(0), tipo: 'cita', titulo: 'Solicitud por confirmar a mano: Eva', leido: false, realmId: 'r' });
assert.deepEqual(await avisosAlCelular(env as any, ahora + 60000), { avisos: 2, llegaron: 1 });
assert.deepEqual(await descifrar(enviados[0].cuerpo), {
  titulo: '2 avisos nuevos en CB Control', detalle: 'Consentimiento firmado en la app: Ana · Solicitud por confirmar a mano: Eva' });

// Sin llaves no hace nada
assert.deepEqual(await avisosAlCelular({ ...env, VAPID_PRIVADA: '' } as any, ahora), { motivo: 'Web Push sin llaves' });

console.log('push ok');
