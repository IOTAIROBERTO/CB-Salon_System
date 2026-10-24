// Acceso a la base de CB Control (Dexie Cloud) desde el servidor, con la API REST y credenciales propias.
// Las credenciales viven solo como secretos de Cloudflare (DEXIE_CLIENT_ID / DEXIE_CLIENT_SECRET), nunca en el repo.
export interface EnvDexie {
  DEXIE_URL?: string;
  DEXIE_CLIENT_ID: string;
  DEXIE_CLIENT_SECRET: string;
}

const base = (env: EnvDexie) => (env.DEXIE_URL || 'https://zt3tyd7cy.dexie.cloud').replace(/\/$/, '');
let token: { valor: string; vence: number; url: string } | null = null;   // un token dura 1 h; se renueva a los 50 min

async function autorizacion(env: EnvDexie) {
  if (token && token.url === base(env) && token.vence > Date.now()) return token.valor;
  const r = await fetch(`${base(env)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials', scopes: ['ACCESS_DB', 'GLOBAL_READ', 'GLOBAL_WRITE'],
      client_id: env.DEXIE_CLIENT_ID, client_secret: env.DEXIE_CLIENT_SECRET
    })
  });
  if (!r.ok) throw new Error(`Dexie Cloud /token ${r.status}`);
  const { accessToken } = await r.json() as { accessToken: string };
  token = { valor: accessToken, vence: Date.now() + 50 * 60 * 1000, url: base(env) };
  return accessToken;
}

async function pedir(env: EnvDexie, ruta: string, init: RequestInit = {}) {
  const r = await fetch(`${base(env)}${ruta}`, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${await autorizacion(env)}`, 'Content-Type': 'application/json' }
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Dexie Cloud ${init.method || 'GET'} ${ruta.split('?')[0]} ${r.status}`);
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
}

/** Todos los objetos de una tabla, con filtros de igualdad (?campo=valor) */
export async function leer<T = any>(env: EnvDexie, tabla: string, filtros: Record<string, string> = {}): Promise<T[]> {
  const q = new URLSearchParams(filtros).toString();
  const res = await pedir(env, `/all/${encodeURIComponent(tabla)}${q ? `?${q}` : ''}`);
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export const uno = <T = any>(env: EnvDexie, tabla: string, id: string): Promise<T | null> =>
  pedir(env, `/all/${encodeURIComponent(tabla)}/${encodeURIComponent(id)}`);

/** Crea o reemplaza objetos (cada uno con realmId) */
export const guardar = (env: EnvDexie, tabla: string, objetos: object[]) =>
  pedir(env, `/all/${encodeURIComponent(tabla)}`, { method: 'POST', body: JSON.stringify(objetos) });
