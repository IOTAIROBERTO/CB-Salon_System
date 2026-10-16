// Check: npx esbuild scripts/proveedores.check.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';
import { masComprados, totalComprado, proveedorPorNombre, proveedoresSinAlta } from '../src/utils/proveedores';
import { normalizar } from '../src/utils/texto';

const compras = [
  { proveedorId: 'salerm', fecha: '2026-09-01', items: [{ productoId: 'p1', nombre: 'Tinte', cantidad: 10, costoUnitario: 80 }, { productoId: 'p2', nombre: 'Oxidante', cantidad: 2, costoUnitario: 150 }] },
  { proveedorId: 'salerm', fecha: '2026-10-01', items: [{ productoId: 'p2', nombre: 'Oxidante', cantidad: 4, costoUnitario: 150 }] },
  { proveedorId: 'salerm', fecha: '2025-01-01', items: [{ productoId: 'p3', nombre: 'Viejo', cantidad: 99, costoUnitario: 99 }] },
  { proveedorId: 'probell', fecha: '2026-10-02', items: [{ productoId: 'p1', nombre: 'Tinte', cantidad: 1, costoUnitario: 70 }] }
];

const top = masComprados(compras, 'salerm', '2026-01-01');
assert.deepEqual(top.map(p => [p.productoId, p.cantidad, p.total]), [['p2', 6, 900], ['p1', 10, 800]]);
assert.equal(totalComprado(compras, 'salerm', '2026-01-01'), 1700);
assert.equal(totalComprado(compras, 'probell'), 70);

const provs = [{ id: 'salerm', nombre: 'Salerm' }];
assert.equal(proveedorPorNombre(provs, '  SALÉRM ')?.id, 'salerm');
assert.equal(normalizar(' Don Juán '), 'don juan');
assert.deepEqual(
  proveedoresSinAlta([{ proveedor: 'salerm' }, { proveedor: 'Probell' }, { proveedor: 'probell ' }, { proveedor: '' }, { proveedor: 'Alfaparf', proveedorId: 'x' }], provs),
  [{ nombre: 'Probell', productos: 2 }]
);
console.log('proveedores: ok');
