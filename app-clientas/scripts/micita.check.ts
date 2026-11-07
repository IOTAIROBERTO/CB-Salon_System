// Check: npx esbuild scripts/micita.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module
// «Mi cita»: enlace personal de la cita (ver, cambiar y cancelar sola con la política de 48 h y el saldo a favor),
// «no llegó» libera la agenda y el anticipo que se queda el salón cuenta como ingreso. Dexie Cloud simulado con fetch.
import assert from 'node:assert/strict';
import { atender } from '../api/salon';
import { firmar } from '../api/sesion';
import { vencerSolicitudes } from '../avisos/index';
import { ingresoCita } from '../../salon-control-app/src/utils/reportUtils';

const HORA = 3600 * 1000;
const dia = (n: number) => new Date(Date.now() - 7 * HORA + n * 86400000).toISOString().slice(0, 10);
const diaHabil = (desde: number) => {   // el primer lunes a viernes desde `desde` días (el horario inicial abre de lunes a sábado)
  for (let n = desde; ; n++) if (![0, 6].includes(new Date(`${dia(n)}T12:00:00Z`).getUTCDay())) return dia(n);
};
const lejos = diaHabil(5), otroLejos = diaHabil(Math.round((Date.parse(`${lejos}T12:00:00Z`) - Date.parse(`${dia(0)}T12:00:00Z`)) / 86400000) + 1);

const tablas: Record<string, any[]> = {
  configuracion: [{ id: 'settings', datosPago: 'BBVA 0123 4567' }],
  servicios: [{ id: 's1', nombre: 'Corte de cabello', categoria: 'corte', precioSugerido: 500, anticipoSugerido: 150, duracion: 60 },
    { id: 's2', nombre: 'Peinado', categoria: 'peinado', precioSugerido: 800, anticipoSugerido: 200, duracion: 60 }],
  clientes: [{ id: 'k1', nombre: 'Laura Pérez Soto', telefono: '6621234567' }],
  empleados: [], empleadoEvents: [], citas: [], avisos: [], fotos: [], movimientosSaldo: [], pedidos: [], inventario: []
};
for (const filas of Object.values(tablas)) for (const f of filas) f.realmId ??= 'r';
globalThis.fetch = (async (entrada: any, init: any = {}) => {
  const url = new URL(String(entrada));
  const resp = (d: unknown, status = 200) => new Response(d === null ? null : JSON.stringify(d), { status });
  if (url.pathname === '/token') return resp({ accessToken: 'd' });
  const [, , tabla, id] = url.pathname.split('/');
  // Como Dexie Cloud: guardar reemplaza el objeto entero (lo que va sin valor desaparece)
  if ((init.method || 'GET') === 'POST') { for (const o of JSON.parse(init.body)) tablas[tabla] = [...tablas[tabla].filter(f => f.id !== o.id), o]; return resp(null); }
  if (id) { const f = tablas[tabla].find(x => x.id === decodeURIComponent(id)); return f ? resp(f) : resp(null, 404); }
  return resp(tablas[tabla].filter(f => [...url.searchParams].every(([k, v]) => f[k] === v)));
}) as typeof fetch;

const env = { DEXIE_URL: 'http://dexie', DEXIE_CLIENT_ID: 'x', DEXIE_CLIENT_SECRET: 'y' } as any;
const ctx = { waitUntil() {}, passThroughOnException() {} } as any;
let ip = 0;
const pedir = (ruta: string, cuerpo?: object) => atender(new Request(`https://app/api/${ruta}`, cuerpo
  ? { method: 'POST', body: JSON.stringify(cuerpo), headers: { 'CF-Connecting-IP': `10.2.0.${++ip}` } } : undefined), env, ctx);
const cita = (id: string) => tablas.citas.find(c => c.id === id);

// 1. Al apartar desde la app, la respuesta trae su enlace y la cita guarda el secreto
const r = await (await pedir('citas', { nombre: 'Laura Pérez Soto', telefono: '6621234567', servicioId: 's1', fecha: lejos, hora: '10:00' })).json();
assert.match(r.cita.enlace, /^cita_app_[\w]+\.[a-f0-9]{32}$/);
const ref = r.cita.enlace, id = ref.split('.')[0];
assert.equal(cita(id).enlace, ref.split('.')[1]);

