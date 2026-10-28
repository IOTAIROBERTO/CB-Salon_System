// Verificación del Club Cristina Borquez: npx esbuild scripts/lealtad.check.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';
import {
  estadoCirculo, nivelPorPuntos, siguienteNivel, beneficiosDisponibles, enlaceWhatsApp, codigoClienta, PARAMETROS_CIRCULO,
  descuentoProducto, descuentoServicio, montoCanje, montoTarjeta, porcentajeReferida, rachaConstancia, tituloCanje,
  descuentosReferidaDisponibles, parametrosDe, datosBeneficio, textoSaldoPuntos, permanentesDe, costoPuntos, ANIVERSARIO_PUNTOS
} from '../src/utils/lealtad';
import { descuentoAntojo, esCategoriaBreak } from '../src/data/menuAntojos';

const P = PARAMETROS_CIRCULO;
const P2 = { ...P, miel: 300, ambar: 900, dorado: 2000, onix: 3500 }; // umbrales altos: prueban multiplicadores paso a paso
const servicios = [{ id: 's10', categoria: 'color' }, { id: 's17', categoria: 'color' }, { id: 's01', categoria: 'corte' }];
const fecha = (f: string) => new Date(`${f}T12:00:00`);

// Clienta a: cumpleaños en febrero. 1 ene 2027 es viernes: el 10 de enero es domingo, el 11 y el 15 de febrero lunes.
const a = { id: 'a', cumple: '1990-02-03' };
const b = { id: 'b', referidaPor: 'a' };
const citas = [
  { clienteId: 'a', servicioId: 's01', estado: 'completada', fecha: '2026-12-20', precioFinal: 9000 },   // antes del arranque: no cuenta
  { clienteId: 'a', servicioId: 's10', estado: 'completada', fecha: '2027-01-10', precioFinal: 3000, propina: 200 }, // 2800 / 10 = 280 (+100 bienvenida → Miel)
  { clienteId: 'a', servicioId: 's10', estado: 'cancelada', fecha: '2027-01-12', precioFinal: 5000 },
  { clienteId: 'a', servicioId: 's01', estado: 'completada', fecha: '2027-02-15', precioFinal: 500, origen: 'app' }, // 50 × 1.05 × 2 (cumpleaños) = 105 + 40 app
  { clienteId: 'b', servicioId: 's10', estado: 'completada', fecha: '2027-02-20', precioFinal: 2600 }    // amiga con matiz: 200 puntos, sin descuento
];
const ventas = [
  { clienteId: 'a', fecha: '2027-01-11T10:00:00Z', total: 250, productos: [{}] }, // 250 / 5 = 50 × 1.05 = 52
  { clienteId: 'a', fecha: '2027-01-11T10:00:00Z', total: 3000 }                 // venta espejo de cita: no suma
];
const ea = estadoCirculo(a, citas, ventas, [a, b], servicios, P, fecha('2027-04-30'));
assert.equal(ea.puntos, 100 + 280 + 52 + 105 + 40 + 200);
assert.equal(ea.puntosNivel, 777);
assert.equal(ea.nivel, 'ambar');
// Inactividad: última visita 15 feb; a los 75 días (1 may) pierde 5 %, a los 90 (16 may) 7 %, a los 120 (15 jun) 12 %
assert.equal(estadoCirculo(a, citas, ventas, [a, b], servicios, P, fecha('2027-05-02')).puntos, 777 - 38);
const junio = estadoCirculo(a, citas, ventas, [a, b], servicios, P, fecha('2027-06-20'));
assert.equal(junio.puntos, 606);
assert.deepEqual(junio.movimientos.filter(m => m.puntos < 0).map(m => m.puntos), [-38, -51, -82]);
assert.equal(junio.puntosNivel, 606); // perder puntos baja los puntos del nivel
assert.equal(junio.nivel, 'ambar');

