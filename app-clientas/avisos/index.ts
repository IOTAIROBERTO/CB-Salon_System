// Avisos automáticos (Worker con horario):
// - a la clienta, por WhatsApp cada 10 minutos: confirmación cuando el salón confirma en CB Control una cita que pidió
//   desde la app, y recordatorio el día anterior a su cita confirmada;
// - al salón: las citas de la app que siguen sin confirmar (no vencen solas), cada 4 h de 9 a 21 h hasta confirmarlas,
//   por WhatsApp y al celular (Web Push); y cada minuto, al celular, cada aviso nuevo de la campana.
// Cada cita y aviso guarda la marca de lo que ya se mandó, así nunca se repite. Sin los secretos de cada canal no lo usa.
import { guardar, leer, uno } from '../api/dexie';
import { espejo } from '../api/google';
import { avisarCelulares, pushListo, type EnvPush } from '../api/push';
import { avisarSalon, plantilla, whatsappListo } from '../api/whatsapp';
import { fechaLegible, hoyHermosillo, masDias, type Env as EnvApi } from '../api/salon';
import { ultimaPreferencia } from '../../salon-control-app/src/utils/agenda';

type Env = EnvApi & EnvPush & { RECORDATORIOS?: 'app' | 'todas' };   // 'todas': también las citas que agenda el salón a mano

const CADA_MINUTO = '* * * * *';   // igual que en wrangler.toml
const pesos = (n: number) => `$${Number(n || 0).toLocaleString('es-MX')}`;

export async function revisar(env: Env) {
  const hoy = hoyHermosillo(), manana = masDias(hoy, 1);
  const pedidos = await vencerPedidos(env).catch(e => ({ error: (e as Error).message }));
  const propuestas = await vencerSolicitudes(env, hoy).catch(e => ({ error: (e as Error).message }));
  const clientes = await leer<any>(env, 'clientes');
  const porConfirmar = await recordarAlSalon(env, clientes, hoy);
  if (!whatsappListo(env)) return { enviados: 0, motivo: 'WhatsApp sin conectar', porConfirmar, pedidos, propuestas };
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
  return { enviados, porConfirmar, pedidos, propuestas };
}

/** Cada 10 min: la hora propuesta que no se aceptó a tiempo se suelta y la solicitud vuelve a esperar hora; la que ya no
 *  tiene ninguna fecha por delante se cancela sola (y suelta lo que apartó del carrito). Cada caso avisa en la campana.
 *  Se relee antes de escribir para no pisar lo que acabe de hacer la clienta o el salón. */
