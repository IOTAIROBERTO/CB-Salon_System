import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, X, Phone, Mail, Globe, MessageCircle, Search, Star, ShoppingCart, Edit, Trash2 } from 'lucide-react';
import { db, type Proveedor } from '../../db/db';
import { nuevoProveedor, guardarProveedor, vincularProducto, darDeAltaDesdeProductos } from '../../db/proveedores';
import { masComprados, totalComprado, proveedoresSinAlta, haceUnAnio } from '../../utils/proveedores';
import { normalizar } from '../../utils/texto';
import { enlaceWhatsApp } from '../../utils/lealtad';
import { formatCurrency } from '../../utils/financialUtils';

const campo = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500';

export default function ProveedoresTab({ onRegistrarCompra }: { onRegistrarCompra: (proveedorId?: string) => void }) {
  const proveedores = useLiveQuery(() => db.proveedores.toArray()) || [];
  const inventario = useLiveQuery(() => db.inventario.toArray()) || [];
  const compras = useLiveQuery(() => db.compras.toArray()) || [];
  const [busqueda, setBusqueda] = useState('');
  const [verInactivos, setVerInactivos] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  const desde = haceUnAnio();
  const sinAlta = proveedoresSinAlta(inventario, proveedores);
  const lista = proveedores
    .filter(p => (verInactivos || p.activo) && (!busqueda || normalizar(`${p.nombre} ${p.queVende} ${p.contacto}`).includes(normalizar(busqueda))))
    .sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre));
  const abierto = proveedores.find(p => p.id === abiertoId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar proveedor, contacto o qué vende..." className={`${campo} pl-9`} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={verInactivos} onChange={e => setVerInactivos(e.target.checked)} /> Ver inactivos
        </label>
        <button onClick={() => setEditando(nuevoProveedor())} className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
          <Plus size={18} /> Nuevo proveedor
        </button>
      </div>

      {sinAlta.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <p className="text-amber-800 mb-2">Proveedores escritos en tus productos que aún no están dados de alta:</p>
          <div className="flex flex-wrap gap-2">
            {sinAlta.map(s => (
              <button key={s.nombre} onClick={() => darDeAltaDesdeProductos(s.nombre)} className="bg-white border border-amber-300 rounded-full px-3 py-1 hover:bg-amber-100">
                {s.nombre} · {s.productos} producto{s.productos === 1 ? '' : 's'} · <strong>Dar de alta</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {lista.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-lg">Aún no hay proveedores. Da de alta el primero con «Nuevo proveedor».</div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map(p => {
            const productos = inventario.filter(x => x.proveedorId === p.id);
            const ultima = compras.filter(c => c.proveedorId === p.id).map(c => c.fecha).sort().pop();
            return (
              <button key={p.id} onClick={() => setAbiertoId(p.id)} className={`text-left bg-white rounded-lg shadow p-4 hover:shadow-md ${p.activo ? '' : 'opacity-60'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">{p.nombre}</div>
                    {p.queVende && <div className="text-sm text-gray-500">{p.queVende}</div>}
                  </div>
                  {p.calificacion ? <span className="flex items-center gap-1 text-sm text-purple-700"><Star size={14} />{p.calificacion}/10</span> : null}
                </div>
                <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                  {p.contacto && <div>{p.contacto}</div>}
                  {p.telefono && <div>{p.telefono}</div>}
                  {p.diasCredito ? <div>Crédito: {p.diasCredito} días</div> : null}
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between">
                  <span>{productos.length} productos</span>
                  <span>{formatCurrency(totalComprado(compras, p.id, desde))} en 12 meses</span>
                </div>
                {ultima && <div className="text-xs text-gray-400 mt-1">Última compra: {ultima}</div>}
              </button>
            );
          })}
        </div>
      )}

      {abierto && (
        <DetalleProveedor
          proveedor={abierto}
          onClose={() => setAbiertoId(null)}
          onEditar={() => setEditando(abierto)}
          onRegistrarCompra={() => onRegistrarCompra(abierto.id)}
        />
      )}
      {editando && <FormProveedor inicial={editando} onClose={() => setEditando(null)} />}
    </div>
  );
}

function DetalleProveedor({ proveedor: p, onClose, onEditar, onRegistrarCompra }: { proveedor: Proveedor; onClose: () => void; onEditar: () => void; onRegistrarCompra: () => void }) {
  const inventario = useLiveQuery(() => db.inventario.toArray()) || [];
  const compras = (useLiveQuery(() => db.compras.where('proveedorId').equals(p.id).toArray(), [p.id]) || [])
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const [agregar, setAgregar] = useState('');

  const suyos = inventario.filter(x => x.proveedorId === p.id).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const otros = inventario.filter(x => x.proveedorId !== p.id).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const top = masComprados(compras, p.id, haceUnAnio()).slice(0, 8);
  const wa = enlaceWhatsApp(p.telefono, `Hola ${p.contacto || ''}, le escribo de Cristina Borquez Beauty Salon.`);

  const eliminar = async () => {
    if (suyos.length || compras.length) {
      alert('Tiene productos o compras registradas: mejor desactívalo para conservar el historial.');
      return;
    }
    if (confirm(`¿Eliminar a ${p.nombre}?`)) { await db.proveedores.delete(p.id); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label={p.nombre}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start gap-3">
          <div>
            <h2 className="text-2xl text-gray-900">{p.nombre}{!p.activo && <span className="ml-2 text-sm text-gray-500">(inactivo)</span>}</h2>
            {p.queVende && <p className="text-sm text-gray-500">{p.queVende}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {p.contacto && <div><span className="text-gray-500">Contacto: </span>{p.contacto}</div>}
            {p.telefono && <a className="flex items-center gap-2 text-purple-700" href={`tel:${p.telefono}`}><Phone size={14} />{p.telefono}</a>}
            {wa && <a className="flex items-center gap-2 text-purple-700" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={14} />WhatsApp</a>}
            {p.email && <a className="flex items-center gap-2 text-purple-700" href={`mailto:${p.email}`}><Mail size={14} />{p.email}</a>}
            {p.web && <a className="flex items-center gap-2 text-purple-700" href={p.web.startsWith('http') ? p.web : `https://${p.web}`} target="_blank" rel="noreferrer"><Globe size={14} />{p.web}</a>}
            <div><span className="text-gray-500">Crédito: </span>{p.diasCredito ? `${p.diasCredito} días` : 'Contado'}</div>
            {p.calificacion ? <div><span className="text-gray-500">Calificación: </span>{p.calificacion}/10</div> : null}
            {p.notas && <div className="sm:col-span-2 text-gray-600"><span className="text-gray-500">Notas: </span>{p.notas}</div>}
          </div>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Productos que le compro ({suyos.length})</h3>
            <div className="border rounded-lg divide-y">
              {suyos.map(x => (
                <div key={x.id} className="flex justify-between items-center px-3 py-2 text-sm">
                  <span>{x.nombre} <span className="text-gray-500">· stock {x.cantidad} · costo {formatCurrency(x.costo || 0)}</span></span>
                  <button onClick={() => vincularProducto(x.id, null)} className="text-gray-400 hover:text-red-600" title="Quitar de este proveedor" aria-label={`Quitar ${x.nombre}`}><X size={16} /></button>
                </div>
              ))}
              {suyos.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Sin productos ligados todavía.</div>}
            </div>
            <div className="flex gap-2 mt-2">
              <select value={agregar} onChange={e => setAgregar(e.target.value)} className={campo}>
                <option value="">Agregar producto del inventario...</option>
                {otros.map(x => <option key={x.id} value={x.id}>{x.nombre}{x.proveedor ? ` (hoy: ${x.proveedor})` : ''}</option>)}
              </select>
              <button disabled={!agregar} onClick={async () => { await vincularProducto(agregar, p); setAgregar(''); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">Agregar</button>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Lo que más le compro (12 meses)</h3>
            {top.length ? (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-1">Producto</th><th className="text-right">Piezas</th><th className="text-right">Monto</th></tr></thead>
                <tbody>{top.map(t => <tr key={t.productoId} className="border-t"><td className="py-1">{t.nombre}</td><td className="text-right">{t.cantidad}</td><td className="text-right">{formatCurrency(t.total)}</td></tr>)}</tbody>
              </table>
            ) : <p className="text-sm text-gray-500">Se calcula con las compras que registres.</p>}
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Compras ({compras.length})</h3>
            <div className="border rounded-lg divide-y text-sm">
              {compras.slice(0, 10).map(c => (
                <div key={c.id} className="flex justify-between px-3 py-2">
                  <span>{c.fecha}{c.folio ? ` · folio ${c.folio}` : ''} <span className="text-gray-500">· {c.items.map(i => `${i.nombre} ×${i.cantidad}`).join(', ')}</span></span>
                  <span className="font-medium">{formatCurrency(c.total)}</span>
                </div>
              ))}
              {compras.length === 0 && <div className="px-3 py-2 text-gray-500">Sin compras registradas.</div>}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-3 flex flex-wrap gap-2 justify-end">
          <button onClick={eliminar} className="mr-auto flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"><Trash2 size={14} /> Eliminar</button>
          <button onClick={() => guardarProveedor({ ...p, activo: !p.activo })} className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100">{p.activo ? 'Desactivar' : 'Activar'}</button>
          <button onClick={onEditar} className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100"><Edit size={16} /> Editar</button>
          <button onClick={onRegistrarCompra} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><ShoppingCart size={16} /> Registrar compra</button>
        </div>
      </div>
    </div>
  );
}

function FormProveedor({ inicial, onClose }: { inicial: Proveedor; onClose: () => void }) {
  const [f, setF] = useState<Proveedor>(inicial);
  const set = (k: keyof Proveedor, v: any) => setF({ ...f, [k]: v });
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nombre.trim()) return alert('El nombre es obligatorio');
    await guardarProveedor(f);
    onClose();
  };
  const texto = (k: keyof Proveedor, label: string, ph = '', type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(f[k] as any) ?? ''} placeholder={ph} className={campo}
        onChange={e => set(k, type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)} />
    </div>
  );
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]" role="dialog" aria-modal="true" aria-label="Proveedor">
      <form onSubmit={guardar} className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl text-gray-900">{inicial.nombre ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">{texto('nombre', 'Nombre *', 'Ej.: Salerm')}</div>
          <div className="sm:col-span-2">{texto('queVende', 'Qué vende', 'Ej.: tintes, oxidantes, tratamientos')}</div>
          {texto('contacto', 'Persona de contacto', 'Nombre del agente')}
          {texto('telefono', 'Teléfono / WhatsApp', '662 000 0000', 'tel')}
          {texto('email', 'Correo', '', 'email')}
          {texto('web', 'Sitio o Instagram')}
          {texto('diasCredito', 'Días de crédito', '0 = contado', 'number')}
          {texto('calificacion', 'Calificación (1 a 10)', '', 'number')}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={f.notas ?? ''} onChange={e => set('notas', e.target.value)} placeholder="Pedido mínimo, días de entrega, pedir factura..." className={`${campo} h-20 resize-none`} />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border-2 border-gray-300 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Guardar</button>
        </div>
      </form>
    </div>
  );
}
