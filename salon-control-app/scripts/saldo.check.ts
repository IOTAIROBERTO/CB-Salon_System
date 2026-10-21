// Check: npx esbuild scripts/saldo.check.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';
import { venceActivacion, estadoTarjeta, errorActivacion, saldoDe, saldoUsable, normalizarFolio } from '../src/utils/saldo';

const t = { folio: 'CB-0001', monto: 1000, fechaVenta: '2026-12-10T18:00:00.000Z' };
assert.equal(venceActivacion(t.fechaVenta), '2027-06-10');
assert.equal(estadoTarjeta(t, new Date('2027-06-10T12:00:00')), 'por activar');
assert.equal(estadoTarjeta(t, new Date('2027-06-11T12:00:00')), 'vencida');
assert.equal(estadoTarjeta({ ...t, activadaPor: 'c1' }, new Date('2030-01-01T12:00:00')), 'activada'); // activada no vence
assert.equal(errorActivacion(undefined), 'No existe una tarjeta con ese folio');
assert.equal(errorActivacion({ ...t, activadaPor: 'c1' }), 'Esa tarjeta ya se activó');
assert.match(errorActivacion(t, new Date('2027-07-01T12:00:00'))!, /Venció el 2027-06-10/);
assert.equal(errorActivacion(t, new Date('2027-01-05T12:00:00')), null);

const movs = [{ clienteId: 'c1', monto: 1000 }, { clienteId: 'c1', monto: -650.5 }, { clienteId: 'c2', monto: 300 }];
assert.equal(saldoDe(movs, 'c1'), 349.5);
assert.equal(saldoDe(movs, 'c3'), 0);
assert.equal(saldoUsable(349.5, 1200), 349.5);
assert.equal(saldoUsable(1000, 450), 450);
assert.equal(saldoUsable(0, 450), 0);
assert.equal(normalizarFolio(' cb 0001 '), 'CB0001');
console.log('saldo: ok');
