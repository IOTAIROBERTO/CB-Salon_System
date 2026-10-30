// Check: npx esbuild scripts/pedidos.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module
// «Mi carrito»: productos de la app con lo disponible, pedido con plazo de pago (48 h y nunca después de 48 h antes de la
// cita), vencimiento automático que libera horario y productos, y lo pagado no recogido en 10 días a saldo a favor.
// Dexie Cloud simulado con fetch.
import assert from 'node:assert/strict';
import { atender } from '../api/salon';
import { vencerPedidos } from '../avisos/index';

const HORA = 3600 * 1000;
const dia = (n: number) => new Date(Date.now() - 7 * HORA + n * 86400000).toISOString().slice(0, 10);
const diaHabil = (desde: number) => { for (let n = desde; ; n++) if (![0, 6].includes(new Date(`${dia(n)}T12:00:00Z`).getUTCDay())) return dia(n); };
const lejos = diaHabil(6);

const tablas: Record<string, any[]> = {
  configuracion: [{ id: 'settings', datosPago: 'BBVA 0123 4567' }],
  servicios: [{ id: 's1', nombre: 'Corte de cabello', categoria: 'corte', precioSugerido: 500, anticipoSugerido: 150, duracion: 60 }],
  inventario: [
    { id: 'p1', nombre: 'Shampoo matizador', precio: 450, costo: 200, cantidad: 3, enApp: true, descripcionApp: 'Para rubios', foto: 'data:image/jpeg;base64,AAAA' },
    { id: 'p2', nombre: 'Mascarilla', precio: 380, cantidad: 1, enApp: true },
    { id: 'p3', nombre: 'Tinte profesional', precio: 200, cantidad: 10 }   // no se vende en la app
  ],
  clientes: [], empleados: [], empleadoEvents: [], citas: [], avisos: [], fotos: [], movimientosSaldo: [], pedidos: []
};
for (const filas of Object.values(tablas)) for (const f of filas) f.realmId ??= 'r';
let trasLeerPedidos: (() => void) | null = null;   // simula al salón escribiendo justo después de que el Worker leyó
globalThis.fetch = (async (entrada: any, init: any = {}) => {
  const url = new URL(String(entrada));
  const resp = (d: unknown, status = 200) => new Response(d === null ? null : JSON.stringify(d), { status });
  if (url.pathname === '/token') return resp({ accessToken: 'd' });
  const [, , tabla, id] = url.pathname.split('/');
  if ((init.method || 'GET') === 'POST') { for (const o of JSON.parse(init.body)) tablas[tabla] = [...tablas[tabla].filter(f => f.id !== o.id), o]; return resp(null); }
  if (id) { const f = tablas[tabla].find(x => x.id === decodeURIComponent(id)); return f ? resp(f) : resp(null, 404); }
  const lista = resp(tablas[tabla].filter(f => [...url.searchParams].every(([k, v]) => f[k] === v)));
  if (tabla === 'pedidos' && trasLeerPedidos) { trasLeerPedidos(); trasLeerPedidos = null; }
  return lista;
}) as typeof fetch;

const env = { DEXIE_URL: 'http://dexie', DEXIE_CLIENT_ID: 'x', DEXIE_CLIENT_SECRET: 'y' } as any;
const ctx = { waitUntil() {}, passThroughOnException() {} } as any;
let ip = 0;
const pedir = (ruta: string, cuerpo?: object, e = env) => atender(new Request(`https://app/api/${ruta}`, cuerpo
  ? { method: 'POST', body: JSON.stringify(cuerpo), headers: { 'CF-Connecting-IP': `10.4.0.${++ip}` } } : undefined), e, ctx);
const espera = (ms = 3100) => new Promise(r => setTimeout(r, ms));   // candado de inventario (3 s) entre apartados
const disponibles = async () => Object.fromEntries((await (await pedir('productos')).json()).productos.map((p: any) => [p.id, p.disponible]));

// 1. Catálogo de la app: solo lo marcado «en la app», sin costo ni existencia real
let r = await (await pedir('productos')).json();
assert.deepEqual(r.productos.map((p: any) => [p.id, p.precio, p.disponible]), [['p1', 450, 3], ['p2', 380, 1]]);
assert.ok(!JSON.stringify(r).includes('costo') && !JSON.stringify(r).includes('Tinte'));