// 2. Ver: nada de su ficha (ni nombre: con un teléfono ajeno sin verificar se sabría de quién es); datos de pago solo
// si su anticipo por transferencia sigue pendiente
let v = await (await pedir(`cita/${ref}`)).json();
assert.ok(!/6621234567|Laura|Soto/.test(JSON.stringify(v)));
assert.deepEqual([v.estado, v.precio, v.precioAcordado, v.anticipo, v.anticipoPagado, v.datosPago, v.puedeCancelar, v.puedeReagendar],
  ['solicitud', 500, false, 150, false, '', true, true]);
Object.assign(cita(id), { precioAcordado: 650, formaAnticipo: 'transferencia' });
v = await (await pedir(`cita/${ref}`)).json();
assert.deepEqual([v.precio, v.precioAcordado, v.datosPago], [650, true, 'BBVA 0123 4567']);
// Enlace con otro secreto, mal formado o de otra cuenta: «no válido», sin decir si la cita existe
assert.equal((await pedir(`cita/${id}.${'0'.repeat(32)}`)).status, 404);
assert.equal((await pedir(`cita/${id}`)).status, 404);
tablas.citas.push({ ...cita(id), id: 'ajena', realmId: 'otra' });
assert.equal((await pedir(`cita/ajena.${ref.split('.')[1]}`)).status, 404);

// 3. Cambiar: hoy no. Sin hora todavía solo cambian sus opciones; con hora acordada, la conserva hasta que le asignen otra;
// con una hora solo propuesta, la suelta y vuelve a esperar
tablas.citas.push({ id: 'otra', clienteId: 'k9', servicioId: 's1', fecha: otroLejos, hora: '12:00', estado: 'confirmada', realmId: 'r' });
assert.equal((await pedir(`cita/${ref}/reagendar`, { preferencias: [{ fecha: dia(0), franja: 'tarde' }] })).status, 400);
assert.equal((await pedir(`cita/${ref}/reagendar`, { preferencias: [{ fecha: dia(30), franja: 'tarde' }] })).status, 400);   // más de 14 días
assert.equal((await pedir(`cita/${ref}/reagendar`, {})).status, 400);
v = await (await pedir(`cita/${ref}/reagendar`, { preferencias: [{ fecha: otroLejos, franja: 'tarde' }, { fecha: lejos, franja: 'cualquiera' }] })).json();
assert.deepEqual([v.fecha, v.hora, v.estado, v.preferencias.length], [otroLejos, '', 'solicitud', 2]);
assert.ok(tablas.avisos.some(a => /Pide cambiar su cita/.test(a.titulo) && a.refId === id));
await new Promise(r => setTimeout(r, 5100));
Object.assign(cita(id), { estado: 'confirmada', hora: '15:00', recordatorio: '2026-01-01T00:00:00Z' });
v = await (await pedir(`cita/${ref}/reagendar`, { preferencias: [{ fecha: lejos, franja: 'tarde' }] })).json();
assert.deepEqual([v.fecha, v.hora, v.estado, v.cambioPedido], [otroLejos, '15:00', 'confirmada', true]);
await new Promise(r => setTimeout(r, 5100));
Object.assign(cita(id), { estado: 'pendiente', cambioPedido: undefined, propuestaVence: new Date(Date.now() + 3600000).toISOString() });
v = await (await pedir(`cita/${ref}/reagendar`, { preferencias: [{ fecha: lejos, franja: 'tarde' }] })).json();
assert.deepEqual([v.fecha, v.hora, v.estado, cita(id).propuestaVence], [lejos, '', 'solicitud', undefined]);
Object.assign(cita(id), { fecha: otroLejos, hora: '15:30' });
// 4. «No llegó» y canceladas no ocupan: ese horario vuelve a estar libre
tablas.citas.find(c => c.id === 'otra').estado = 'no_llego';
const libres = await (await pedir(`disponibilidad?servicioId=s1&desde=${otroLejos}&dias=1`)).json();
assert.ok(libres.dias[0].horas.includes('12:00'));

