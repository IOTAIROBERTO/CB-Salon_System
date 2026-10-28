import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, FileSignature, Smartphone, Trash2 } from 'lucide-react';
import { db, type Consentimiento } from '../../db/db';
import { useRolSalon } from '../../db/salon';
import { verFirmado, vigente } from '../../db/firma';
import { resizeImage, validateImageFile } from '../../utils/imageUtils';
import PedirFirma from './PedirFirma';

const REDES: Record<Consentimiento['redes'], string> = {
  con_rostro: 'Sí, con rostro', sin_rostro: 'Sí, sin rostro', no: 'No'
};

/** Consentimientos de la clienta: firmados en la app (enlace personal) o en papel (foto del formato), y permisos de fotos */
export default function ConsentimientosCliente({ clienteId }: { clienteId: string }) {
  const lista = useLiveQuery(() => db.consentimientos.where('clienteId').equals(clienteId).reverse().sortBy('fecha'), [clienteId]) || [];
  const cliente = useLiveQuery(() => db.clientes.get(clienteId), [clienteId]);
  const [pidiendo, setPidiendo] = useState<{ citaId?: string } | null>(null);
  const firmados = lista.filter(c => c.estado !== 'pendiente');
  const pendientes = lista.filter(c => c.estado === 'pendiente');
  const [fotos, setFotos] = useState(true);
  const [redes, setRedes] = useState<Consentimiento['redes']>('sin_rostro');
  const [imagen, setImagen] = useState<string>();
  const [guardando, setGuardando] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const esDuena = useRolSalon() === 'duena';

  const elegir = async (archivo?: File) => {
    if (!archivo) return;
    const v = validateImageFile(archivo);
    if (!v.isValid) { alert(v.error); return; }
    // Legible para releer el formato, ligero para sincronizar (~200 KB)
    setImagen(await resizeImage(archivo, { maxWidth: 1400, maxHeight: 1400, quality: 0.6 }));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await db.consentimientos.add({ id: `con_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, clienteId, fecha: new Date().toISOString(), imagen, fotos, redes });
      setImagen(undefined);
    } finally {
      setGuardando(false);
    }
  };

  const ver = (src: string) => {
    const w = window.open('', '_blank');
    if (!w || !src.startsWith('data:image/')) return;
    w.document.title = 'Consentimiento';
    const img = w.document.createElement('img');
    img.src = src;
    img.style.maxWidth = '100%';
    w.document.body.appendChild(img);
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><FileSignature size={16} /> Consentimientos</h4>
      {firmados.length === 0 && <p className="text-xs text-gray-500">Sin consentimiento firmado. Sin permiso, sus fotos no se publican.</p>}
      {firmados.map(c => (
        <div key={c.id} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded p-2">
          <span>
            {new Date(c.fecha).toLocaleDateString('es-MX')} · {c.firma ? 'En la app' : 'En papel'} · Fotos: {c.fotos ? 'Sí' : 'No'} · Redes: {REDES[c.redes]}
            {c.salud?.length ? <span className="text-amber-700"> · Marcó {c.salud.length} punto(s) de salud</span> : null}
          </span>
          <span className="flex gap-1">
            {c.imagen && <button type="button" onClick={() => ver(c.imagen!)} className="text-purple-700 hover:underline">Ver formato</button>}
            {c.firma && <button type="button" onClick={() => verFirmado(c)} className="text-purple-700 hover:underline">Ver formato</button>}
            {esDuena && <button type="button" onClick={() => confirm('¿Borrar este consentimiento?') && db.consentimientos.delete(c.id)} className="text-red-600 p-1" title="Borrar"><Trash2 size={12} /></button>}
          </span>
        </div>
      ))}
      {pendientes.map(c => (
        <div key={c.id} className="flex items-center justify-between gap-2 text-xs bg-amber-50 rounded p-2">
          <span>{vigente(c) ? `Por firmar en la app · vence ${new Date(c.vence!).toLocaleDateString('es-MX')}` : 'Enlace vencido sin firmar'}</span>
          <span className="flex gap-1">
            <button type="button" onClick={() => setPidiendo({ citaId: c.citaId })} className="px-2 text-purple-700 hover:underline">{vigente(c) ? 'Enlace' : 'Nuevo enlace'}</button>
            {esDuena && <button type="button" onClick={() => db.consentimientos.delete(c.id)} className="text-red-600 p-1" title="Quitar"><Trash2 size={12} /></button>}
          </span>
        </div>
      ))}

      <button type="button" onClick={() => setPidiendo({})} className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white rounded-lg py-2 text-sm hover:bg-purple-700">
        <Smartphone size={16} /> Pedir firma en la app (WhatsApp o QR)
      </button>
      {pidiendo && cliente && <PedirFirma clienteId={clienteId} citaId={pidiendo.citaId} nombre={cliente.nombre} telefono={cliente.telefono} onClose={() => setPidiendo(null)} />}

      <div className="bg-purple-50 rounded-lg p-3 space-y-2 text-sm">
        <p className="font-medium text-gray-800">Sin celular: registrar el formato firmado en papel</p>
        <label className="flex items-center gap-2"><input type="checkbox" checked={fotos} onChange={e => setFotos(e.target.checked)} /> Autoriza fotos del antes y el después</label>
        <label className="block">Publicar en redes:
          <select value={redes} onChange={e => setRedes(e.target.value as Consentimiento['redes'])} className="ml-2 border rounded px-2 py-1">
            {Object.entries(REDES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => input.current?.click()} className="border border-purple-300 rounded px-3 py-1 flex items-center gap-1 hover:bg-white">
            <Camera size={14} /> {imagen ? 'Cambiar foto del formato' : 'Foto del formato firmado'}
          </button>
          <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { elegir(e.target.files?.[0]); e.target.value = ''; }} />
          {imagen && <img src={imagen} alt="Formato" className="h-12 rounded border" />}
          <button type="button" onClick={guardar} disabled={guardando} className="ml-auto bg-purple-600 text-white rounded px-3 py-1 hover:bg-purple-700 disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
}