// Multiplicador por nivel y días dobles (martes y miércoles)
const c = { id: 'c' };
const citasC = [
  { clienteId: 'c', servicioId: 's10', estado: 'completada', fecha: '2027-01-04', precioFinal: 8000 },  // lunes: 800 + 100 = 900 → Ámbar
  { clienteId: 'c', servicioId: 's10', estado: 'completada', fecha: '2027-01-18', precioFinal: 2000 },  // 200 × 1.1 = 220
  { clienteId: 'c', servicioId: 's10', estado: 'completada', fecha: '2027-02-01', precioFinal: 10000 }, // 1000 × 1.1 = 1100 → 2220: Dorado
  { clienteId: 'c', servicioId: 's10', estado: 'completada', fecha: '2027-02-08', precioFinal: 1000 }   // 100 × 1.2 = 120
];
const ec = estadoCirculo(c, citasC, [], [c], servicios, P2, fecha('2027-02-08'));
assert.equal(ec.puntos, 2340);
assert.equal(ec.nivel, 'dorado');
assert.match(ec.movimientos[ec.movimientos.length - 1].concepto, /×1\.2/);
const martes = [...citasC, { clienteId: 'c', servicioId: 's10', estado: 'completada', fecha: '2027-02-09', precioFinal: 1000 }];
assert.equal(estadoCirculo(c, martes, [], [c], servicios, P2, fecha('2027-02-09')).puntos, 2340 + 240); // 100 × 1.2 × 2

// Gastar puntos (leído de movimientosSaldo) baja el saldo y también el nivel
const canje = { clienteId: 'c', fecha: '2027-02-10T10:00:00Z', puntos: 400, origen: 'club', concepto: 'Regalo Dorado: corte' };
const ecCanje = estadoCirculo(c, citasC, [], [c], servicios, P2, fecha('2027-02-10'), [canje, { ...canje, clienteId: 'otra' }]);
assert.equal(ecCanje.puntos, 1940);
assert.equal(ecCanje.puntosNivel, 1940);
assert.equal(ecCanje.nivel, 'ambar'); // de Dorado (2,000) a Ámbar por gastar
assert.equal(ecCanje.movimientos.find(m => m.puntos === -400)?.concepto, 'Regalo Dorado: corte');
assert.equal(estadoCirculo({ ...c, canjes: [{ clave: 'saldo', fecha: '2027-02-10T10:00:00Z', puntos: 400 }] }, citasC, [], [c], servicios,
  P2, fecha('2027-02-10')).puntos, 2340); // escribir canjes en la clienta no quita puntos
// Un año sin venir: lo ganado hace más de 12 meses ya no cuenta y la inactividad baja el saldo
const unAnio = estadoCirculo(c, citasC, [], [c], servicios, P2, fecha('2028-01-10'));
assert.ok(unAnio.puntosNivel < 900 && unAnio.puntosNivel <= unAnio.puntos);
assert.equal(unAnio.nivel, 'miel');

// Aniversario en el Club: cuenta si vino en los últimos 90 días, y vale más en niveles altos
const g = { id: 'g' };
const citasG = [
  { clienteId: 'g', servicioId: 's10', estado: 'completada', fecha: '2027-01-04', precioFinal: 1500 },
  { clienteId: 'g', servicioId: 's10', estado: 'completada', fecha: '2027-11-29', precioFinal: 1500 }
];
const eg = estadoCirculo(g, citasG, [], [g], servicios, P, fecha('2028-01-10'));
const aniv = eg.movimientos.find(m => /aniversario/.test(m.concepto));
assert.equal(aniv?.fecha, '2028-01-04');
assert.equal(aniv?.puntos, ANIVERSARIO_PUNTOS.miel);
const sinVisitaReciente = estadoCirculo(g, citasG.slice(0, 1), [], [g], servicios, P, fecha('2028-01-10'));
assert.ok(!sinVisitaReciente.movimientos.some(m => /aniversario/.test(m.concepto)));

