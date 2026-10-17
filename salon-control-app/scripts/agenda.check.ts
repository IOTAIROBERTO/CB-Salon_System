// Check: npx esbuild scripts/agenda.check.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';
import { horariosLibres, choques, tramosCita, AGENDA_INICIAL, type ConfigAgenda } from '../src/utils/agenda';

const servicios = [
  { id: 'corte', nombre: 'Corte', categoria: 'corte', duracion: 60 },
  // Color: 45 min aplicando, 35 de proceso (libre), 40 de enjuague y secado
  { id: 'color', nombre: 'Babylights', categoria: 'color', duracion: 120, tiempoProceso: 35, tiempoCierre: 40 },
  { id: 'ampolleta', nombre: 'Ampolleta', categoria: 'tratamiento', duracion: 30 }
];
const config: ConfigAgenda = { ...AGENDA_INICIAL, margen: 15, intervalo: 30, anticipacionHoras: 0, bloqueos: [] };
const cristina = { id: 'cristina', nombre: 'Cristina' };
const lunes = '2026-10-19'; // lunes, 10:00–19:00
const ahora = new Date('2026-10-01T09:00:00');

// Tramos: 45 activos, 35 libres, 40 activos + 15 de margen
assert.deepEqual(tramosCita(600, 'color', [], servicios, 15).tramos, [{ de: 600, a: 645 }, { de: 680, a: 735 }]);

// Día vacío: el corte cabe de 10:00 a 18:00 (termina 19:00)
const libres = horariosLibres({ fecha: lunes, servicioId: 'corte', personas: [cristina], citas: [], servicios, config, ahora });
assert.equal(libres[0].hora, '10:00');
assert.equal(libres.at(-1)!.hora, '18:00');

// Color a las 10:00: el corte de 60 min no cabe en los 35 de proceso, pero sí a las 12:30
const citas = [{ id: 'c1', fecha: lunes, hora: '10:00', servicioId: 'color' }];
const conColor = horariosLibres({ fecha: lunes, servicioId: 'corte', personas: [cristina], citas, servicios, config, ahora }).map(h => h.hora);
assert.ok(!conColor.includes('10:00') && !conColor.includes('11:00') && conColor.includes('12:30'));

// Una ampolleta de 30 min sí cabe en el proceso del color (10:45–11:20)? 10:45+30+15 = 11:30 > 11:20: no.
// Con margen 0 y paso de 15 min sí entra a las 10:45
const ajustado = { ...config, margen: 0, intervalo: 15 };
const enProceso = horariosLibres({ fecha: lunes, servicioId: 'ampolleta', personas: [cristina], citas, servicios, config: ajustado, ahora }).map(h => h.hora);
assert.ok(enProceso.includes('10:45'));

// Una colaboradora que solo hace corte toma el horario que Cristina tiene ocupado
const ana = { id: 'ana', nombre: 'Ana', categorias: ['corte'] };
const dos = horariosLibres({ fecha: lunes, servicioId: 'corte', personas: [cristina, ana], citas, servicios, config, ahora });
assert.ok(dos.some(h => h.hora === '10:00' && h.personaId === 'ana'));
assert.equal(horariosLibres({ fecha: lunes, servicioId: 'color', personas: [ana], citas: [], servicios, config, ahora }).length, 0);

// Domingo cerrado, anticipación y bloqueos
assert.equal(horariosLibres({ fecha: '2026-10-18', servicioId: 'corte', personas: [cristina], citas: [], servicios, config, ahora }).length, 0);
const tarde = horariosLibres({ fecha: lunes, servicioId: 'corte', personas: [cristina], citas: [], servicios,
  config: { ...config, anticipacionHoras: 3 }, ahora: new Date(`${lunes}T09:30:00`) });
assert.equal(tarde[0].hora, '12:30');
const bloq = { ...config, bloqueos: [{ id: 'b', personaId: 'todas', desde: `${lunes}T13:00`, hasta: `${lunes}T15:00`, motivo: 'Curso' }] };
const conBloqueo = horariosLibres({ fecha: lunes, servicioId: 'corte', personas: [cristina], citas: [], servicios, config: bloq, ahora }).map(h => h.hora);
assert.ok(!conBloqueo.includes('13:00') && !conBloqueo.includes('12:30') && conBloqueo.includes('15:00'));

// El margen no choca con el descanso: un corte de 13:00 a 14:00 cabe antes de un descanso de 14:00
const conDescanso = { ...config, horario: { ...config.horario, '1': { abre: '10:00', cierra: '19:00', descansoDe: '14:00', descansoA: '15:00' } } };
const antesDescanso = horariosLibres({ fecha: lunes, servicioId: 'corte', personas: [cristina], citas: [], servicios, config: conDescanso, ahora }).map(h => h.hora);
assert.ok(antesDescanso.includes('13:00') && !antesDescanso.includes('13:30') && antesDescanso.includes('15:00'));
assert.deepEqual(choques({ id: 'c6', fecha: lunes, hora: '13:00', servicioId: 'corte' }, [], servicios, conDescanso), []);

// Choques al mover una cita a mano
assert.deepEqual(choques({ id: 'c2', fecha: lunes, hora: '11:00', servicioId: 'corte' }, citas, servicios, config),
  ['Se cruza con la cita de las 10:00 (Babylights)']);
assert.deepEqual(choques({ id: 'c3', fecha: lunes, hora: '18:30', servicioId: 'corte' }, [], servicios, config),
  ['Termina a las 19:30, después del cierre (19:00)']);
assert.deepEqual(choques({ id: 'c4', fecha: lunes, hora: '13:30', servicioId: 'corte' }, [], servicios, bloq), ['Horario bloqueado: Curso']);
assert.deepEqual(choques({ id: 'c5', fecha: lunes, hora: '10:00', servicioId: 'corte', atiendeId: 'ana' }, citas, servicios, config), []);
console.log('agenda: ok');
