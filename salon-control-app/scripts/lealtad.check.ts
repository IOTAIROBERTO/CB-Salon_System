// Verificación del Círculo CB por puntos: npx esbuild scripts/lealtad.check.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';
import { estadoCirculo, nivelPorPuntos, siguienteNivel, beneficiosDisponibles, enlaceWhatsApp, codigoClienta, PARAMETROS_CIRCULO } from '../src/utils/lealtad';

const servicios = [{ id: 's10', categoria: 'color' }, { id: 's01', categoria: 'corte' }];
const a = { id: 'a', cumple: '1990-02-03' };
const b = { id: 'b', referidaPor: 'a' };
const citas = [
  { clienteId: 'a', servicioId: 's01', estado: 'completada', fecha: '2026-12-20', precioFinal: 9000 },   // antes del arranque: no cuenta
  { clienteId: 'a', servicioId: 's10', estado: 'completada', fecha: '2027-01-10', precioFinal: 3000, propina: 200 }, // 280 + bienvenida
  { clienteId: 'a', servicioId: 's10', estado: 'cancelada', fecha: '2027-01-12', precioFinal: 5000 },
  { clienteId: 'a', servicioId: 's01', estado: 'completada', fecha: '2027-02-15', precioFinal: 500, origen: 'app' }, // 50 + app + cumpleaños
  { clienteId: 'b', servicioId: 's10', estado: 'completada', fecha: '2027-02-20', precioFinal: 2600 }    // amiga con color
];
const ventas = [
  { clienteId: 'a', fecha: '2027-01-11T10:00:00Z', total: 250, productos: [{}] }, // 25 × 2 = 50
  { clienteId: 'a', fecha: '2027-01-11T10:00:00Z', total: 3000 }                 // venta espejo de cita: no suma
];

// Enero y febrero con visitas; marzo y abril sin visita: pierde 10 % al cierre de cada uno
const e = estadoCirculo(a, citas, ventas, [a, b], servicios, PARAMETROS_CIRCULO, new Date('2027-05-02T12:00:00'));
const antes = 100 + 280 + 50 + 50 + 50 + 100 + 150; // 780
assert.equal(e.movimientos.filter(m => m.puntos > 0).reduce((t, m) => t + m.puntos, 0), antes);
assert.deepEqual(e.movimientos.filter(m => m.puntos < 0).map(m => m.puntos), [-78, -70]);
assert.equal(e.puntos, 780 - 78 - 70);
assert.equal(e.nivel, 'dorado');

// Sin actividad desde el arranque: sin tarjeta activa, cero puntos
assert.deepEqual(estadoCirculo({ id: 'z' }, citas, ventas, [], servicios).puntos, 0);

assert.equal(nivelPorPuntos(599), 'marfil');
assert.equal(nivelPorPuntos(600), 'dorado');
assert.equal(nivelPorPuntos(1500), 'onix');
assert.deepEqual(siguienteNivel(632), { nivel: 'onix', falta: 868 });

// Beneficios por nivel (cumpleaños en su mes, matiz anual de Ónix, amiga con color)
const hoy = new Date('2027-02-25T12:00:00');
assert.deepEqual(beneficiosDisponibles(a, 'onix', [a, b], citas, servicios, hoy), ['cumple', 'matizAnual', 'referido']);

assert.match(codigoClienta('cli_123'), /^CB[0-9A-Z]{6}$/);
assert.equal(codigoClienta('cli_123'), codigoClienta('cli_123'));
assert.notEqual(codigoClienta('cli_123'), codigoClienta('cli_124'));
assert.equal(enlaceWhatsApp('662 161 4688', 'hola'), 'https://wa.me/526621614688?text=hola');
assert.equal(enlaceWhatsApp('abc', 'hola'), null);
console.log('lealtad: ok');
