// Verificación del Círculo CB por puntos: npx esbuild scripts/lealtad.check.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';
import { estadoCirculo, nivelPorPuntos, siguienteNivel, beneficiosDisponibles, enlaceWhatsApp, codigoClienta, PARAMETROS_CIRCULO } from '../src/utils/lealtad';

const servicios = [{ id: 's10', categoria: 'color' }, { id: 's01', categoria: 'corte' }];
const a = { id: 'a', cumple: '1990-02-03' };
const b = { id: 'b', referidaPor: 'a' };
const citas = [
  { clienteId: 'a', servicioId: 's01', estado: 'completada', fecha: '2026-12-20', precioFinal: 9000 },   // antes del arranque: no cuenta
  { clienteId: 'a', servicioId: 's10', estado: 'completada', fecha: '2027-01-10', precioFinal: 3000, propina: 200 }, // 2800 / 20 = 140 + bienvenida
  { clienteId: 'a', servicioId: 's10', estado: 'cancelada', fecha: '2027-01-12', precioFinal: 5000 },
  { clienteId: 'a', servicioId: 's01', estado: 'completada', fecha: '2027-02-15', precioFinal: 500, origen: 'app' }, // 25 + app + cumpleaños
  { clienteId: 'b', servicioId: 's10', estado: 'completada', fecha: '2027-02-20', precioFinal: 2600 }    // amiga con color
];
const ventas = [
  { clienteId: 'a', fecha: '2027-01-11T10:00:00Z', total: 250, productos: [{}] }, // 250 / 10 = 25
  { clienteId: 'a', fecha: '2027-01-11T10:00:00Z', total: 3000 }                 // venta espejo de cita: no suma
];

// Enero y febrero con visitas; marzo y abril sin visita son de gracia; mayo y junio pierden 10 % cada uno
const e = estadoCirculo(a, citas, ventas, [a, b], servicios, PARAMETROS_CIRCULO, new Date('2027-07-02T12:00:00'));
const antes = 50 + 140 + 25 + 25 + 20 + 50 + 100; // 410
assert.equal(e.movimientos.filter(m => m.puntos > 0).reduce((t, m) => t + m.puntos, 0), antes);
assert.deepEqual(e.movimientos.filter(m => m.puntos < 0).map(m => m.puntos), [-41, -36]);
assert.equal(e.puntos, 410 - 41 - 36);
assert.equal(e.nivel, 'marfil');
// Con visita cada dos meses (ciclo normal de color) nunca se castiga
assert.equal(estadoCirculo(a, citas, ventas, [a, b], servicios, PARAMETROS_CIRCULO, new Date('2027-05-02T12:00:00')).puntos, 410);

// Sin actividad desde el arranque: sin tarjeta activa, cero puntos
assert.deepEqual(estadoCirculo({ id: 'z' }, citas, ventas, [], servicios).puntos, 0);

assert.equal(nivelPorPuntos(499), 'marfil');
assert.equal(nivelPorPuntos(500), 'dorado');
assert.equal(nivelPorPuntos(1200), 'onix');
assert.deepEqual(siguienteNivel(333), { nivel: 'dorado', falta: 167 });

// Beneficios por nivel (cumpleaños en su mes, matiz anual de Ónix, amiga con color)
const hoy = new Date('2027-02-25T12:00:00');
assert.deepEqual(beneficiosDisponibles(a, 'onix', [a, b], citas, servicios, hoy), ['cumple', 'matizAnual', 'referido']);

assert.match(codigoClienta('cli_123'), /^CB[0-9A-Z]{6}$/);
assert.equal(codigoClienta('cli_123'), codigoClienta('cli_123'));
assert.notEqual(codigoClienta('cli_123'), codigoClienta('cli_124'));
assert.equal(enlaceWhatsApp('662 161 4688', 'hola'), 'https://wa.me/526621614688?text=hola');
assert.equal(enlaceWhatsApp('abc', 'hola'), null);
console.log('lealtad: ok');
