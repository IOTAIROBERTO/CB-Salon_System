// Avisos automáticos a las clientas por WhatsApp (Worker con horario, cada 10 minutos):
// - confirmación cuando el salón confirma en CB Control una cita que pidió desde la app;
// - recordatorio el día anterior a su cita confirmada.
// Cada cita guarda la marca de lo que ya se le mandó, así nunca se repite. Sin los secretos de WhatsApp no hace nada.
import { guardar, leer } from '../api/dexie';
import { espejo } from '../api/google';
import { plantilla, whatsappListo } from '../api/whatsapp';
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
  return { enviados };
}

export default {
  // Cada minuto: espejo de citas en Google Calendar; cada 10: avisos por WhatsApp
  async scheduled(evento: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (evento.cron === CADA_MINUTO) ctx.waitUntil(espejo(env).then(r => console.log('google', JSON.stringify(r))));
    else ctx.waitUntil(revisar(env).then(r => console.log('avisos', JSON.stringify(r))));
  }
} satisfies ExportedHandler<Env>;