// 5. Cancelar con 48 h o más y anticipo pagado: pasa a saldo a favor, una sola vez. Cancelar y cambiar al mismo tiempo:
// solo pasa una (la otra espera), así la cita no queda viva con el anticipo además en su saldo
Object.assign(cita(id), { anticipoConfirmado: true, montoAnticipo: 150, estado: 'confirmada' });
await new Promise(r => setTimeout(r, 5100));   // el candado de 5 s del último cambio de arriba
let [rc, rr] = await Promise.all([pedir(`cita/${ref}/cancelar`, {}), pedir(`cita/${ref}/reagendar`, { fecha: otroLejos, hora: '17:00' })]);
assert.deepEqual([rc.status, rr.status].sort(), [200, 429]);
assert.equal(tablas.movimientosSaldo.length, rc.status === 200 ? 1 : 0);   // nunca cita viva y además saldo a favor
if (rc.status === 429) { await new Promise(r => setTimeout(r, 5100)); rc = await pedir(`cita/${ref}/cancelar`, {}); }   // ganó el cambio
v = await rc.json();
assert.deepEqual([v.estado, v.anticipoASaldo, v.puedeCancelar, v.puedeReagendar], ['cancelada', 150, false, false]);
assert.equal((await pedir(`cita/${ref}/cancelar`, {})).status, 409);   // ya cancelada: se rechaza sin tocar el candado
assert.equal(cita(id).estado, 'cancelada');
assert.deepEqual(tablas.movimientosSaldo.map(m => [m.clienteId, m.monto, m.citaId]), [['k1', 150, id]]);
assert.ok(tablas.avisos.some(a => /Canceló su cita/.test(a.titulo) && /saldo a favor/.test(a.detalle)));
assert.equal(ingresoCita(cita(id)), 150);   // ingreso al recibirlo; al usar el saldo en otro cobro ya no vuelve a contar

// 6. Con menos de 48 h: no se puede cambiar; al cancelar, el anticipo se pierde (y cuenta como ingreso), sin saldo
const tarde = { id: 'tarde', clienteId: 'k1', servicioId: 's1', fecha: dia(1), hora: '23:00', estado: 'confirmada',
  anticipoConfirmado: true, montoAnticipo: 200, enlace: 'a'.repeat(32), realmId: 'r' };
tablas.citas.push(tarde);
v = await (await pedir(`cita/tarde.${'a'.repeat(32)}`)).json();
assert.deepEqual([v.sinCosto, v.puedeCancelar, v.puedeReagendar], [false, true, false]);
assert.equal((await pedir(`cita/tarde.${'a'.repeat(32)}/reagendar`, { fecha: otroLejos, hora: '17:00' })).status, 409);
v = await (await pedir(`cita/tarde.${'a'.repeat(32)}/cancelar`, {})).json();
assert.deepEqual([v.estado, v.anticipoPerdido, v.anticipoASaldo], ['cancelada', 200, undefined]);
assert.equal(tablas.movimientosSaldo.length, 1);
assert.equal(ingresoCita(cita('tarde')), 200);
assert.equal(ingresoCita({ ...cita('tarde'), estado: 'no_llego', anticipoPerdido: undefined }), 0);   // sin anticipo pagado, nada

