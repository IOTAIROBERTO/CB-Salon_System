// Avisos por WhatsApp con la API oficial de Meta (WhatsApp Cloud API). Mientras no estén los secretos, no hace nada:
// el aviso igual llega a CB Control en tiempo real.
export interface EnvWhatsApp {
  WA_TOKEN?: string;           // token permanente del usuario de sistema de Meta Business
  WA_PHONE_ID?: string;        // id del número que envía
  WA_AVISOS?: string;          // números que reciben los avisos del salón, separados por coma (52 + 10 dígitos)
  WA_PLANTILLA_AVISO?: string; // plantilla aprobada con un parámetro de texto (por defecto «aviso_salon»)
}

const configurado = (env: EnvWhatsApp) => !!(env.WA_TOKEN && env.WA_PHONE_ID);

async function enviar(env: EnvWhatsApp, cuerpo: object) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...cuerpo })
  });
  if (!r.ok) console.log('WhatsApp', r.status, await r.text());
}

/** Aviso al salón (Cristina y Roberto): plantilla, porque el salón no les escribió antes */
export async function avisarSalon(env: EnvWhatsApp, texto: string) {
  if (!configurado(env) || !env.WA_AVISOS) return;
  await Promise.all(env.WA_AVISOS.split(',').map(n => n.trim()).filter(Boolean).map(to => enviar(env, {
    to, type: 'template',
    template: { name: env.WA_PLANTILLA_AVISO || 'aviso_salon', language: { code: 'es_MX' },
      components: [{ type: 'body', parameters: [{ type: 'text', text: texto.slice(0, 1000) }] }] }
  })));
}
