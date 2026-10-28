// Avisos automáticos (Worker con horario):
// - a la clienta, por WhatsApp cada 10 minutos: confirmación cuando el salón confirma en CB Control una cita que pidió
//   desde la app, y recordatorio el día anterior a su cita confirmada;
// - al salón: las citas de la app que siguen sin confirmar (no vencen solas), cada 4 h de 9 a 21 h hasta confirmarlas,
//   por WhatsApp y al celular (Web Push); y cada minuto, al celular, cada aviso nuevo de la campana.
// Cada cita y aviso guarda la marca de lo que ya se mandó, así nunca se repite. Sin los secretos de cada canal no lo usa.
import { guardar, leer } from '../api/dexie';
import { espejo } from '../api/google';
import { avisarCelulares, pushListo, type EnvPush } from '../api/push';
import { avisarSalon, plantilla, whatsappListo } from '../api/whatsapp';
import { fechaLegible, hoyHermosillo, masDias, type Env as EnvApi } from '../api/salon';

type Env = EnvApi & EnvPush & { RECORDATORIOS?: 'app' | 'todas' };   // 'todas': también las citas que agenda el salón a mano

const CADA_MINUTO = '* * * * *';   // igual que en wrangler.toml
const pesos = (n: number) => `$${Number(n || 0).toLocaleString('es-MX')}`;

export async function revisar(env: Env) {
  const hoy = hoyHermosillo(), manana = masDias(hoy, 1);
  const clientes = await leer<any>(env, 'clientes');
  const porConfirmar = await recordarAlSalon(env, clientes, hoy);
  if (!whatsappListo(env)) return { enviados: 0, motivo: 'WhatsApp sin conectar', porConfirmar };
  const [citas, servicios] = await Promise.all([leer<any>(env, 'citas', { estado: 'confirmada' }), leer<any>(env, 'servicios')]);
  let enviados = 0;
  for (const c of citas.filter(x => x.fecha >= hoy)) {
    const cliente = clientes.find(x => x.id === c.clienteId);
    if (!cliente?.telefono) continue;
    const nombre = String(cliente.nombre).split(' ')[0];
    const servicio = servicios.find(s => s.id === c.servicioId)?.nombre || 'tu servicio';
    const cambios: Record<string, string> = {};
    if (c.origen === 'app' && !c.avisoConfirmacion &&
      await plantilla(env, cliente.telefono, 'cita_confirmada', [nombre, servicio, fechaLegible(c.fecha), c.hora, c.montoAnticipo && !c.anticipoConfirmado ? `Anticipo para apartar: ${pesos(c.montoAnticipo)}.` : 'Tu horario está apartado.'])) {
      cambios.avisoConfirmacion = new Date().toISOString();
    }
    if (c.fecha === manana && !c.recordatorio && (c.origen === 'app' || env.RECORDATORIOS === 'todas') &&
      await plantilla(env, cliente.telefono, 'recordatorio_cita', [nombre, servicio, fechaLegible(c.fecha), c.hora])) {
      cambios.recordatorio = new Date().toISOString();
    }
    if (Object.keys(cambios).length) { await guardar(env, 'citas', [{ ...c, ...cambios }]); enviados++; }
  }
  return { enviados, porConfirmar };
}

const HORA = 3600 * 1000;
/** Cuándo llegó la cita de la app (campo `creada`; las primeras solo lo traen en el id cita_app_<ms>_…) */
const llegada = (c: any) => Date.parse(c.creada || '') || Number(String(c.id).split('_')[2]) || 0;

/** Recordatorio al salón de las citas de la app sin confirmar: después de 2 h y cada 4 h, solo de 9 a 21 h. Un mensaje
 *  con todas (WhatsApp y celular); cada cita guarda cuándo se recordó. */
export async function recordarAlSalon(env: Env, clientes: any[], hoy: string, ahora = Date.now()) {
  const hora = new Date(ahora - 7 * HORA).getUTCHours();
  if (hora < 9 || hora >= 21 || !(env.WA_AVISOS || pushListo(env))) return 0;
  const toca = (await leer<any>(env, 'citas', { estado: 'pendiente' })).filter(c => c.origen && c.fecha >= hoy
    && ahora - llegada(c) > 2 * HORA && (!c.recordatorioSalon || ahora - Date.parse(c.recordatorioSalon) > 4 * HORA));
  if (!toca.length) return 0;
  const lista = toca.map(c => `${String(clientes.find(x => x.id === c.clienteId)?.nombre || 'Clienta').split(' ')[0]} ${fechaLegible(c.fecha)} ${c.hora}`).join('; ');
  const titulo = `${toca.length === 1 ? 'Hay 1 cita' : `Hay ${toca.length} citas`} de la app sin confirmar`;
  await avisarSalon(env, `${titulo}: ${lista}`.slice(0, 900) + '. Confírmalas en CB Control (campana).');
  await avisarCelulares(env, { titulo, detalle: `${lista}. Valóralas en la campana.`.slice(0, 300) });
  const marca = new Date(ahora).toISOString();
  await guardar(env, 'citas', toca.map(c => ({ ...c, recordatorioSalon: marca })));
  return toca.length;
}

const MINUTO = 60 * 1000;
/** Cada minuto: los avisos nuevos de la campana (citas y solicitudes de la app, Club, consentimientos firmados) al
 *  celular del salón; uno solo si llegaron varios. Solo los de la última media hora sin leer: así no revive avisos viejos
 *  al encender las llaves. */
// ponytail: lee la tabla avisos entera cada minuto (crece unos pocos al día); filtrar por fecha en Dexie si un día pesa.
// La marca reescribe el aviso completo: si alguien lo marca leído en el mismo instante, vuelve a «sin leer».
export async function avisosAlCelular(env: Env, ahora = Date.now()) {
  if (!pushListo(env)) return { motivo: 'Web Push sin llaves' };
  const nuevos = (await leer<any>(env, 'avisos')).filter(a => !a.leido && !a.push && Date.parse(a.fecha) > ahora - 30 * MINUTO);
  if (!nuevos.length) return { avisos: 0 };
  const llegaron = await avisarCelulares(env, nuevos.length === 1
    ? { titulo: nuevos[0].titulo, detalle: nuevos[0].detalle, id: nuevos[0].id }
    : { titulo: `${nuevos.length} avisos nuevos en CB Control`, detalle: nuevos.map(a => a.titulo).join(' · ').slice(0, 300) });
  const marca = new Date(ahora).toISOString();
  await guardar(env, 'avisos', nuevos.map(a => ({ ...a, push: marca })));
  return { avisos: nuevos.length, llegaron };
}

/** Cada minuto: primero los avisos al celular (pocas consultas, no deben esperar) y luego el espejo de Google. Comparten
 *  las 50 consultas por vuelta del plan gratis (Cloudflare junta en una sola vuelta los horarios del mismo minuto): si el
 *  espejo llega al límite, lo que falte se escribe en la vuelta siguiente, como ya hace con su tope de escrituras. */
async function cadaMinuto(env: Env) {
  console.log('celular', JSON.stringify(await avisosAlCelular(env).catch(e => ({ error: (e as Error).message }))));
  console.log('google', JSON.stringify(await espejo(env)));
}

export default {
  // Cada minuto: avisos al celular y espejo de citas en Google Calendar; cada 10: avisos por WhatsApp
  async scheduled(evento: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (evento.cron === CADA_MINUTO) ctx.waitUntil(cadaMinuto(env));
    else ctx.waitUntil(revisar(env).then(r => console.log('avisos', JSON.stringify(r))));
  }
} satisfies ExportedHandler<Env>;