export async function vencerSolicitudes(env: Env, hoy: string, ahora = Date.now()) {
  const marca = new Date(ahora).toISOString();
  const [pendientes, solicitudes] = await Promise.all(['pendiente', 'solicitud'].map(estado => leer<any>(env, 'citas', { estado })));
  const vencida = (c: any) => c.estado === 'pendiente' && c.propuestaVence && !c.aceptadaEn && !c.anticipoConfirmado && Date.parse(c.propuestaVence) <= ahora;
  const sinFechas = (c: any) => c.estado === 'solicitud' && ultimaPreferencia(c) <= hoy;
  let liberadas = 0, canceladas = 0;
  for (const vista of [...pendientes.filter(vencida), ...solicitudes.filter(sinFechas)]) {
    const c = await uno<any>(env, 'citas', vista.id);
    if (!c || !(vencida(c) || sinFechas(c))) continue;
    const quien = String((await uno<any>(env, 'clientes', c.clienteId))?.nombre || 'Clienta');
    const servicio = (await uno<any>(env, 'servicios', c.servicioId))?.nombre || 'Servicio';
    const preferencias = (c.preferencias || []).filter((p: any) => p.fecha > hoy);
    const avisar = (titulo: string, detalle: string) => guardar(env, 'avisos', [{ id: `avi_solicitud_${c.id}_${ahora}`, fecha: marca, tipo: 'cita', titulo, detalle,
      refId: c.id, clienteId: c.clienteId, leido: false, realmId: c.realmId }]);
    if (preferencias.length) {
      await guardar(env, 'citas', [{ ...c, estado: 'solicitud', fecha: preferencias[0].fecha, hora: '', atiendeId: undefined, propuestaVence: undefined, preferencias,
        propuestaVencida: true, recordatorioSalon: undefined }]);
      await avisar(`No aceptó la hora a tiempo: ${quien}`, `${servicio}, ${fechaLegible(c.fecha)} a las ${c.hora}. El horario quedó libre y la solicitud espera otra hora.`);
      liberadas++;
    } else {
      const motivo = c.hora ? 'no se aceptó la hora a tiempo' : 'pasaron sus fechas sin hora';
      await guardar(env, 'citas', [{ ...c, estado: 'cancelada', canceladaPor: 'sistema', canceladaEn: marca, canceladaMotivo: motivo, propuestaVence: undefined }]);
      const porPagar = (await leer<any>(env, 'pedidos', { citaId: c.id })).filter(p => p.estado === 'por_pagar');
      if (porPagar.length) await guardar(env, 'pedidos', porPagar.map(p => ({ ...p, estado: 'cancelado', motivo: 'Se canceló su solicitud' })));
      await avisar(`Se canceló sola una solicitud: ${quien}`, `${servicio}: ${motivo}.${porPagar.length ? ' Lo que apartó volvió a la venta.' : ''}`);
      canceladas++;
    }
  }
  return { liberadas, canceladas };
}

/** «Mi carrito» (cada 10 min): lo que no se pagó a tiempo vence solo y libera los productos y, si la cita seguía
 *  esperando ese pago, también su horario; lo pagado que no se recogió en 10 días vuelve a la venta y queda como saldo a
 *  favor. Un pago que llegue después no revive nada (con Mercado Pago se devuelve solo). Cada aviso llega a la campana. */
