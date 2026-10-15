// Verificación del Círculo CB. Correr con: node scripts/lealtad.check.ts
import assert from 'node:assert/strict';
import { gastoDoceMeses, nivelDe, siguienteNivel, beneficiosDisponibles, enlaceWhatsApp } from '../src/utils/lealtad.ts';

const hoy = new Date('2026-10-15T12:00:00');
const servicios = [{ id: 's10', categoria: 'color' }, { id: 's01', categoria: 'corte' }];
const citas = [
  { clienteId: 'a', servicioId: 's10', estado: 'completada', fecha: '2026-09-01', precioFinal: 3000, propina: 200 },
  { clienteId: 'a', servicioId: 's10', estado: 'completada', fecha: '2025-09-01', precioFinal: 9000 }, // hace más de un año
  { clienteId: 'a', servicioId: 's10', estado: 'cancelada', fecha: '2026-09-02', precioFinal: 5000 },
  { clienteId: 'b', servicioId: 's10', estado: 'completada', fecha: '2026-08-01', precioFinal: 2700 }
];
const ventas = [{ clienteId: 'a', fecha: '2026-10-01', total: 2500 }];

// Gasto: 3000 − 200 de propina + 2500 de producto; no cuenta lo viejo ni lo cancelado
assert.equal(gastoDoceMeses('a', citas, ventas, hoy), 5300);
assert.equal(nivelDe(4999), 'marfil');
assert.equal(nivelDe(5000), 'dorado');
assert.equal(nivelDe(12000), 'onix');
assert.deepEqual(siguienteNivel(5300), { nivel: 'onix', falta: 6700 });
assert.equal(siguienteNivel(15000), null);

// Cumpleaños en octubre + amiga «b» con color pagado; Ónix suma el matiz anual
const a = { id: 'a', cumple: '1990-10-03' };
const b = { id: 'b', referidaPor: 'a' };
assert.deepEqual(beneficiosDisponibles(a, 'onix', [a, b], citas, servicios, hoy), ['cumple', 'matizAnual', 'referido']);
// Ya canjeados este año / a la fecha: no se repiten
const aCanjeo = { ...a, canjes: [{ clave: 'cumple' as const, fecha: '2026-10-05T10:00:00Z' }, { clave: 'referido' as const, fecha: '2026-10-05T10:00:00Z' }] };
assert.deepEqual(beneficiosDisponibles(aCanjeo, 'dorado', [aCanjeo, b], citas, servicios, hoy), []);

assert.equal(enlaceWhatsApp('662 161 4688', 'hola'), 'https://wa.me/526621614688?text=hola');
assert.equal(enlaceWhatsApp('abc', 'hola'), null);
console.log('lealtad: ok');