// 2. Solo productos: precios del Inventario (no los que mande la app), 48 h para pagar, aparta lo pedido
const laura = { nombre: 'Laura Pérez', telefono: '6621234567' };
r = await (await pedir('pedidos', { ...laura, productos: [{ productoId: 'p1', cantidad: 2, precio: 1 }] })).json();
const ref1 = r.pedido.enlace, id1 = ref1.split('.')[0];
assert.match(ref1, /^ped_\w+\.[a-f0-9]{32}$/);
const p1 = tablas.pedidos.find(p => p.id === id1);
assert.deepEqual([p1.items[0].precio, p1.totalProductos, p1.total, p1.estado, p1.citaId], [450, 900, 900, 'por_pagar', undefined]);
assert.ok(Math.abs(Date.parse(p1.venceEn) - (Date.now() + 48 * HORA)) < 60000);
assert.deepEqual(await disponibles(), { p1: 1, p2: 1 });
assert.ok(tablas.avisos.some(a => /Pedido desde la app: Laura/.test(a.titulo) && /2 × Shampoo/.test(a.detalle)));
// Su enlace: lo que pidió, total, plazo y datos de pago; nada de su ficha
let v = await (await pedir(`pedido/${ref1}`)).json();
assert.deepEqual([v.total, v.estado, v.datosPago, v.puedeCancelar], [900, 'por_pagar', 'BBVA 0123 4567', true]);
assert.ok(!/Laura|6621234567/.test(JSON.stringify(v)));
assert.equal((await pedir(`pedido/${id1}.${'0'.repeat(32)}`)).status, 404);

// 3. Más piezas de las disponibles: no; lo que no está en la app: no
await espera();
assert.equal((await pedir('pedidos', { nombre: 'Ana Ruiz', telefono: '6620000001', productos: [{ productoId: 'p1', cantidad: 2 }] })).status, 409);
await espera();
assert.equal((await pedir('pedidos', { nombre: 'Ana Ruiz', telefono: '6620000001', productos: [{ productoId: 'p3', cantidad: 1 }] })).status, 409);

// 4. La última pieza, dos clientas al mismo tiempo: solo una la aparta (la otra intenta de nuevo y ya no hay)
await espera();
const [a, b] = await Promise.all([
  pedir('pedidos', { nombre: 'Eva Díaz', telefono: '6620000002', productos: [{ productoId: 'p2', cantidad: 1 }] }),
  pedir('pedidos', { nombre: 'Sara Gil', telefono: '6620000003', productos: [{ productoId: 'p2', cantidad: 1 }] })
]);
assert.deepEqual([a.status, b.status].sort(), [201, 429]);
await espera();
assert.equal((await pedir('pedidos', { nombre: 'Sara Gil', telefono: '6620000003', productos: [{ productoId: 'p2', cantidad: 1 }] })).status, 409);
assert.equal(tablas.pedidos.filter(p => p.items.some((i: any) => i.productoId === 'p2')).length, 1);

// 5. Sin teléfono verificado, como mucho 2 pedidos por pagar por teléfono
await espera();
assert.equal((await pedir('pedidos', { ...laura, productos: [{ productoId: 'p1', cantidad: 1 }] })).status, 201);
await espera();
assert.equal((await pedir('pedidos', { ...laura, productos: [{ productoId: 'p1', cantidad: 1 }] })).status, 409);
// Cancelar desde su enlace libera lo apartado
await (await pedir(`pedido/${ref1}/cancelar`, {})).json();
assert.equal(tablas.pedidos.find(p => p.id === id1).estado, 'cancelado');
assert.deepEqual(await disponibles(), { p1: 2, p2: 0 });

// 6. Cita con carrito: los productos quedan apartados con la cita; el plazo corre al aceptar la valoración y suma el anticipo
await espera();
const c = await (await pedir('citas', { nombre: 'Mia Soto', telefono: '6620000009', servicioId: 's1', fecha: lejos, hora: '11:00', acepta: true,
  productos: [{ productoId: 'p1', cantidad: 1 }] })).json();
const refCita = c.cita.enlace, idCita = refCita.split('.')[0];
const pc = tablas.pedidos.find(p => p.citaId === idCita);
assert.deepEqual([pc.totalProductos, pc.anticipo, pc.venceEn], [450, 0, undefined]);   // sin plazo hasta la valoración
assert.ok(tablas.avisos.some(a => a.refId === idCita && /aparta 1 × Shampoo matizador/.test(a.detalle)));
Object.assign(tablas.citas.find(x => x.id === idCita), { precioAcordado: 600, montoAnticipo: 200, formaAnticipo: 'transferencia', resumenClienta: 'Corte en capas' });
v = await (await pedir(`cita/${refCita}/aceptar`, { precio: 600, anticipo: 200, resumen: 'Corte en capas' })).json();
assert.deepEqual([v.estado, v.pedido.total, v.pedido.anticipo, v.pedido.estado, v.datosPago], ['pendiente', 650, 200, 'por_pagar', 'BBVA 0123 4567']);
const citaMs = Date.parse(`${lejos}T11:00:00-07:00`), vence = Date.parse(v.pedido.venceEn);
assert.ok(vence <= citaMs - 48 * HORA && vence <= Date.now() + 48 * HORA + 60000);   // 48 h y nunca después de 48 h antes de la cita
assert.ok(tablas.avisos.some(a => /Aceptó su cita/.test(a.titulo) && /para pagar \$650/.test(a.detalle)));

