// Check: npx esbuild scripts/pedidos.check.ts --bundle --platform=node --log-level=warning | node
// «Mi carrito»: plazo de pago (48 h y nunca después de 48 h antes de la cita) y lo apartado que no se vende en la tienda.
import assert from 'node:assert/strict';
import { apartados, disponible, plazoDePago, recogerHasta, totalItems } from '../src/utils/pedidos';

const H = 3600 * 1000, ahora = Date.parse('2026-11-02T17:00:00Z');   // lunes 10:00 en Hermosillo

// Solo productos: 48 h desde que aparta
assert.equal(plazoDePago(ahora), ahora + 48 * H);
// Cita el viernes 17:00 (4 días y 7 h): gana «48 h para pagar» (miércoles 10:00), antes de «48 h antes de la cita» (miércoles 17:00)
assert.equal(plazoDePago(ahora, ahora + 103 * H), ahora + 48 * H);
// Cita el jueves 10:00 (72 h): 48 h antes de la cita = martes 10:00
assert.equal(plazoDePago(ahora, ahora + 72 * H), ahora + 24 * H);
// Cita en 49 h: quedaría 1 h; se dan 2 h para pagar al momento
assert.equal(plazoDePago(ahora, ahora + 49 * H), ahora + 2 * H);
// Cita en 3 h: 1 h para pagar (nunca después de 2 h antes de la cita)
assert.equal(plazoDePago(ahora, ahora + 3 * H), ahora + 1 * H);
// Cita en 1 h: ya no se puede apartar
assert.ok(plazoDePago(ahora, ahora + 1 * H) <= ahora);

// Apartados: por pagar y pagado sin entregar; lo entregado, vencido o cancelado ya no aparta
const item = (productoId: string, cantidad: number) => ({ productoId, nombre: productoId, cantidad, precio: 100 });
const pedidos = [
  { id: 'a', estado: 'por_pagar' as const, items: [item('p1', 2)] },
  { id: 'b', estado: 'pagado' as const, items: [item('p1', 1), item('p2', 1)] },
  { id: 'c', estado: 'entregado' as const, items: [item('p1', 5)] },
  { id: 'd', estado: 'vencido' as const, items: [item('p2', 3)] }
];
assert.deepEqual(apartados(pedidos), { p1: 3, p2: 1 });
assert.deepEqual(apartados(pedidos, 'b'), { p1: 2 });   // al entregar el pedido b, lo suyo ya no cuenta como apartado
assert.equal(disponible({ id: 'p1', cantidad: 4 }, apartados(pedidos)), 1);
assert.equal(disponible({ id: 'p1', cantidad: 2 }, apartados(pedidos)), 0);   // nunca negativo
assert.equal(totalItems([item('p1', 2), item('p2', 1)]), 300);
assert.equal(recogerHasta('2026-11-02T17:00:00.000Z'), '2026-11-12T17:00:00.000Z');

console.log('pedidos: ok');
