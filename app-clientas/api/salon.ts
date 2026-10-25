// API de la app de clientas (Cloudflare Pages Functions, misma dirección que la app: /api/...).
// Lee y escribe la base de CB Control con Dexie Cloud; reutiliza el motor de agenda de CB Control,
// así la app ofrece exactamente los mismos horarios libres que ve el salón.
import { AGENDA_INICIAL, DUENA, horariosLibres, type Bloqueo, type ConfigAgenda, type Persona } from '../../salon-control-app/src/utils/agenda';
import {
  NOMBRE_NIVEL, beneficiosDisponibles, costoPuntos, datosBeneficio, estadoCirculo, parametrosDe, permanentesDe, siguienteNivel, textoSaldoPuntos
} from '../../salon-control-app/src/utils/lealtad';
import { saldoDe } from '../../salon-control-app/src/utils/saldo';
import { guardar, leer, uno, type EnvDexie } from './dexie';
import { avisarSalon, plantilla, whatsappListo, type EnvWhatsApp } from './whatsapp';
import { DIAS_SESION, MIN_RETO, codigoNuevo, firmar, huellaCodigo, leerFirmado, type Reto, type Sesion } from './sesion';

export type Env = EnvDexie & EnvWhatsApp & { SESION_SECRETO?: string };

