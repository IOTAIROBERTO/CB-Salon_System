// Dexie Cloud falso para probar la API en local (npm run dexie:falso, puerto 8799) junto con npm run api:local.
// Datos en memoria: una clienta, una cita y un consentimiento por firmar en /#/firmar/firma_00000000000000000000000000000001
// La cita se ve, cambia y cancela en /#/cita/c1.00000000000000000000000000000001 («Mi cita»)
import { createServer } from 'node:http';

const pronto = new Date(Date.now() + 7 * 86400000).toISOString();
const tablas = {
  configuracion: [{ id: 'settings', realmId: 'rlm-local' }],
  clientes: [{ id: 'k1', nombre: 'Laura Pérez', telefono: '6621234567', realmId: 'rlm-local' }],
  servicios: [
    { id: 's1', nombre: 'Babylights', categoria: 'color', precioSugerido: 2500, anticipoSugerido: 300, duracion: 180 },
    { id: 's2', nombre: 'Balayage', categoria: 'color', precioSugerido: 2800, anticipoSugerido: 300, duracion: 240 },
    { id: 's3', nombre: 'Retoque de raíz', categoria: 'color', precioSugerido: 900, duracion: 90 },
    { id: 's4', nombre: 'Corte de cabello', categoria: 'corte', precioSugerido: 500, anticipoSugerido: 150, duracion: 60 },
    { id: 's5', nombre: 'Maquillaje social', categoria: 'maquillaje', precioSugerido: 1200, anticipoSugerido: 300, duracion: 75 },
    { id: 's6', nombre: 'Peinado', categoria: 'peinado', precioSugerido: 800, duracion: 60 }
  ],
  citas: [{ id: 'c1', clienteId: 'k1', servicioId: 's1', fecha: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), hora: '10:00', estado: 'confirmada',
    montoAnticipo: 300, anticipoConfirmado: true, precioAcordado: 2700, formaAnticipo: 'transferencia', enlace: '00000000000000000000000000000001', realmId: 'rlm-local' }],
  consentimientos: [{ id: 'firma_00000000000000000000000000000001', clienteId: 'k1', citaId: 'c1', estado: 'pendiente', vence: pronto, fotos: false, redes: 'no', fecha: new Date().toISOString(), realmId: 'rlm-local' }],
  empleados: [], empleadoEvents: [], avisos: [], ventas: [], movimientosSaldo: []
};

for (const filas of Object.values(tablas)) for (const f of filas) f.realmId ??= 'rlm-local';   // la API solo lee el realm del salón

createServer((req, res) => {
  const url = new URL(req.url, 'http://local');
  const enviar = (d, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(d === null ? '' : JSON.stringify(d)); };
  let cuerpo = '';
  req.on('data', c => (cuerpo += c)).on('end', () => {
    if (url.pathname === '/token') return enviar({ accessToken: 'local' });
    const [, , tabla, id] = url.pathname.split('/');
    const filas = (tablas[tabla] ??= []);
    if (req.method === 'POST') {
      for (const o of JSON.parse(cuerpo)) { tablas[tabla] = tablas[tabla].filter(f => f.id !== o.id).concat(o); console.log('guardado', tabla, o.id, o.estado || ''); }
      return enviar(null);
    }
    if (id) { const f = filas.find(x => x.id === decodeURIComponent(id)); return f ? enviar(f) : enviar(null, 404); }
    enviar(filas.filter(f => [...url.searchParams].every(([k, v]) => String(f[k]) === v)));
  });
}).listen(8799, () => console.log('Dexie falso en http://127.0.0.1:8799'));