// 7. No pagó a tiempo: el pedido vence, la cita (que esperaba ese pago) se cancela y todo vuelve a estar disponible
const despues = vence + 60000;
assert.ok((await vencerPedidos(env, despues)).vencidos >= 1);   // el de la cita (y los de solo productos, pedidos antes)
const cita = tablas.citas.find(x => x.id === idCita);
assert.deepEqual([tablas.pedidos.find(p => p.citaId === idCita).estado, cita.estado, cita.canceladaPor], ['vencido', 'cancelada', 'sistema']);
assert.ok(tablas.avisos.some(a => /Venció sin pago: Mia/.test(a.titulo) && /se canceló y el horario quedó libre/.test(a.detalle)));
assert.equal((await vencerPedidos(env, despues)).vencidos, 0);   // una sola vez
// Si el salón ya había recibido el anticipo (o confirmado), la cita se respeta aunque el pedido venza
tablas.citas.push({ id: 'cConf', clienteId: 'k', servicioId: 's1', fecha: lejos, hora: '15:00', estado: 'pendiente', anticipoConfirmado: true, realmId: 'r' });
tablas.pedidos.push({ id: 'pConf', clienteId: 'k', citaId: 'cConf', items: [], totalProductos: 0, anticipo: 150, total: 150, estado: 'por_pagar',
  venceEn: new Date(Date.now() - 1000).toISOString(), creado: '', enlace: 'c'.repeat(32), realmId: 'r' });
await vencerPedidos(env);
assert.equal(tablas.citas.find(x => x.id === 'cConf').estado, 'pendiente');

// 8. Pagado y no recogido en 10 días: vuelve a la venta y lo pagado queda como saldo a favor (una sola vez)
tablas.pedidos.push({ id: 'pPag', clienteId: 'kP', items: [{ productoId: 'p1', nombre: 'Shampoo matizador', cantidad: 1, precio: 450 }], totalProductos: 450,
  anticipo: 0, total: 450, estado: 'pagado', recogerHasta: new Date(Date.now() - 1000).toISOString(), creado: '', enlace: 'd'.repeat(32), realmId: 'r' });
assert.deepEqual(await vencerPedidos(env), { vencidos: 0, noRecogidos: 1 });
assert.deepEqual(tablas.movimientosSaldo.filter(m => m.clienteId === 'kP').map(m => m.monto), [450]);
assert.equal(tablas.pedidos.find(p => p.id === 'pPag').estado, 'no_recogido');
assert.equal((await vencerPedidos(env)).noRecogidos, 0);

// 9. El salón registra el pago (o la entrega) mientras el Worker revisa: el Worker no lo pisa ni abona saldo
tablas.pedidos.push({ id: 'pCarrera', clienteId: 'kC', items: [], totalProductos: 0, anticipo: 150, total: 150, estado: 'por_pagar',
  venceEn: new Date(Date.now() - 1000).toISOString(), creado: '', enlace: 'e'.repeat(32), realmId: 'r' });
trasLeerPedidos = () => Object.assign(tablas.pedidos.find(p => p.id === 'pCarrera'), { estado: 'pagado', pagadoEn: 'ya' });
assert.deepEqual(await vencerPedidos(env), { vencidos: 0, noRecogidos: 0 });
assert.equal(tablas.pedidos.find(p => p.id === 'pCarrera').estado, 'pagado');
tablas.pedidos.push({ id: 'pEntrega', clienteId: 'kE', items: [{ productoId: 'p1', nombre: 'Shampoo matizador', cantidad: 1, precio: 450 }], totalProductos: 450,
  anticipo: 0, total: 450, estado: 'pagado', recogerHasta: new Date(Date.now() - 1000).toISOString(), creado: '', enlace: 'f'.repeat(32), realmId: 'r' });
trasLeerPedidos = () => Object.assign(tablas.pedidos.find(p => p.id === 'pEntrega'), { estado: 'entregado', entregadoEn: 'ya' });
assert.equal((await vencerPedidos(env)).noRecogidos, 0);
assert.ok(!tablas.movimientosSaldo.some(m => m.clienteId === 'kE'));

console.log('pedidos ok');
