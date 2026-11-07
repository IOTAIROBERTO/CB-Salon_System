// Check: npx esbuild scripts/agenda.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module
// Motor de agenda: mañana protegida con liberación progresiva, regla de oportunidad, comida, preparación y sugerencias.
import assert from 'node:assert/strict';
import { AGENDA_INICIAL, choques, franjaDe, franjasLibres, horariosLibres, libera, sugerirHorarios, type ConfigAgenda } from '../../salon-control-app/src/utils/agenda';

const config: ConfigAgenda = { ...AGENDA_INICIAL, horario: { '1': { abre: '09:00', cierra: '20:00' } } };
const servicios = [
  { id: 'corte', duracion: 90 }, { id: 'color', duracion: 360, tiempoProceso: 50, tiempoCierre: 60 },
  { id: 'retoque', duracion: 150 }, { id: 'maquillaje', duracion: 60, prioritario: true }
];
const personas = [{ id: 'cristina', nombre: 'Cristina' }];
const lunes = '2030-01-07', ahoraA = (horas: number) => new Date(new Date(`${lunes}T09:00:00`).getTime() - horas * 3600000);
const libres = (servicioId: string, horas: number, citas: any[] = [], cfg = config) =>
  horariosLibres({ fecha: lunes, servicioId, personas, citas, servicios, config: cfg, ahora: ahoraA(horas) }).map(h => h.hora);
const cita = (hora: string, servicioId = 'corte', estado = 'confirmada') => ({ id: hora, fecha: lunes, hora, servicioId, estado });

// Lejos del día, un corte no toma la mañana (ni la tarde que parte el color de 6 h); el color sí la toma
assert.ok(!libres('corte', 200).includes('11:00'));
assert.ok(!libres('corte', 200).includes('13:30'));   // 9:00 + 6 h termina a las 15:00: lo rompería
assert.ok(libres('corte', 200).includes('15:30'));
assert.ok(libres('color', 200).includes('09:00'));
assert.ok(!libres('color', 200).includes('16:00'));   // ya no cabe antes del cierre
assert.ok(libres('maquillaje', 200).includes('10:00'));   // prioritario

// Liberación progresiva: cada nivel guarda un trabajo más corto, y dentro de 48 h queda libre
assert.ok(!libres('retoque', 200).includes('10:00'));   // 2.5 h: guardada para 6 h
assert.ok(!libres('retoque', 100).includes('10:00'));   // 3–7 días: guardada para 4 h
assert.ok(libres('retoque', 60).includes('10:00'));     // 48–72 h: guardada para 2 h y este ya dura más
assert.ok(!libres('corte', 60).includes('10:00'));      // el corte sigue esperando
assert.ok(libres('corte', 40).includes('10:00'));       // menos de 48 h

// Oportunidad: si el color ya no cabe esa mañana, el hueco que queda no se desperdicia
assert.ok(libres('corte', 200, [cita('11:00', 'retoque')]).includes('09:00'));
// Una protección más larga que el catálogo no se apaga sola: se guarda para lo más largo que existe
assert.ok(!libres('corte', 200, [], { ...config, proteccion: { desde: '09:00', hasta: '13:00', niveles: [{ masDeHoras: 168, horas: 12 }] } }).includes('10:00'));
// Sin protección, se ofrece
assert.ok(libres('corte', 200, [], { ...config, proteccion: null }).includes('10:00'));

// Preparación: 20 min entre clientas y también antes de cerrar (90 min: a más tardar 18:00, cierra 20:00)
assert.ok(libres('corte', 40, [cita('10:00')]).includes('11:30') === false);
assert.ok(libres('corte', 40, [cita('10:00')]).includes('12:00'));
assert.ok(libres('corte', 40).includes('18:00') && !libres('corte', 40).includes('18:30'));

// Comida: no se ofrece lo que quita el último hueco entre 13 y 15. El proceso de un color cuenta como libre
const sinHueco = [cita('11:30'), cita('15:00')];   // libre 13:20–15:00: un corte ahí no deja 30 min
assert.ok(!libres('corte', 40, sinHueco).includes('13:30'));
// Color de 9:00: activo hasta 13:10, proceso hasta 14:00 (ahí come); empezar a las 10:00 deja el proceso en 14:10–15:00: también
assert.deepEqual(choques({ ...cita('09:00', 'color'), id: 'c' }, [], servicios, config, ahoraA(200)), []);
// Si ningún inicio deja comer, se ofrece igual (Cristina decide y lo ve al asignar)
const largo = [{ id: 'cinco', duracion: 420 }];
assert.ok(horariosLibres({ fecha: lunes, servicioId: 'cinco', personas, citas: [], servicios: largo, config, ahora: ahoraA(200) }).length > 0);

// Una solicitud no ocupa nada; la misma cita con hora sí
assert.ok(libera({ estado: 'solicitud' }));
assert.ok(libres('corte', 40, [{ ...cita('10:00', 'corte', 'solicitud'), hora: '' }]).includes('10:00'));
assert.ok(!libres('corte', 40, [cita('10:00', 'corte', 'pendiente')]).includes('10:00'));

// Franjas
assert.deepEqual(['09:00', '12:59', '13:00', '16:00', '19:00'].map(franjaDe), ['manana', 'manana', 'mediodia', 'tarde', 'tarde']);
assert.deepEqual(franjasLibres(['13:30', '17:00']), ['mediodia', 'tarde']);

// Sugerencias: respeta la preferencia, explica por qué y da opciones separadas
const base = { servicios, personas, config, ahora: ahoraA(200) };
let s = sugerirHorarios({ ...base, preferencias: [{ fecha: lunes, franja: 'tarde' }], servicioId: 'corte', citas: [] });
assert.equal(s.length, 3);
assert.ok(s.slice(0, 2).every(x => x.motivos.includes('Su primera opción') && franjaDe(x.hora) === 'tarde'));
assert.ok(s[2].avisos.includes('Fuera de la franja que pidió'));   // la tarde solo da para dos opciones separadas
// El color se sugiere temprano, y un corte de mañana sale avisado (Cristina puede saltarse la regla)
s = sugerirHorarios({ ...base, preferencias: [{ fecha: lunes, franja: 'cualquiera' }], servicioId: 'color', citas: [] });
assert.equal(s[0].hora, '09:00');
assert.ok(s[0].motivos.includes('Aprovecha la mañana'));
s = sugerirHorarios({ ...base, preferencias: [{ fecha: lunes, franja: 'manana' }], servicioId: 'corte', citas: [] });
assert.ok(s[0].avisos.includes('Ocupa la mañana que se guarda para trabajos largos'));
// Pegar con otra cita gana a dejar un hueco
s = sugerirHorarios({ ...base, preferencias: [{ fecha: lunes, franja: 'tarde' }], servicioId: 'corte', citas: [cita('16:00')] });
assert.ok(s[0].motivos.includes('Junto a otra cita'));

// Avisos en CB Control
assert.ok(choques(cita('10:00'), [], servicios, config, ahoraA(200)).includes('Ocupa la mañana que se guarda para trabajos largos'));
assert.deepEqual(choques(cita('10:00'), [], servicios, config, ahoraA(40)), []);
assert.ok(choques({ ...cita('13:30'), id: 'nueva' }, sinHueco, servicios, config, ahoraA(40)).includes('No deja hueco para comer'));

console.log('agenda ok');
