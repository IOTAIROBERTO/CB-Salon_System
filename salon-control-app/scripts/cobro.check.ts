// Check: npx esbuild scripts/cobro.check.ts --bundle --platform=node --log-level=warning | node
// Cobro exprés: parte del precio acordado al valorar, descuenta solo el anticipo recibido y redondea igual que el
// cobro completo (CobroModal), así reportes, comisiones y puntos salen iguales por cualquiera de los dos caminos.
import assert from 'node:assert/strict';
import { cobroExpres, precioBase } from '../src/utils/cobro';
import { calculateChargeBreakdown } from '../src/utils/financialUtils';
import { citaCerrada, consecuenciaCancelar, motivoNoBorrar, pedidoTrasAnticipo, reversaCobro } from '../src/utils/estadoCita';

const servicios = [{ id: 's1', precioSugerido: 500 }, { id: 's2', precioSugerido: 1200 }];

// Precio base: el acordado solo si sigue siendo el mismo servicio
assert.equal(precioBase({ servicioId: 's1', precioAcordado: 655 }, 's1', servicios), 655);
assert.equal(precioBase({ servicioId: 's1', precioAcordado: 655 }, 's2', servicios), 1200);
assert.equal(precioBase({ servicioId: 's1' }, 's1', servicios), 500);
assert.equal(precioBase({ servicioId: 's1', precioAcordado: 0 }, 's1', servicios), 0);   // acordado en $0 (cortesía) se respeta

// Acordado $655 con $150 de anticipo recibido: hoy se cobran $510 (505 redondeado a decena) y el total registrado es $660
let c = cobroExpres({ servicioId: 's1', precioAcordado: 655, montoAnticipo: 150, anticipoConfirmado: true }, servicios);
assert.deepEqual([c.aCobrar, c.precioFinal, c.anticipo, c.redondeo, c.subtotal], [510, 660, 150, 5, 655]);
// Lo mismo que calcula el cobro completo sin tocar nada
const completo = calculateChargeBreakdown(655, 0, 0, 150);
assert.equal(c.precioFinal, completo.subtotalConDescuento + completo.montoRedondeo + completo.propina);
assert.deepEqual([c.datos.subtotalConDescuento, c.datos.montoRedondeo, c.datos.anticipoRecibido, c.datos.pagadoConSaldo], [655, 5, 150, 0]);

// Anticipo sin confirmar no se descuenta: se cobra completo
c = cobroExpres({ servicioId: 's1', montoAnticipo: 150, anticipoConfirmado: false }, servicios);
assert.deepEqual([c.aCobrar, c.precioFinal, c.anticipo], [500, 500, 0]);

// Cancelar: la misma política de 48 h que «Mi cita». Sin anticipo recibido no hay nada que mover; sin hora nada corre
const lejos = { fecha: '2030-01-10', hora: '10:00' }, ahora = (h: number) => new Date('2030-01-10T10:00:00').getTime() - h * 3600000;
const pagado = { ...lejos, anticipoConfirmado: true, montoAnticipo: 500 };
assert.equal(consecuenciaCancelar(pagado, ahora(48)).destino, 'saldo');
assert.equal(consecuenciaCancelar(pagado, ahora(47)).destino, 'perdido');
assert.equal(consecuenciaCancelar(pagado, ahora(47)).pagado, 500);
assert.equal(consecuenciaCancelar({ ...lejos, anticipoConfirmado: false, montoAnticipo: 500 }, ahora(1)).destino, null);   // pendiente: no se recibió
assert.equal(consecuenciaCancelar({ fecha: '2030-01-10', hora: '', anticipoConfirmado: true, montoAnticipo: 500 }, ahora(1)).destino, 'saldo');   // solicitud sin hora

// Cerradas: no se editan. Con dinero: no se borran
assert.ok(citaCerrada({ estado: 'cancelada' }) && citaCerrada({ estado: 'completada' }) && citaCerrada({ estado: 'no_llego' }));
assert.ok(!citaCerrada({ estado: 'confirmada' }) && !citaCerrada({ estado: 'iniciada' }));
assert.ok(motivoNoBorrar({ ...lejos, estado: 'completada' }));
assert.ok(motivoNoBorrar({ ...lejos, estado: 'cancelada', anticipoASaldo: 500 }));
assert.ok(motivoNoBorrar({ ...lejos, estado: 'no_llego', anticipoPerdido: 500 }));
assert.ok(motivoNoBorrar({ ...pagado, estado: 'confirmada' }));
assert.equal(motivoNoBorrar({ ...lejos, estado: 'pendiente', montoAnticipo: 500, anticipoConfirmado: false }), '');
assert.equal(motivoNoBorrar({ ...lejos, estado: 'cancelada' }), '');

// Anticipo recibido fuera del pedido: sin productos queda pagado; con productos, estos siguen por pagar solos
assert.equal(pedidoTrasAnticipo({ items: [], totalProductos: 0 }).pagarCompleto, true);
assert.deepEqual(pedidoTrasAnticipo({ items: [1], totalProductos: 450 }), { pagarCompleto: false, anticipo: 0, total: 450 });

// Anular cobro: devuelve el neto de saldo de esa cita, quita sus canjes y sus puntos; no toca los de otras citas
const mov = (id: string, citaId: string | undefined, monto: number, extra = {}) => ({ id, citaId, monto, fecha: 'f0', ...extra });
const canjes = [{ clave: 'regalo', citaId: 'c1', puntos: 200, fecha: 'f1' }, { clave: 'cafe', citaId: 'c1', fecha: 'f1' }, { clave: 'otro', citaId: 'c2', puntos: 400, fecha: 'f2' }];
let rev = reversaCobro('c1', [mov('m1', 'c1', -300), mov('m2', undefined, 0, { origen: 'club', puntos: 200, fecha: 'f1' }), mov('m3', undefined, 0, { origen: 'club', puntos: 400, fecha: 'f2' }), mov('m4', 'c2', -100)], canjes);
assert.equal(rev.devolver, 300);
assert.deepEqual(rev.movimientosABorrar, ['m2']);
assert.deepEqual(rev.canjes.map(c => c.clave), ['otro']);
// Anulado una vez y vuelto a cobrar: solo se devuelve lo del último cobro. Ya anulado: nada más que devolver
assert.equal(reversaCobro('c1', [mov('a', 'c1', -300), mov('b', 'c1', 300), mov('c', 'c1', -100)], []).devolver, 100);
assert.equal(reversaCobro('c1', [mov('a', 'c1', -300), mov('b', 'c1', 300)], []).devolver, 0);
// Sin saldo ni canjes: nada que revertir
rev = reversaCobro('c9', [mov('m1', 'c1', -300)], canjes);
assert.deepEqual([rev.devolver, rev.movimientosABorrar, rev.canjes.length], [0, [], 3]);

console.log('cobro: ok');