// 7. No se aparta dos veces (el mismo servicio, u otro que se cruza con su horario) con su teléfono verificado: se le dice
// por qué. Sin verificar no se revisa: cualquier respuesta distinta revelaría citas de un número ajeno (quedan los topes).
const espera = () => new Promise(r => setTimeout(r, 5100));   // candado de 5 s por cita entre escrituras
const eva = { nombre: 'Eva Díaz', telefono: '6625551234', servicioId: 's1', fecha: lejos, hora: '16:00' };
const e1 = await (await pedir('citas', { ...eva, acepta: true })).json();
assert.ok(e1.cita.enlace && cita(e1.cita.id).politicasAceptadas);   // constancia de que aceptó resumen y políticas
const sesion = await firmar({ tipo: 'sesion', tel: '6625551234', vence: Date.now() + 3600000 }, 'secreto');
const verificada = (cuerpo: object) => atender(new Request('https://app/api/citas', { method: 'POST', body: JSON.stringify({ ...eva, ...cuerpo }),
  headers: { Authorization: `Bearer ${sesion}`, 'CF-Connecting-IP': `10.3.0.${++ip}` } }), { ...env, SESION_SECRETO: 'secreto' }, ctx);
const mismo = await verificada({ hora: '18:00' });
assert.equal(mismo.status, 409);
assert.match((await mismo.json()).error, /Ya tienes una solicitud de Corte de cabello/);
assert.equal(tablas.citas.filter(c => c.clienteId === cita(e1.cita.id).clienteId).length, 1);
// Sin verificar: misma respuesta que cualquier cita (aquí sí se aparta; la limitan los topes por teléfono)
const sinVerificar = await (await pedir('citas', { ...eva, hora: '17:30' })).json();
assert.ok(sinVerificar.cita.enlace);
tablas.citas = tablas.citas.filter(c => c.id !== sinVerificar.cita.id);
// Un servicio distinto en otro horario sí se aparta
assert.ok((await (await pedir('citas', { ...eva, servicioId: 's2', fecha: otroLejos, hora: '10:00' })).json()).cita.enlace);

// 8. Antes de que Cristina la valore puede cambiar de servicio (en vez de pedir otra cita); después, ya no
const refEva = e1.cita.enlace, idEva = e1.cita.id;
v = await (await pedir(`cita/${refEva}`)).json();
assert.deepEqual([v.puedeCambiarServicio, v.porAceptar], [true, false]);
assert.equal((await pedir(`cita/${refEva}/reagendar`, { fecha: otroLejos, hora: '10:00', servicioId: 's2' })).status, 409);   // ya tiene Peinado
tablas.citas = tablas.citas.filter(c => !(c.clienteId === cita(idEva).clienteId && c.servicioId === 's2'));
v = await (await pedir(`cita/${refEva}/reagendar`, { fecha: lejos, hora: '16:00', servicioId: 's2' })).json();
assert.deepEqual([v.servicioId, v.anticipo, cita(idEva).montoAnticipo], ['s2', 200, 200]);
assert.ok(tablas.avisos.some(a => /Ahora pide Peinado \(antes Corte de cabello\)/.test(a.detalle)));

// 9. Cristina valora: la clienta acepta el resumen (lo que se hará, precio final y anticipo). Con anticipo por
// transferencia pendiente sigue por confirmar; si no falta anticipo, queda confirmada al aceptar. Una sola vez.
Object.assign(cita(idEva), { estado: 'pendiente', hora: '16:00', propuestaVence: new Date(Date.now() + 3600000).toISOString(), precioAcordado: 950, montoAnticipo: 300, formaAnticipo: 'transferencia', resumenClienta: 'Peinado de graduación con ondas' });
v = await (await pedir(`cita/${refEva}`)).json();
assert.deepEqual([v.porAceptar, v.resumen, v.precio, v.anticipo, v.puedeCambiarServicio], [true, 'Peinado de graduación con ondas', 950, 300, false]);
assert.equal((await pedir(`cita/${refEva}/reagendar`, { fecha: lejos, hora: '16:00', servicioId: 's1' })).status, 409);   // ya valorada
await espera();
// Si Cristina lo cambió mientras la clienta lo veía, no se acepta: lo revisa de nuevo
const visto = { precio: 900, anticipo: 300, resumen: 'Peinado de graduación con ondas' };
assert.equal((await pedir(`cita/${refEva}/aceptar`, visto)).status, 409);
assert.equal(cita(idEva).aceptadaEn, undefined);
v = await (await pedir(`cita/${refEva}/aceptar`, { ...visto, precio: 950 })).json();
assert.deepEqual([v.estado, v.porAceptar, !!v.aceptadaEn], ['pendiente', false, true]);
assert.deepEqual(cita(idEva).aceptacion.precio + cita(idEva).aceptacion.anticipo, 1250);
assert.ok(tablas.avisos.some(a => /Aceptó su cita/.test(a.titulo) && /para pagar \$300/.test(a.detalle)));
assert.equal(tablas.pedidos.find(p => p.citaId === idEva)?.anticipo, 300);   // el anticipo por transferencia, con su plazo
assert.equal((await pedir(`cita/${refEva}/aceptar`, { ...visto, precio: 950 })).status, 409);   // ya aceptada
const enSalon = { id: 'salon1', clienteId: 'k1', servicioId: 's1', fecha: lejos, hora: '18:00', estado: 'pendiente', precioAcordado: 500,
  montoAnticipo: 150, formaAnticipo: 'salon', enlace: 'b'.repeat(32), realmId: 'r' };
