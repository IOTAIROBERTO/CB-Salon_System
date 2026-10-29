// Check: npx esbuild scripts/cobro.check.ts --bundle --platform=node --log-level=warning | node
// Cobro exprés: parte del precio acordado al valorar, descuenta solo el anticipo recibido y redondea igual que el
// cobro completo (CobroModal), así reportes, comisiones y puntos salen iguales por cualquiera de los dos caminos.
import assert from 'node:assert/strict';
import { cobroExpres, precioBase } from '../src/utils/cobro';
import { calculateChargeBreakdown } from '../src/utils/financialUtils';

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

console.log('cobro: ok');
