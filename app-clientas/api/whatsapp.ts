// Mensajes por WhatsApp con la API oficial de Meta (WhatsApp Cloud API), desde el 662 161 4688 en coexistencia con la
// app WhatsApp Business. Mientras no estén los secretos, no hace nada: los avisos igual llegan a CB Control.
// Las plantillas (nombres y textos) están en app-clientas/README.md → «Plantillas de WhatsApp».
export interface EnvWhatsApp {
  WA_TOKEN?: string;           // token permanente del usuario de sistema de Meta Business
  WA_PHONE_ID?: string;        // id del número que envía (el 662 161 4688)
  WA_AVISOS?: string;          // números que reciben los avisos del salón, separados por coma (52 + 10 dígitos)
  WA_API_URL?: string;         // solo para pruebas locales (por defecto la API de Meta)
}

export const whatsappListo = (env: EnvWhatsApp) => !!(env.WA_TOKEN && env.WA_PHONE_ID);
const a52 = (tel: string) => { const d = tel.replace(/\D/g, ''); return d.length === 10 ? `52${d}` : d; };

async function enviar(env: EnvWhatsApp, cuerpo: object) {
  const r = await fetch(`${env.WA_API_URL || 'https://graph.facebook.com'}/v21.0/${env.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...cuerpo })
  });
  if (!r.ok) console.log('WhatsApp', r.status, await r.text());
  return r.ok;
}

/** Plantilla aprobada con parámetros de texto en el cuerpo (y, para el código, también en el botón «Copiar código») */
export async function plantilla(env: EnvWhatsApp, tel: string, nombre: string, parametros: string[], codigo?: string) {
  if (!whatsappListo(env)) return false;
  const components: object[] = [{ type: 'body', parameters: parametros.map(text => ({ type: 'text', text: text.slice(0, 1000) })) }];
  if (codigo) components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: codigo }] });
  return enviar(env, { to: a52(tel), type: 'template', template: { name: nombre, language: { code: 'es_MX' }, components } });
}

/** Aviso al salón (Cristina y Roberto, a números distintos del que envía) */
export async function avisarSalon(env: EnvWhatsApp, texto: string) {
  if (!whatsappListo(env) || !env.WA_AVISOS) return;
  await Promise.all(env.WA_AVISOS.split(',').map(n => n.trim()).filter(Boolean).map(to => plantilla(env, to, 'aviso_salon', [texto])));
}
