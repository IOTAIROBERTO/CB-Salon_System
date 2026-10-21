// Verificación del Club Cristina Borquez: npx esbuild scripts/lealtad.check.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';
import {
  estadoCirculo, nivelPorPuntos, siguienteNivel, beneficiosDisponibles, enlaceWhatsApp, codigoClienta, PARAMETROS_CIRCULO,
  descuentoProducto, siguienteDescuento, montoCanje, rachaConstancia, tituloCanje
} from '../src/utils/lealtad';

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

// Enero y febrero con visitas; marzo sin visita pierde 10 % (sin meses de gracia)
const e = estadoCirculo(a, citas, ventas, [a, b], servicios, PARAMETROS_CIRCULO, new Date('2027-04-02T12:00:00'));
assert.equal(e.movimientos.filter(m => m.puntos > 0).reduce((t, m) => t + m.puntos, 0), 50 + 140 + 25 + 25 + 20 + 50 + 100);
assert.deepEqual(e.movimientos.filter(m => m.puntos < 0).map(m => m.puntos), [-41]);
assert.equal(e.puntos, 369);
assert.equal(e.nivel, 'marfil');

// Multiplicador: ya en Dorado, cada compra suma 1.15x
const c = { id: 'c' };
const citasC = [
  { clienteId: 'c', servicioId: 's10', estado: 'completada', fecha: '2027-01-05', precioFinal: 8000 }, // 400 + 50 = 450
  { clienteId: 'c', servicioId: 's10', estado: 'completada', fecha: '2027-01-20', precioFinal: 2000 }, // 100 → 550: Dorado
  { clienteId: 'c', servicioId: 's10', estado: 'completada', fecha: '2027-02-05', precioFinal: 2000 }  // 100 × 1.15 = 115
];
const ec = estadoCirculo(c, citasC, [], [c], servicios, PARAMETROS_CIRCULO, new Date('2027-02-10T12:00:00'));
assert.equal(ec.puntos, 665);
assert.equal(ec.nivel, 'dorado');
assert.match(ec.movimientos[ec.movimientos.length - 1].concepto, /×1\.15/);

// Canje de puntos por saldo: resta los puntos
const ecCanje = estadoCirculo({ ...c, canjes: [{ clave: 'saldo', fecha: '2027-02-08T10:00:00Z', puntos: 200 }] }, citasC, [], [c], servicios, PARAMETROS_CIRCULO, new Date('2027-02-10T12:00:00'));
assert.equal(ecCanje.puntos, 665 - 200); // el canje del 8 de febrero resta después de la compra del 5
assert.equal(montoCanje(200), 50);
assert.equal(tituloCanje({ clave: 'saldo', puntos: 200 }), '200 puntos cambiados por saldo');
assert.equal(tituloCanje({ clave: 'ampolleta' }), 'ampolleta'); // canjes viejos no truenan

// Descuentos en productos que se desbloquean
assert.equal(descuentoProducto(349), 0);
assert.equal(descuentoProducto(350), 5);
assert.equal(descuentoProducto(900), 10);
assert.equal(descuentoProducto(2250), 15);
assert.deepEqual(siguienteDescuento(400), { pct: 10, puntos: 900 });

// Niveles
assert.equal(nivelPorPuntos(499), 'marfil');
assert.equal(nivelPorPuntos(500), 'dorado');
assert.equal(nivelPorPuntos(1500), 'onix');
assert.deepEqual(siguienteNivel(369), { nivel: 'dorado', falta: 131 });
assert.deepEqual(estadoCirculo({ id: 'z' }, citas, ventas, [], servicios).puntos, 0);

// Constancia: 5 visitas sin pasar 70 días entre una y otra → corte de cortesía; se reinicia al usarlo
const d = { id: 'd' };
const visitas = ['2027-01-10', '2027-03-01', '2027-04-25', '2027-06-20', '2027-08-15'].map(f => ({ clienteId: 'd', servicioId: 's10', estado: 'completada', fecha: f, precioFinal: 1000 }));
assert.equal(rachaConstancia(d, visitas), 5);
assert.deepEqual(beneficiosDisponibles(d, 'marfil', [d], visitas, servicios, new Date('2027-08-20T12:00:00')), ['constancia']);
assert.equal(rachaConstancia({ ...d, canjes: [{ clave: 'constancia', fecha: '2027-08-15T18:00:00Z' }] }, visitas), 0);
const conHueco = visitas.map((v, i) => i === 2 ? { ...v, fecha: '2027-05-30' } : v); // 90 días entre la 2.ª y la 3.ª
assert.equal(rachaConstancia(d, conHueco), 3);
// Cumpleaños: detalle una vez en su mes
assert.deepEqual(beneficiosDisponibles(a, 'marfil', [a, b], citas, servicios, new Date('2027-02-25T12:00:00')), ['cumple']);

assert.match(codigoClienta('cli_123'), /^CB[0-9A-Z]{6}$/);
assert.equal(codigoClienta('cli_123'), codigoClienta('cli_123'));
assert.notEqual(codigoClienta('cli_123'), codigoClienta('cli_124'));
assert.equal(enlaceWhatsApp('662 161 4688', 'hola'), 'https://wa.me/526621614688?text=hola');
assert.equal(enlaceWhatsApp('abc', 'hola'), null);
console.log('lealtad: ok');
