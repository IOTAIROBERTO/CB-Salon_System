import { useObservable } from 'dexie-react-hooks';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { db } from '../../db/db';

// Si los cambios de este dispositivo ya subieron a la nube (Dexie Cloud). La app de clientas, la API y el Worker leen
// la nube: lo que no ha subido no existe para ellos. Antes una falla de sincronización pasaba en silencio.
export default function EstadoSync() {
  const estado = useObservable(db.cloud.syncState);
  if (!estado) return null;
  const { phase, status, error } = estado;
  const reintentar = () => db.cloud.sync({ wait: false, purpose: 'push' }).catch(() => { /* el estado mostrará el error */ });

  if (phase === 'error' || status === 'error')
    return (
      <button onClick={reintentar} title={`No se pudo sincronizar: ${error?.message || 'error desconocido'}. Toca para reintentar.`}
        className="flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700">
        <CloudOff size={14} /> Sin sincronizar
      </button>
    );
  if (phase === 'offline' || status === 'offline')
    return <span title="Sin internet: tus cambios se guardan aquí y suben al volver la conexión" className="flex items-center gap-1 rounded-md bg-gray-600 px-2 py-1 text-[11px] text-white"><CloudOff size={14} /> Sin internet</span>;
  if (phase === 'in-sync')
    return <span title="Todo está en la nube: la app de clientas ya ve tus cambios" className="p-1 text-green-400"><Cloud size={16} /></span>;
  return <span title="Subiendo cambios a la nube…" className="p-1 text-amber-300"><RefreshCw size={15} className="animate-spin" /></span>;
}