// Amiga recomendada con diseño de color: 20 % en la próxima cita (con tope), sin puntos; la amiga recibe bienvenida extra
const d = { id: 'd' };
const e = { id: 'e', referidaPor: 'd' };
const citasD = [
  { clienteId: 'd', servicioId: 's01', estado: 'completada', fecha: '2027-01-04', precioFinal: 500 },
  { clienteId: 'e', servicioId: 's17', estado: 'completada', fecha: '2027-01-20', precioFinal: 2600 }
];
assert.equal(estadoCirculo(d, citasD, [], [d, e], servicios, P, fecha('2027-01-25')).puntos, 100 + 50);
assert.equal(estadoCirculo(e, citasD, [], [d, e], servicios, P, fecha('2027-01-25')).puntos, 100 + 100 + 546); // 260 × 1.05 × 2 (miércoles)
assert.equal(descuentosReferidaDisponibles(d, [d, e], citasD, P, fecha('2027-01-25')), 1);
assert.deepEqual(beneficiosDisponibles(d, 'marfil', [d, e], citasD, servicios, fecha('2027-01-25')), ['referida']);
assert.equal(descuentosReferidaDisponibles({ ...d, canjes: [{ clave: 'referida', fecha: '2027-02-01T10:00:00Z' }] }, [d, e], citasD, P, fecha('2027-02-02')), 0);
assert.equal(porcentajeReferida(2600), 20);
assert.equal(porcentajeReferida(5000), 12); // tope de $600

// Niveles
assert.equal(nivelPorPuntos(149), 'marfil');
assert.equal(nivelPorPuntos(150), 'miel');
assert.equal(nivelPorPuntos(500), 'ambar');
assert.equal(nivelPorPuntos(1000), 'dorado');
assert.equal(nivelPorPuntos(1700), 'onix');
assert.deepEqual(siguienteNivel(777), { nivel: 'dorado', falta: 223, desde: 1000 });
assert.equal(siguienteNivel(4000), null);
assert.equal(estadoCirculo({ id: 'z' }, citas, ventas, [], servicios).puntos, 0);

// 1. Permanentes: siempre mejoran al subir
assert.equal(descuentoProducto('marfil'), 0);
assert.equal(descuentoProducto('miel'), 3);
assert.equal(descuentoProducto('onix'), 10);
assert.equal(descuentoServicio('miel', 's23'), 5);
assert.equal(descuentoServicio('ambar', 's23'), 10);
assert.equal(descuentoServicio('miel', 's01'), 0);
assert.equal(descuentoServicio('ambar', 's01'), 5);
assert.equal(descuentoServicio('onix', 's21'), 15);
assert.equal(descuentoServicio('onix', 's25'), 0); // paquetes de novia fuera
assert.deepEqual(permanentesDe('marfil'), []);
assert.equal(permanentesDe('onix').length, 8);
assert.match(permanentesDe('onix').join(' · '), /15% en la comida del break \(no incluye bebidas\)/);
assert.equal(montoCanje(200), 50);
assert.equal(montoTarjeta(200, 'marfil'), 50);
assert.equal(montoTarjeta(200, 'dorado'), 55);
assert.equal(montoTarjeta(200, 'onix'), 58);

// 2. Regalos de nivel: los de su nivel y los de abajo, si le alcanzan los puntos; se tachan al usarlos por 12 meses
assert.deepEqual(beneficiosDisponibles({ id: 'r' }, 'ambar', [], [], servicios, fecha('2027-03-25'), P, 600), ['regaloMiel', 'regaloAmbar', 'flequillo']);
assert.deepEqual(beneficiosDisponibles({ id: 'r' }, 'ambar', [], [], servicios, fecha('2027-03-25'), P, 300), ['regaloMiel', 'flequillo']);
const usoRegalo = { id: 'r', canjes: [{ clave: 'regaloMiel' as const, fecha: '2027-03-01T10:00:00Z', puntos: 200 }] };
assert.deepEqual(beneficiosDisponibles(usoRegalo, 'ambar', [], [], servicios, fecha('2027-03-25'), P, 600), ['regaloAmbar', 'flequillo']);
assert.deepEqual(beneficiosDisponibles(usoRegalo, 'miel', [], [], servicios, fecha('2028-03-02'), P, 600), ['regaloMiel']); // vuelve a los 12 meses
assert.deepEqual(beneficiosDisponibles({ id: 'r' }, 'onix', [], [], servicios, fecha('2027-03-25'), P, 5000),
  ['regaloMiel', 'regaloAmbar', 'regaloDorado', 'regaloOnix', 'flequillo', 'antojoOnix']);
