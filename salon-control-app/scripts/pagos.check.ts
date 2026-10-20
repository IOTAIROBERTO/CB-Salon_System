// Verificación del pago por horas: npx esbuild scripts/pagos.check.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';
import { feriados, pagoPeriodo, MINIMO_POR_HORA } from '../src/utils/pagos';

// Feriados 2026 y 2027 según el art. 74 (los lunes se recorren)
const f26 = Object.keys(feriados(2026));
assert.deepEqual(f26, ['2026-01-01', '2026-02-02', '2026-03-16', '2026-05-01', '2026-09-16', '2026-11-16', '2026-12-25']);
assert.ok(Object.keys(feriados(2030)).includes('2030-10-01'));
assert.equal(MINIMO_POR_HORA, 39.38);

const emp = { id: 'ana', nombre: 'Ana', pagoPorHora: 60, bonos: { color: 80 } };
const apoyos = [
  { empleadoId: 'ana', tipo: 'apoyo', fechaInicio: '2026-11-14', fechaFin: '2026-11-16', horas: 6 }, // sáb, dom, lunes feriado
  { empleadoId: 'ana', tipo: 'vacaciones', fechaInicio: '2026-11-17', fechaFin: '2026-11-17', horas: 6 }, // no cuenta
  { empleadoId: 'otra', tipo: 'apoyo', fechaInicio: '2026-11-14', fechaFin: '2026-11-14', horas: 6 }
];
const servicios = [{ id: 'b', categoria: 'color' }, { id: 'c', categoria: 'corte' }];
const citas = [
  { estado: 'completada', fecha: '2026-11-14', servicioId: 'b', empleadoIds: ['ana'] },
  { estado: 'completada', fecha: '2026-11-15', servicioId: 'c', empleadoIds: ['ana'] }, // corte sin bono
  { estado: 'cancelada', fecha: '2026-11-15', servicioId: 'b', empleadoIds: ['ana'] }
];
const p = pagoPeriodo(emp, apoyos, citas, servicios, '2026-11-14', '2026-11-20');
assert.equal(p.horas, 18);
assert.deepEqual(p.dias.map(d => d.importe), [360, 450, 1080]); // normal, domingo +25 %, feriado ×3
assert.equal(p.totalBonos, 80);
assert.equal(p.total, 360 + 450 + 1080 + 80);
console.log('pagos: ok');
