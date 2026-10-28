// Avisos al celular del salón con Web Push: el estándar de los navegadores (Chrome en Android y computadora, Safari en
// iPhone con iOS 16.4+ y CB Control instalada), sin Meta ni Firebase. CB Control guarda la suscripción de cada
// dispositivo en la tabla `suscripciones` (campana → «Avisos en este dispositivo») y el Worker cb-avisos les manda los
// avisos nuevos. Cifrado del mensaje RFC 8291 (aes128gcm) y firma VAPID (RFC 8292), todo con WebCrypto.
// Llaves: VAPID_PUBLICA en avisos/wrangler.toml y en CB Control (src/components/avisos/AvisosCelular.tsx), deben ser
// la misma; VAPID_PRIVADA solo como secreto del Worker. Sin ellas no hace nada.
import { borrar, leer, type EnvDexie } from './dexie';

export interface EnvPush {
  VAPID_PUBLICA?: string;   // P-256 sin comprimir (65 bytes), base64url
  VAPID_PRIVADA?: string;   // d de la llave (32 bytes), base64url
}

export interface Suscripcion { id: string; endpoint: string; p256dh: string; auth: string; usuario?: string; dispositivo?: string; fecha: string }

export const pushListo = (env: EnvPush) => !!(env.VAPID_PUBLICA && env.VAPID_PRIVADA);

const b64 = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const deB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const texto = (s: string) => new TextEncoder().encode(s);
const une = (...partes: Uint8Array[]) => {
  const r = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of partes) { r.set(p, i); i += p.length; }
  return r;
};

/** Llave privada P-256 a partir de su pública sin comprimir (0x04 ‖ x ‖ y) y de d */
const privada = (publica: Uint8Array, d: string, alg: 'ECDH' | 'ECDSA') => crypto.subtle.importKey('jwk',
  { kty: 'EC', crv: 'P-256', x: b64(publica.slice(1, 33)), y: b64(publica.slice(33, 65)), d },
  { name: alg, namedCurve: 'P-256' }, false, alg === 'ECDH' ? ['deriveBits'] : ['sign']);

const hkdf = async (sal: BufferSource, ikm: BufferSource, info: BufferSource, bytes: number) =>
  new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: sal, info },
    await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), bytes * 8));

/** Cuerpo cifrado aes128gcm (RFC 8291) para una suscripción. `efimera` y `sal` solo los fija la prueba (vector del RFC). */
export async function cifrar(mensaje: Uint8Array, p256dh: string, auth: string,
  efimera?: { publica: Uint8Array; d: string }, sal = crypto.getRandomValues(new Uint8Array(16))) {
  const ua = deB64(p256dh);
  let asPublica: Uint8Array, asPrivada: CryptoKey;
  if (efimera) { asPublica = efimera.publica; asPrivada = await privada(efimera.publica, efimera.d, 'ECDH'); }
  else {
    const par = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']) as CryptoKeyPair;
    asPublica = new Uint8Array(await crypto.subtle.exportKey('raw', par.publicKey) as ArrayBuffer);
    asPrivada = par.privateKey;
  }
  const llaveUa = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  // workers-types la llama $public; en ejecución (y en el estándar) es `public`
  const secreto = await crypto.subtle.deriveBits({ name: 'ECDH', public: llaveUa } as any, asPrivada, 256);
  const ikm = await hkdf(deB64(auth), secreto, une(texto('WebPush: info\0'), ua, asPublica), 32);
  const cek = await hkdf(sal, ikm, texto('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(sal, ikm, texto('Content-Encoding: nonce\0'), 12);
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce },
    await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']), une(mensaje, new Uint8Array([2])));   // 2: último registro
  // Encabezado: sal ‖ tamaño de registro (4096) ‖ largo de la llave (65) ‖ llave pública efímera
  return une(sal, new Uint8Array([0, 0, 16, 0, 65]), asPublica, new Uint8Array(cifrado));
}

/** Encabezado Authorization con el JWT VAPID (ES256) para el servicio de push de esa suscripción */
export async function vapid(env: EnvPush, endpoint: string, ahora = Date.now()) {
  const datos = `${b64(texto(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))}.${b64(texto(JSON.stringify({
    aud: new URL(endpoint).origin, exp: Math.floor(ahora / 1000) + 12 * 3600, sub: 'https://cb-control.pages.dev'
  })))}`;
  const llave = await privada(deB64(env.VAPID_PUBLICA!), env.VAPID_PRIVADA!, 'ECDSA');
  const firma = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, llave, texto(datos));   // r ‖ s, como pide JWS
  return `vapid t=${datos}.${b64(firma)}, k=${env.VAPID_PUBLICA}`;
}

// Solo servicios de push reales (Google, Apple, Mozilla, Microsoft): quien edita la tabla no puede hacer que el Worker
// mande los avisos (nombres de clientas) a otra dirección
const SERVICIO_PUSH = /^https:\/\/([a-z0-9-]+\.)*(googleapis\.com|push\.apple\.com|mozilla\.com|mozaws\.net|notify\.windows\.com)\//;

/** Manda un aviso a todos los dispositivos suscritos del salón y borra las suscripciones que ya no existen (404/410).
 *  Devuelve a cuántos les llegó al servicio de push. */
export async function avisarCelulares(env: EnvPush & EnvDexie, aviso: { titulo: string; detalle?: string; id?: string }) {
  if (!pushListo(env)) return 0;
  const mensaje = texto(JSON.stringify(aviso));
  const subs = (await leer<Suscripcion>(env, 'suscripciones')).filter(s => SERVICIO_PUSH.test(s.endpoint));
  const llegaron = await Promise.all(subs.map(async s => {
    try {
      const r = await fetch(s.endpoint, {
        method: 'POST',
        headers: {
          Authorization: await vapid(env, s.endpoint), TTL: '86400', Urgency: 'high',
          'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream'
        },
        body: await cifrar(mensaje, s.p256dh, s.auth)
      });
      if (r.status === 404 || r.status === 410) await borrar(env, 'suscripciones', s.id);   // la desinstalaron o quitaron el permiso
      else if (!r.ok) console.log('push', r.status, (await r.text()).slice(0, 200));
      return r.ok;
    } catch (e) { console.log('push', (e as Error).message); return false; }
  }));
  return llegaron.filter(Boolean).length;
}
