// Avisos automáticos por WhatsApp (Worker con horario, cada 10 minutos):
// - a la clienta: confirmación cuando el salón confirma en CB Control una cita que pidió desde la app, y recordatorio
//   el día anterior a su cita confirmada;
// - al salón: las citas de la app que siguen sin confirmar (no vencen solas), cada 4 h de 9 a 21 h hasta confirmarlas.
// Cada cita guarda la marca de lo que ya se le mandó, así nunca se repite. Sin los secretos de WhatsApp no hace nada.
import { guardar, leer } from '../api/dexie';
import { espejo } from '../api/google';
import { avisarSalon, plantilla, whatsappListo } from '../api/whatsapp';
import { fechaLegible, hoyHermosillo, masDias, type Env as EnvApi } from '../api/salon';

type Env = EnvApi & { RECORDATORIOS?: 'app' | 'todas' };   // 'todas': también las citas que agenda el salón a mano

const CADA_MINUTO = '* * * * *';   // igual que en wrangler.toml
const pesos = (n: number) => `$${Number(n || 0).toLocaleString('es-MX')}`;

export async function revisar(env: Env) {
  if (!whatsappListo(env)) return { enviados: 0, motivo: 'WhatsApp sin conectar' };
  const [citas, clientes, servicios] = await Promise.all([leer<any>(env, 'citas', { estado: 'confirmada' }), leer<any>(env, 'clientes'), leer<any>(env, 'servicios')]);
  const hoy = hoyHermosillo(), manana = masDias(hoy, 1);
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
  return { enviados, porConfirmar: await recordarAlSalon(env, clientes, hoy) };
}

const HORA = 3600 * 1000;
/** Cuándo llegó la cita de la app (campo `creada`; las primeras solo lo traen en el id cita_app_<ms>_…) */
const llegada = (c: any) => Date.parse(c.creada || '') || Number(String(c.id).split('_')[2]) || 0;

/** Recordatorio al salón de las citas de la app sin confirmar: después de 2 h y cada 4 h, solo de 9 a 21 h. Un mensaje
 *  con todas; cada cita guarda cuándo se recordó. */
export async function recordarAlSalon(env: Env, clientes: any[], hoy: string, ahora = Date.now()) {
  const hora = new Date(ahora - 7 * HORA).getUTCHours();
  if (hora < 9 || hora >= 21 || !env.WA_AVISOS) return 0;
  const toca = (await leer<any>(env, 'citas', { estado: 'pendiente' })).filter(c => c.origen && c.fecha >= hoy
    && ahora - llegada(c) > 2 * HORA && (!c.recordatorioSalon || ahora - Date.parse(c.recordatorioSalon) > 4 * HORA));
  if (!toca.length) return 0;
  const lista = toca.map(c => `${String(clientes.find(x => x.id === c.clienteId)?.nombre || 'Clienta').split(' ')[0]} ${fechaLegible(c.fecha)} ${c.hora}`).join('; ');
  await avisarSalon(env, `${toca.length === 1 ? 'Hay 1 cita' : `Hay ${toca.length} citas`} de la app sin confirmar: ${lista}`.slice(0, 900) + '. Confírmalas en CB Control (campana).');
  const marca = new Date(ahora).toISOString();
  await guardar(env, 'citas', toca.map(c => ({ ...c, recordatorioSalon: marca })));
  return toca.length;
}

export default {
  // Cada minuto: espejo de citas en Google Calendar; cada 10: avisos por WhatsApp
  async scheduled(evento: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (evento.cron === CADA_MINUTO) ctx.waitUntil(espejo(env).then(r => console.log('google', JSON.stringify(r))));
    else ctx.waitUntil(revisar(env).then(r => console.log('avisos', JSON.stringify(r))));
  }
} satisfies ExportedHandler<Env>;