assert.deepEqual(beneficiosDisponibles({ id: 'r', canjes: [{ clave: 'antojoOnix', fecha: '2027-03-02T10:00:00Z' }] }, 'onix', [], [], servicios, fecha('2027-03-25'), P, 0), ['flequillo']); // uno al mes
assert.equal(costoPuntos('regaloOnix'), 550);
assert.equal(costoPuntos('cumple'), 0);
assert.equal(tituloCanje({ clave: 'regaloAmbar' }), 'Regalo Ámbar: Mascarilla para el cabello (400 pts)');
assert.equal(tituloCanje({ clave: 'tarjeta', puntos: 200 }), '200 puntos cambiados por tarjeta de regalo');
assert.equal(tituloCanje({ clave: 'corteAnual' }), 'corteAnual'); // canjes viejos no truenan

// 3. Celebraciones: el cumpleaños mejora con el nivel y nunca se pierde al subir
assert.deepEqual(beneficiosDisponibles(a, 'marfil', [a], [], servicios, fecha('2027-02-25')), ['cumple']); // sorpresa en todos los niveles
assert.deepEqual(beneficiosDisponibles(a, 'miel', [a], [], servicios, fecha('2027-02-25'), P, 0), ['cumple']);
assert.deepEqual(beneficiosDisponibles({ ...a, canjes: [{ clave: 'cumple', fecha: '2027-02-10T10:00:00Z' }] }, 'onix', [a], [], servicios, fecha('2027-02-25'), P, 0), ['flequillo', 'antojoOnix']);
assert.equal(datosBeneficio('cumple', 'onix').titulo, 'Sorpresa por tu cumpleaños');

// Constancia: 5 visitas sin pasar 70 días entre una y otra → ampolleta; se reinicia al usarla
const f = { id: 'f' };
const visitas = ['2027-01-10', '2027-03-01', '2027-04-25', '2027-06-20', '2027-08-15'].map(x => ({ clienteId: 'f', servicioId: 's10', estado: 'completada', fecha: x, precioFinal: 1000 }));
assert.equal(rachaConstancia(f, visitas), 5);
assert.deepEqual(beneficiosDisponibles(f, 'marfil', [f], visitas, servicios, fecha('2027-08-20')), ['constancia']);
assert.equal(rachaConstancia({ ...f, canjes: [{ clave: 'constancia', fecha: '2027-08-15T18:00:00Z' }] }, visitas), 0);

// Ajustes guardados de versiones anteriores se ignoran
assert.equal(parametrosDe({ circulo: { dorado: 500 } }).dorado, 1000);
assert.equal(parametrosDe({ circulo: { version: 3, dorado: 2500 } }).dorado, 1000);
assert.equal(parametrosDe({ circulo: { version: 4, dorado: 2500 } }).dorado, 2500);

assert.equal(textoSaldoPuntos(1240), 'Saldo actual: 1,240 puntos = $310. Sigue acumulando o úsalos en tu siguiente compra de producto o servicio.');
assert.match(textoSaldoPuntos(150), /= \$38\. Sigue acumulando: desde 200 puntos/);
assert.match(codigoClienta('cli_123'), /^CB[0-9A-Z]{6}$/);
assert.equal(enlaceWhatsApp('662 161 4688', 'hola'), 'https://wa.me/526621614688?text=hola');
assert.equal(enlaceWhatsApp('abc', 'hola'), null);
// Menú del break: comida con descuento desde Ámbar; bebidas no. Categoría «Break» (y la vieja «Antojos»)
assert.ok(esCategoriaBreak('Break') && esCategoriaBreak('Antojos') && !esCategoriaBreak('Cabello') && !esCategoriaBreak(undefined));
assert.equal(descuentoAntojo('miel', 'Oreo'), 0);
assert.equal(descuentoAntojo('ambar', 'Oreo 42 g'), 5);
assert.equal(descuentoAntojo('dorado', 'Dumplings'), 10);
assert.equal(descuentoAntojo('onix', 'Maruchan'), 15);
assert.equal(descuentoAntojo('onix', 'Coca-Cola 355 ml'), 0); // bebidas sin descuento
assert.equal(descuentoAntojo('onix', 'Algo nuevo'), 0);
assert.equal(descuentoAntojo('onix', ''), 0);
console.log('lealtad: ok');