tablas.citas.push(enSalon);
v = await (await pedir(`cita/salon1.${'b'.repeat(32)}/aceptar`, { precio: 500, anticipo: 150, resumen: '' })).json();
assert.equal(v.estado, 'confirmada');

// 10. Hora propuesta sin aceptar: se suelta y vuelve a esperar hora. Sin fechas por delante, se cancela sola y suelta el carrito
const opciones = [{ fecha: lejos, franja: 'tarde' }];
tablas.citas.push({ id: 'prop', clienteId: 'k1', servicioId: 's1', fecha: lejos, hora: '17:00', estado: 'pendiente', origen: 'app', preferencias: opciones, atiendeId: 'cristina', precioAcordado: 500, propuestaVence: new Date(Date.now() - 1000).toISOString(), realmId: 'r' },
  { id: 'prop2', clienteId: 'k1', servicioId: 's1', fecha: lejos, hora: '18:00', estado: 'pendiente', origen: 'app', preferencias: opciones, aceptadaEn: 'ya', propuestaVence: new Date(Date.now() - 1000).toISOString(), realmId: 'r' },
  { id: 'sinFechas', clienteId: 'k1', servicioId: 's1', fecha: dia(0), hora: '', estado: 'solicitud', origen: 'app', preferencias: [{ fecha: dia(0), franja: 'tarde' }], realmId: 'r' });
tablas.pedidos.push({ id: 'pSin', clienteId: 'k1', citaId: 'sinFechas', items: [], totalProductos: 0, anticipo: 0, total: 0, estado: 'por_pagar', realmId: 'r' });
assert.deepEqual(await vencerSolicitudes(env, dia(0)), { liberadas: 1, canceladas: 1 });
assert.deepEqual([cita('prop').estado, cita('prop').hora, cita('prop').propuestaVence, cita('prop').propuestaVencida], ['solicitud', '', undefined, true]);
assert.equal(cita('prop2').estado, 'pendiente');   // ya aceptó: no se toca
assert.deepEqual([cita('sinFechas').estado, cita('sinFechas').canceladaPor], ['cancelada', 'sistema']);
assert.equal(tablas.pedidos.find(p => p.id === 'pSin').estado, 'cancelado');
assert.deepEqual(await vencerSolicitudes(env, dia(0)), { liberadas: 0, canceladas: 0 });
// Sin hora nada corre: se puede cancelar sin perder nada y no cuenta como «por aceptar»
tablas.citas.push({ id: 'sola', clienteId: 'k1', servicioId: 's1', fecha: lejos, hora: '', estado: 'solicitud', precioAcordado: 500, enlace: 'c'.repeat(32), realmId: 'r' });
v = await (await pedir(`cita/sola.${'c'.repeat(32)}`)).json();
assert.deepEqual([v.sinCosto, v.puedeCancelar, v.puedeReagendar, v.porAceptar], [true, true, true, false]);
v = await (await pedir(`cita/sola.${'c'.repeat(32)}/cancelar`, {})).json();
assert.equal(v.estado, 'cancelada');

console.log('micita ok');