export async function vencerPedidos(env: Env, ahora = Date.now()) {
  const pedidos = await leer<any>(env, 'pedidos');
  const vencidos = pedidos.filter(p => p.estado === 'por_pagar' && p.venceEn && Date.parse(p.venceEn) <= ahora);
  const noRecogidos = pedidos.filter(p => p.estado === 'pagado' && p.items?.length && p.recogerHasta && !p.entregadoEn && Date.parse(p.recogerHasta) <= ahora);
  if (!vencidos.length && !noRecogidos.length) return { vencidos: 0, noRecogidos: 0 };
  const marca = new Date(ahora).toISOString();
  const quien = async (p: any) => String((await uno<any>(env, 'clientes', p.clienteId))?.nombre || 'Clienta');
  const productos = (p: any) => p.items.map((i: any) => `${i.cantidad} × ${i.nombre}`).join(', ');
  const avisar = (p: any, tipo: string, titulo: string, detalle: string) => guardar(env, 'avisos', [{
    id: `avi_${tipo}_${p.id}`, fecha: marca, tipo: 'pedido', titulo, detalle, refId: p.id, clienteId: p.clienteId, leido: false, realmId: p.realmId
  }]);
  // Dexie Cloud reemplaza el objeto entero: se relee justo antes de escribir para no borrar un pago o una entrega que el
  // salón registró mientras tanto (ponytail: queda una ventana de milisegundos; sin escrituras parciales no se cierra del todo)
  const sigue = async (p: any) => {
    const actual = await uno<any>(env, 'pedidos', p.id);
    return actual?.estado === p.estado && !actual.entregadoEn ? actual : null;
  };
  let nVencidos = 0, nNoRecogidos = 0;
  for (const visto of vencidos) {
    const p = await sigue(visto);
    if (!p) continue;
    await guardar(env, 'pedidos', [{ ...p, estado: 'vencido', motivo: 'No se pagó a tiempo' }]);
    nVencidos++;
    // La cita solo se cancela si seguía esperando este pago: si el salón ya la confirmó o recibió su anticipo, se respeta
    const cita = p.citaId ? await uno<any>(env, 'citas', p.citaId) : null;
    const cancelada = !!cita && cita.estado === 'pendiente' && !cita.anticipoConfirmado;
    if (cancelada) await guardar(env, 'citas', [{ ...cita, estado: 'cancelada', canceladaPor: 'sistema', canceladaEn: marca }]);
    await avisar(p, 'vencido', `Venció sin pago: ${await quien(p)}`, `${pesos(p.total)}${p.items.length ? ` (${productos(p)})` : ''}. `
      + `${cancelada ? `Su cita del ${fechaLegible(cita.fecha)} a las ${cita.hora} se canceló y el horario quedó libre. ` : ''}${p.items.length ? 'Los productos volvieron a la venta.' : ''}`);
  }
  for (const visto of noRecogidos) {
    const p = await sigue(visto);
    if (!p) continue;
    nNoRecogidos++;
    // Política de pedidos: pasados 10 días, lo pagado queda como saldo a favor (abono con id fijo: nunca se duplica)
    await guardar(env, 'movimientosSaldo', [{ id: `sal_pedido_${p.id}`, clienteId: p.clienteId, fecha: marca, monto: p.totalProductos,
      concepto: `Productos pagados que no se recogieron en 10 días (${productos(p)})`, realmId: p.realmId }]);
    await guardar(env, 'pedidos', [{ ...p, estado: 'no_recogido', motivo: 'No lo recogió en 10 días' }]);
    await avisar(p, 'no_recogido', `No recogió su pedido: ${await quien(p)}`, `${productos(p)}: volvió a la venta y ${pesos(p.totalProductos)} quedaron como su saldo a favor.`);
  }
  return { vencidos: nVencidos, noRecogidos: nNoRecogidos };
}

const HORA = 3600 * 1000;
/** Cuándo llegó la cita de la app (campo `creada`; las primeras solo lo traen en el id cita_app_<ms>_…) */
const llegada = (c: any) => Date.parse(c.creada || '') || Number(String(c.id).split('_')[2]) || 0;

/** Recordatorio al salón de las citas de la app sin confirmar: después de 2 h y cada 4 h, solo de 9 a 21 h. Un mensaje
 *  con todas (WhatsApp y celular); cada cita guarda cuándo se recordó. */
export async function recordarAlSalon(env: Env, clientes: any[], hoy: string, ahora = Date.now()) {
  const hora = new Date(ahora - 7 * HORA).getUTCHours();
  if (hora < 9 || hora >= 21 || !(env.WA_AVISOS || pushListo(env))) return 0;
  // Las que ya tienen hora propuesta esperan a la clienta, no al salón
  const abiertas = (await Promise.all(['pendiente', 'solicitud'].map(estado => leer<any>(env, 'citas', { estado })))).flat();
  const toca = abiertas.filter(c => c.origen && ultimaPreferencia(c) >= hoy && !c.propuestaVence
    && ahora - llegada(c) > 2 * HORA && (!c.recordatorioSalon || ahora - Date.parse(c.recordatorioSalon) > 4 * HORA));
  if (!toca.length) return 0;
  const lista = toca.map(c => `${String(clientes.find(x => x.id === c.clienteId)?.nombre || 'Clienta').split(' ')[0]} ${c.hora ? `${fechaLegible(c.fecha)} ${c.hora}` : 'sin hora'}`).join('; ');
  const titulo = `${toca.length === 1 ? 'Hay 1 solicitud' : `Hay ${toca.length} solicitudes`} de la app por atender`;
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
 *  las 50 consultas por vuelta del plan gratis: si el espejo llega al límite, lo que falte se escribe en la vuelta
 *  siguiente, como ya hace con su tope de escrituras. */
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
