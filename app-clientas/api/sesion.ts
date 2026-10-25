// Entrada de la clienta con código por WhatsApp, sin guardar nada en el servidor: el «reto» y la sesión van firmados
// con HMAC-SHA256 (secreto SESION_SECRETO en Cloudflare). El código nunca viaja de vuelta: el reto lleva su huella.
const enc = new TextEncoder();
const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function hmac(secreto: string, texto: string) {
  const clave = await crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', clave, enc.encode(texto)));
}
const iguales = (a: string, b: string) => {   // comparación en tiempo constante
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

export async function firmar(datos: object, secreto: string) {
  const cuerpo = b64(enc.encode(JSON.stringify(datos)));
  return `${cuerpo}.${await hmac(secreto, cuerpo)}`;
}

/** Datos del token si la firma es válida y no venció (campo «vence», ms) */
export async function leerFirmado<T extends { vence: number }>(token: string | null | undefined, secreto: string): Promise<T | null> {
  const [cuerpo, firma] = String(token || '').split('.');
  if (!cuerpo || !firma || !iguales(firma, await hmac(secreto, cuerpo))) return null;
  try {
    const datos = JSON.parse(new TextDecoder().decode(deB64(cuerpo))) as T;
    return datos.vence > Date.now() ? datos : null;
  } catch { return null; }
}

export const codigoNuevo = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
export const huellaCodigo = (codigo: string, telefono: string, secreto: string) => hmac(secreto, `codigo:${telefono}:${codigo}`);

export interface Reto { tipo: 'reto'; tel: string; huella: string; vence: number }
export interface Sesion { tipo: 'sesion'; tel: string; vence: number }

export const MIN_RETO = 10;          // el código vale 10 minutos
export const DIAS_SESION = 90;       // la sesión dura 90 días en ese celular
