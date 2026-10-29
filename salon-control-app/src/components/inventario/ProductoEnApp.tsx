import { useState } from 'react';
import { X } from 'lucide-react';
import { db, type Producto } from '../../db/db';
import { resizeImage } from '../../utils/imageUtils';

/** Venta del producto en la app de clientas («Mi carrito»): si se muestra, lo que lee la clienta y su foto */
export default function ProductoEnApp({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  const [enApp, setEnApp] = useState(!!producto.enApp);
  const [descripcion, setDescripcion] = useState(producto.descripcionApp || '');
  const [foto, setFoto] = useState(producto.foto || '');
  const [error, setError] = useState('');

  const elegirFoto = async (archivo?: File) => {
    if (!archivo) return;
    setError('');
    try { setFoto(await resizeImage(archivo, { maxWidth: 480, maxHeight: 480, quality: 0.75, format: 'jpeg' })); }
    catch { setError('No se pudo leer la foto. Prueba con otra (JPG o PNG).'); }
  };
  const guardar = async () => {
    await db.inventario.update(producto.id, { enApp, descripcionApp: descripcion.trim() || undefined, foto: foto || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-marca-dorado-prof">En la app de clientas</p>
            <h3 className="text-xl text-gray-900">{producto.nombre}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input type="checkbox" checked={enApp} onChange={e => setEnApp(e.target.checked)} />
          Se vende en la app (las clientas lo ven y lo apartan; solo se ofrece lo disponible)
        </label>
        <label className="block text-sm text-gray-700">Lo que lee la clienta
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Para qué sirve y cómo se usa"
            className="mt-1 w-full rounded border p-2 text-sm" />
        </label>
        <div className="space-y-2 text-sm text-gray-700">
          <span>Foto</span>
          {foto && <img src={foto} alt="" className="h-32 w-32 rounded object-cover" />}
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded border px-3 py-2 hover:bg-gray-50">
              {foto ? 'Cambiar foto' : 'Elegir foto'}
              <input type="file" accept="image/*" className="hidden" onChange={e => { elegirFoto(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {foto && <button type="button" onClick={() => setFoto('')} className="text-gray-500 hover:underline">Quitar foto</button>}
          </div>
          {error && <p className="text-red-700">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded border py-2 text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} className="flex-1 rounded bg-marca-negro py-2 text-sm text-white hover:bg-gray-800">Guardar</button>
        </div>
      </div>
    </div>
  );
}
