import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, UserPlus, X } from 'lucide-react';
import { db } from '../../db/db';
import { generateClienteId } from '../../utils/clientesUtils';
import { fechaLocalISO } from '../../utils/dateValidation';
import { normalizar, telefono10 } from '../../utils/texto';
import { NOMBRE_CIRCULO } from '../../utils/lealtad';
import { confirmar } from '../Confirmar';

/** Elegir clienta por nombre o teléfono y, si no existe, darla de alta ahí mismo (queda en el Club). Lo usan Nueva cita
 *  y Nueva venta, para no tener que salir a Clientas cuando llega alguien nuevo. */
export default function ElegirClienta({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const [busca, setBusca] = useState('');
  const [nueva, setNueva] = useState<{ nombre: string; telefono: string } | null>(null);
  const [error, setError] = useState('');
  const elegida = clientes.find(c => c.id === value);

  const q = normalizar(busca.trim()), digitos = busca.replace(/\D/g, '');
  const encontradas = q.length < 2 ? [] : clientes.filter(c => c.activo !== false &&
    (digitos.length >= 3 ? telefono10(c.telefono).includes(digitos) : normalizar(c.nombre).includes(q))).slice(0, 6);

  const empezarNueva = () => { setError(''); setNueva(digitos.length >= 7 ? { nombre: '', telefono: digitos } : { nombre: busca.trim(), telefono: '' }); };
  const guardarNueva = async () => {
    if (!nueva) return;
    const nombre = nueva.nombre.trim().replace(/\s+/g, ' '), tel = telefono10(nueva.telefono);
    if (nombre.length < 3 || tel.length !== 10) return setError('Escribe nombre completo y teléfono de 10 dígitos.');
    const repetida = clientes.find(c => c.activo !== false && (telefono10(c.telefono) === tel || normalizar(c.nombre) === normalizar(nombre)));
    if (repetida && await confirmar(`Ya existe ${repetida.nombre} (${repetida.telefono}). ¿Usar esa ficha en lugar de crear otra?`, { si: 'Usar su ficha', no: 'Crear otra' })) {
      onChange(repetida.id); setNueva(null); setBusca(''); return;
    }
    const id = generateClienteId();
    await db.clientes.add({ id, nombre, telefono: tel, activo: true, fechaRegistro: fechaLocalISO(), origen: 'salon' } as any);
    onChange(id); setNueva(null); setBusca('');
  };

  if (elegida) return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-gray-50 px-3 py-2">
      <span className="min-w-0 text-sm text-gray-900">{elegida.nombre}<span className="block text-xs text-gray-500">{elegida.telefono}</span></span>
      <button type="button" onClick={() => onChange('')} aria-label="Cambiar clienta" className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-100"><X size={16} /></button>
    </div>
  );

  if (nueva) return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-xs text-gray-500">Clienta nueva · queda en el {NOMBRE_CIRCULO}</p>
      <input autoFocus value={nueva.nombre} onChange={e => setNueva({ ...nueva, nombre: e.target.value })} placeholder="Nombre completo" autoComplete="off"
        className="w-full rounded-lg border px-3 py-2" />
      <input value={nueva.telefono} onChange={e => setNueva({ ...nueva, telefono: e.target.value })} placeholder="Teléfono (10 dígitos)" type="tel" inputMode="tel" autoComplete="off"
        className="w-full rounded-lg border px-3 py-2" />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setNueva(null)} className="min-h-[40px] flex-1 rounded-lg border text-sm hover:bg-gray-50">Volver</button>
        <button type="button" onClick={guardarNueva} className="min-h-[40px] flex-1 rounded-lg bg-marca-negro text-sm text-white hover:bg-gray-800">Guardar clienta</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nombre o teléfono" autoComplete="off"
          className="w-full rounded-lg border py-2 pl-9 pr-3" />
      </div>
      {encontradas.map(c => (
        <button key={c.id} type="button" onClick={() => { onChange(c.id); setBusca(''); }}
          className="flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 text-left text-sm hover:bg-gray-50">
          <span className="text-gray-900">{c.nombre}</span><span className="text-xs text-gray-500">{c.telefono}</span>
        </button>
      ))}
      {q.length >= 2 && !encontradas.length && <p className="px-1 text-xs text-gray-500">No hay ninguna clienta así.</p>}
      <button type="button" onClick={empezarNueva} className="flex min-h-[40px] items-center gap-2 px-1 text-sm text-marca-dorado-prof hover:underline">
        <UserPlus size={15} /> {busca.trim() ? `Dar de alta a «${busca.trim()}»` : 'Clienta nueva'}
      </button>
    </div>
  );
}