// Hermosillo no cambia de horario: UTC−7 todo el año. El motor compara fechas «locales»; en el servidor (UTC)
// se le pasa la hora de Hermosillo como si fuera UTC.
export const ahoraHermosillo = () => new Date(Date.now() - 7 * 3600 * 1000);
export const hoyHermosillo = () => ahoraHermosillo().toISOString().slice(0, 10);
export const masDias = (f: string, n: number) => { const d = new Date(`${f}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const tel10 = (t = '') => String(t).replace(/\D/g, '').slice(-10);
const id = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
export const fechaLegible = (f: string) => new Date(`${f}T12:00:00Z`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const FECHA = /^\d{4}-\d{2}-\d{2}$/, HORA = /^\d{2}:\d{2}$/;

class ErrorCliente extends Error { constructor(msg: string, public status = 400) { super(msg); } }

const json = (datos: unknown, status = 200) => new Response(JSON.stringify(datos), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

// ponytail: límite por instancia en memoria (8 envíos cada 10 min por IP); pasar a Rate Limiting de Cloudflare si hay abuso
const envios = new Map<string, number[]>();
// ponytail: tope diario de avisos «por confirmar a mano» en memoria de la instancia; pasar a Durable Object o KV si hay abuso
const avisosDeMas = { dia: '', cuantos: 0 };
const TOPE_AVISOS_DE_MAS = 20;
function limitar(ip: string) {
  const ahora = Date.now(), lista = (envios.get(ip) || []).filter(t => ahora - t < 10 * 60 * 1000);
  if (lista.length >= 8) throw new ErrorCliente('Demasiados intentos. Espera unos minutos o escríbenos por WhatsApp.', 429);
  lista.push(ahora); envios.set(ip, lista);
}

/** Lo que el motor de agenda necesita, igual que useAgenda en CB Control */
async function cargarAgenda(env: Env) {
  const [settings, servicios, empleados, eventos] = await Promise.all([
    uno<any>(env, 'configuracion', 'settings'), leer<any>(env, 'servicios'), leer<any>(env, 'empleados'), leer<any>(env, 'empleadoEvents')
  ]);
  const guardada: ConfigAgenda = { ...AGENDA_INICIAL, ...(settings?.agenda || {}) };
  const deEmpleados: Bloqueo[] = eventos.filter(e => e.tipo === 'vacaciones' || e.tipo === 'dia_inhabit')
    .map(e => ({ id: `ev_${e.id}`, personaId: e.empleadoId, desde: e.fechaInicio, hasta: e.fechaFin }));
  const personas: Persona[] = [{ id: DUENA, nombre: 'Cristina' },
    ...empleados.filter(e => e.activo && e.tomaCitas).map(e => ({ id: e.id, nombre: e.nombre, categorias: e.categoriasAgenda }))];
  return {
    realmId: settings?.realmId as string, config: { ...guardada, bloqueos: [...(guardada.bloqueos || []), ...deEmpleados] },
    personas, servicios: servicios.filter(s => !s.archivado)
  };
}

const libresDelDia = async (env: Env, ag: Awaited<ReturnType<typeof cargarAgenda>>, fecha: string, servicioId: string) =>
  horariosLibres({ fecha, servicioId, personas: ag.personas, citas: await leer(env, 'citas', { fecha }), servicios: ag.servicios,
    config: ag.config, ahora: ahoraHermosillo() });

/** Servicios que se agendan en línea: el catálogo vivo de CB Control (sin archivados, sin precio ni los de fuera de la ciudad) */
const enLinea = (s: any) => !s.archivado && Number(s.precioSugerido) > 0 && !/for[aá]neo|destino/i.test(s.nombre || '');

/** GET /api/servicios → catálogo vivo con precios «desde» (lo mismo que ve el salón en CB Control) */
async function servicios(env: Env) {
  const lista = (await leer<any>(env, 'servicios')).filter(enLinea)
    .map(s => ({ id: s.id, nombre: s.nombre, categoria: s.categoria, precio: s.precioSugerido, anticipo: s.anticipoSugerido || 0, duracion: s.duracion || 60 }));
  return new Response(JSON.stringify({ servicios: lista }), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}

/** GET /api/disponibilidad?servicioId=s17&desde=2027-01-04&dias=7 → horas libres por día (sin nombres de nadie) */
async function disponibilidad(env: Env, url: URL) {
  const servicioId = url.searchParams.get('servicioId') || '';
  const desde = url.searchParams.get('desde') || hoyHermosillo();
  const dias = Math.min(Math.max(Number(url.searchParams.get('dias')) || 7, 1), 14);
  if (!FECHA.test(desde)) throw new ErrorCliente('Fecha inválida');
  const ag = await cargarAgenda(env);
  const s = ag.servicios.find(x => x.id === servicioId && enLinea(x));
  if (!s) throw new ErrorCliente('Ese servicio no se agenda en línea');
  const fechas = Array.from({ length: dias }, (_, i) => masDias(desde, i));
  const res = await Promise.all(fechas.map(async fecha => ({
    fecha, horas: [...new Set((await libresDelDia(env, ag, fecha, servicioId)).map(h => h.hora))]
  })));
  return json({ servicio: { id: s.id, nombre: s.nombre, duracion: s.duracion, precio: s.precioSugerido, anticipo: s.anticipoSugerido || 0 }, dias: res });
}

interface DatosClienta { nombre?: string; telefono?: string; cumple?: string; recomendo?: string; sitio?: string }

function validarClienta(b: DatosClienta) {
  if (b.sitio) throw new ErrorCliente('No se pudo enviar');   // campo trampa para robots
  const nombre = String(b.nombre || '').trim().replace(/\s+/g, ' ');
  if (nombre.length < 3 || nombre.length > 80) throw new ErrorCliente('Escribe tu nombre completo');
  const telefono = tel10(b.telefono);
  if (telefono.length !== 10) throw new ErrorCliente('Escribe tu teléfono de 10 dígitos');
  const cumple = b.cumple && FECHA.test(b.cumple) ? b.cumple : undefined;
  return { nombre, telefono, cumple, recomendo: tel10(b.recomendo) };
}

/** Busca a la clienta por teléfono; si no existe la crea.
 *  Sin verificar el teléfono (eso llega con el código por WhatsApp), una ficha que ya existe NO se modifica:
 *  lo que pidió (Club, cumpleaños, recomendación) se anota en el aviso y el salón lo aplica en CB Control. */
async function clientaPorTelefono(env: Env, realmId: string, d: ReturnType<typeof validarClienta>, club: boolean, verificada = false) {
  const clientes = await leer<any>(env, 'clientes');
  const existente = clientes.find(c => tel10(c.telefono) === d.telefono);
  const recomendadora = d.recomendo.length === 10 ? clientes.find(c => tel10(c.telefono) === d.recomendo && c.id !== existente?.id) : undefined;
  if (existente && verificada) {   // entró con su código: su ficha sí se actualiza (sin borrar nada de lo capturado)
    const cambios: any = {};
    if (club && !existente.clubDesde) cambios.clubDesde = new Date().toISOString();
    if (d.cumple && !existente.cumple) cambios.cumple = d.cumple;
    if (recomendadora && !existente.referidaPor) cambios.referidaPor = recomendadora.id;
    if (Object.keys(cambios).length) await guardar(env, 'clientes', [{ ...existente, ...cambios }]);
    return { cliente: { ...existente, ...cambios }, nueva: false, pendiente: '' };
  }
  if (existente) {
    const pide = [
      existente.nombre !== d.nombre ? `escribió el nombre «${d.nombre}»` : '',
      club && !existente.clubDesde ? 'pide unirse al Club' : '',
      d.cumple && existente.cumple !== d.cumple ? `cumpleaños ${d.cumple}` : '',
      recomendadora && !existente.referidaPor ? `dice que la recomendó ${recomendadora.nombre}` : ''
    ].filter(Boolean);
    return { cliente: existente, nueva: false, pendiente: pide.length ? `Ya estaba registrada; ${pide.join(', ')} (revisar y aplicar en su ficha)` : '' };
  }
  const cliente = {
    id: id('cli'), nombre: d.nombre, telefono: d.telefono, cumple: d.cumple, activo: true, fechaRegistro: new Date().toISOString(),
    origen: 'app', clubDesde: club ? new Date().toISOString() : undefined, referidaPor: recomendadora?.id, realmId
  };
  await guardar(env, 'clientes', [cliente]);
  return { cliente, nueva: true, pendiente: '' };
}

async function aviso(env: Env, ctx: ExecutionContext, realmId: string, a: { tipo: string; titulo: string; detalle: string; refId?: string; clienteId?: string },
  op: { id?: string; whatsapp?: boolean } = {}) {
  // El aviso no debe impedir la cita o el registro: si falla, queda en el registro de Cloudflare y lo que importa ya se guardó
  try { await guardar(env, 'avisos', [{ id: op.id || id('avi'), fecha: new Date().toISOString(), leido: false, realmId, ...a }]); }
  catch (e) { console.log('aviso', (e as Error).message); }
  if (op.whatsapp !== false) ctx.waitUntil(avisarSalon(env, `${a.titulo}. ${a.detalle}`));
}

/** POST /api/citas → la cita queda «pendiente» (ya aparta el horario) hasta que el salón la confirma */
async function crearCita(env: Env, ctx: ExecutionContext, body: any, sesion: Sesion | null) {
  const d = validarClienta(sesion ? { ...body, telefono: sesion.tel } : body);
  const { servicioId, fecha, hora } = body;
  if (!FECHA.test(fecha) || !HORA.test(hora)) throw new ErrorCliente('Elige fecha y hora');
  const notas = String(body.notas || '').trim().slice(0, 500);
  const ag = await cargarAgenda(env);
  if (!ag.realmId) throw new Error('Sin realm del salón en configuración');
  const s = ag.servicios.find(x => x.id === servicioId && enLinea(x));
  if (!s) throw new ErrorCliente('Ese servicio no se agenda en línea');
  const libre = (await libresDelDia(env, ag, fecha, servicioId)).find(h => h.hora === hora);
  if (!libre) throw new ErrorCliente('Ese horario se acaba de ocupar. Elige otro, por favor.', 409);
  // Mientras no se verifique el teléfono (código por WhatsApp, fase 2), dos topes para que nadie aparte la agenda con
  // datos inventados: 2 citas por confirmar por teléfono y 6 por día desde la app. Al pasarlos no se rechaza (así nadie
  // bloquea un día ni se revela nada de un número): la solicitud llega como aviso sin apartar horario, uno por teléfono
  // y día (se sobrescribe), sin WhatsApp ni notas de texto libre.
  const abiertas = (await leer<any>(env, 'citas', { estado: 'pendiente' })).filter(c => c.origen === 'app');
  const clientas = await leer<any>(env, 'clientes');
  const deEseTelefono = abiertas.filter(c => tel10(clientas.find(x => x.id === c.clienteId)?.telefono) === d.telefono).length;
  const deEseDia = abiertas.filter(c => c.fecha === fecha).length;
  const respuesta = (citaId: string) =>   // misma respuesta en todos los casos: no revela nada del número ni de los topes
    json({ ok: true, cita: { id: citaId, fecha, hora, servicio: s.nombre, anticipo: s.anticipoSugerido || 0 } }, 201);
  if (!sesion && (deEseTelefono >= 2 || deEseDia >= 6)) {   // con teléfono verificado no aplican los topes
    // Cada solicitud de más es su propio aviso (id al azar: nada se reemplaza), sin WhatsApp ni notas libres;
    // pasado el tope diario se descarta en silencio (la respuesta no cambia)
    if (avisosDeMas.dia !== hoyHermosillo()) { avisosDeMas.dia = hoyHermosillo(); avisosDeMas.cuantos = 0; }
    if (++avisosDeMas.cuantos > TOPE_AVISOS_DE_MAS) return respuesta('');
    await aviso(env, ctx, ag.realmId, {
      tipo: 'cita', titulo: `Solicitud por confirmar a mano: ${d.nombre}`,
      detalle: `Tel. ${d.telefono} pidió ${s.nombre} · ${fechaLegible(fecha)} a las ${hora}. ${deEseTelefono >= 2 ? 'Ese teléfono ya tiene citas por confirmar' : 'Ese día ya tiene 6 solicitudes por confirmar'}: no se apartó el horario.`
    }, { whatsapp: false });
    return respuesta('');
  }
  const { cliente, pendiente } = await clientaPorTelefono(env, ag.realmId, d, !!body.club, !!sesion);
  const cita = {
    id: id('cita_app'), clienteId: cliente.id, servicioId, fecha, hora, estado: 'pendiente', notas: notas || undefined,
    montoAnticipo: s.anticipoSugerido || 0, anticipoConfirmado: false, atiendeId: libre.personaId, origen: 'app', realmId: ag.realmId
  };
  await guardar(env, 'citas', [cita]);
  // A la clienta: «recibimos tu solicitud» (cuando el WhatsApp del salón esté conectado)
  ctx.waitUntil(plantilla(env, d.telefono, 'cita_recibida', [d.nombre.split(' ')[0], s.nombre, fechaLegible(fecha), hora]));
  await aviso(env, ctx, ag.realmId, {
    tipo: 'cita', titulo: `Nueva cita desde la app: ${cliente.nombre}`,
    detalle: `${s.nombre} · ${fechaLegible(fecha)} a las ${hora}${notas ? ` · «${notas}»` : ''}${pendiente ? ` · ${pendiente}` : body.club ? ' · se unió al Club' : ''}`,
    refId: cita.id, clienteId: cliente.id
  });
  return respuesta(cita.id);
}

/** POST /api/club → alta al Club sin pasar por WhatsApp */
async function unirseClub(env: Env, ctx: ExecutionContext, body: any, sesion: Sesion | null) {
  const d = validarClienta(sesion ? { ...body, telefono: sesion.tel } : body);
  const settings = await uno<any>(env, 'configuracion', 'settings');
  if (!settings?.realmId) throw new Error('Sin realm del salón en configuración');
  const { cliente, nueva, pendiente } = await clientaPorTelefono(env, settings.realmId, d, true, !!sesion);
  await aviso(env, ctx, settings.realmId, {
    tipo: 'club', titulo: `${nueva ? 'Nueva clienta en el Club' : 'Pide unirse al Club'}: ${cliente.nombre}`,
    detalle: nueva
      ? `Tel. ${d.telefono}${d.cumple ? ` · cumpleaños ${fechaLegible(d.cumple).split(', ')[1]}` : ''}${cliente.referidaPor ? ' · llegó recomendada' : ''}`
      : `Tel. ${d.telefono} · ${pendiente || 'ya estaba registrada y en el Club'}`,
    clienteId: cliente.id, refId: cliente.id
  });
  return json({ ok: true }, 201);   // misma respuesta para teléfonos nuevos y registrados: no revela quién es clienta
}

/** POST /api/acceso/codigo → manda un código de 6 dígitos por WhatsApp y devuelve el «reto» firmado (misma respuesta
 *  sea o no clienta, para no revelar quién lo es) */
async function pedirCodigo(env: Env, body: any) {
  const tel = tel10(body?.telefono);
  if (tel.length !== 10) throw new ErrorCliente('Escribe tu teléfono de 10 dígitos');
  if (!whatsappListo(env) || !env.SESION_SECRETO) throw new ErrorCliente('La entrada con código se activa en cuanto el WhatsApp del salón quede conectado. Muy pronto.', 503);
  const codigo = codigoNuevo();
  const reto = await firmar({ tipo: 'reto', tel, huella: await huellaCodigo(codigo, tel, env.SESION_SECRETO), vence: Date.now() + MIN_RETO * 60000 } satisfies Reto, env.SESION_SECRETO);
  if (!await plantilla(env, tel, 'codigo_acceso', [codigo], codigo)) throw new ErrorCliente('No pudimos mandarte el código. Revisa tu número o escríbenos por WhatsApp.', 502);
  return json({ reto });
}

/** POST /api/acceso/verificar → con el código correcto devuelve la sesión firmada (90 días en ese celular) */
async function verificarCodigo(env: Env, body: any) {
  if (!env.SESION_SECRETO) throw new ErrorCliente('La entrada con código aún no está activa.', 503);
  const reto = await leerFirmado<Reto>(body?.reto, env.SESION_SECRETO);
  if (!reto || reto.tipo !== 'reto') throw new ErrorCliente('El código venció. Pide uno nuevo.', 401);
  limitar(`verificar:${reto.tel}`);   // 8 intentos cada 10 min por teléfono
  const codigo = String(body?.codigo || '').replace(/\D/g, '');
  if (codigo.length !== 6 || await huellaCodigo(codigo, reto.tel, env.SESION_SECRETO) !== reto.huella) throw new ErrorCliente('Código incorrecto', 401);
  const sesion = await firmar({ tipo: 'sesion', tel: reto.tel, vence: Date.now() + DIAS_SESION * 86400000 } satisfies Sesion, env.SESION_SECRETO);
  return json({ sesion, telefono: reto.tel });
}

async function sesionDe(request: Request, env: Env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token || !env.SESION_SECRETO) return null;
  const s = await leerFirmado<Sesion>(token, env.SESION_SECRETO);
  return s?.tipo === 'sesion' ? s : null;
}

/** GET /api/mi-club → su tarjeta con puntos, nivel, saldo, beneficios y próximas citas (mismas reglas que CB Control) */
async function miClub(env: Env, sesion: Sesion | null) {
  if (!sesion) throw new ErrorCliente('Entra con tu teléfono para ver tu Club', 401);
  const [settings, clientes, servicios] = await Promise.all([uno<any>(env, 'configuracion', 'settings'), leer<any>(env, 'clientes'), leer<any>(env, 'servicios')]);
  const cliente = clientes.find(c => tel10(c.telefono) === sesion.tel);
  if (!cliente) return json({ registrada: false });
  const [citas, ventas, saldo] = await Promise.all([
    leer<any>(env, 'citas', { clienteId: cliente.id }), leer<any>(env, 'ventas', { clienteId: cliente.id }), leer<any>(env, 'movimientosSaldo', { clienteId: cliente.id })
  ]);
  const p = parametrosDe(settings), hoy = ahoraHermosillo();
  // Las recomendaciones se cuentan con las citas de sus amigas
  const amigas = clientes.filter(c => c.referidaPor === cliente.id);
  const citasAmigas = amigas.length ? (await Promise.all(amigas.map(a => leer<any>(env, 'citas', { clienteId: a.id })))).flat() : [];
  const todas = [...citas, ...citasAmigas];
  const e = estadoCirculo(cliente, todas, ventas, clientes, servicios, p, hoy, saldo);
  const sig = siguienteNivel(e.puntosNivel, p);
  const nombreServicio = (sid: string) => servicios.find(s => s.id === sid)?.nombre || 'Servicio';
  return json({
    registrada: true, nombre: String(cliente.nombre).split(' ')[0], enClub: !!cliente.clubDesde || e.activa,
    nivel: e.nivel, nombreNivel: NOMBRE_NIVEL[e.nivel], puntos: e.puntos, puntosNivel: e.puntosNivel,
    siguiente: sig && { nivel: NOMBRE_NIVEL[sig.nivel], falta: sig.falta },
    saldoTexto: textoSaldoPuntos(e.puntos, p), saldoFavor: saldoDe(saldo, cliente.id),
    permanentes: permanentesDe(e.nivel, p),
    disponibles: [...new Set(beneficiosDisponibles(cliente, e.nivel, clientes, todas, servicios, hoy, p, e.puntos))]
      .map(k => ({ clave: k, titulo: datosBeneficio(k, e.nivel).titulo, puntos: costoPuntos(k) })),
    movimientos: e.movimientos.slice(-8).reverse(),
    proximas: citas.filter(c => c.fecha >= hoyHermosillo() && !['cancelada', 'completada'].includes(c.estado))
      .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))
      .map(c => ({ fecha: c.fecha, hora: c.hora, servicio: nombreServicio(c.servicioId), estado: c.estado }))
  });
}

export async function atender(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const ruta = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  try {
    if (request.method === 'GET' && ruta === 'salud') return json({ ok: true, hoy: hoyHermosillo() });
    if (request.method === 'GET' && ruta === 'servicios') return await servicios(env);
    if (request.method === 'GET' && ruta === 'disponibilidad') return await disponibilidad(env, url);
    if (request.method === 'GET' && ruta === 'mi-club') return await miClub(env, await sesionDe(request, env));
    if (request.method === 'POST' && ['citas', 'club', 'acceso/codigo', 'acceso/verificar'].includes(ruta)) {
      limitar(request.headers.get('CF-Connecting-IP') || 'local');
      const body: any = await request.json().catch(() => { throw new ErrorCliente('Datos inválidos'); });
      if (ruta === 'acceso/verificar') return await verificarCodigo(env, body);
      limitar(`tel:${tel10(body?.telefono)}`);   // también por teléfono destino (mismos 8 cada 10 min)
      if (ruta === 'acceso/codigo') return await pedirCodigo(env, body);
      const sesion = await sesionDe(request, env);
      return ruta === 'citas' ? await crearCita(env, ctx, body, sesion) : await unirseClub(env, ctx, body, sesion);
    }
    return json({ error: 'No encontrado' }, 404);
  } catch (e) {
    if (e instanceof ErrorCliente) return json({ error: e.message }, e.status);
    console.log('API', ruta, (e as Error).message);
    return json({ error: 'No pudimos completar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.' }, 503);
  }
}
