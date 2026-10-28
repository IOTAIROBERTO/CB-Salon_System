import { useEffect, useState } from 'react';
import { BellOff, BellRing } from 'lucide-react';
import { db } from '../../db/db';
import { esIphone, estaInstalada } from '../AvisoInstalar';

// Avisos de la campana en este dispositivo aunque CB Control esté cerrada (Web Push). La suscripción se guarda en la
// tabla `suscripciones` y el Worker cb-avisos (app-clientas/avisos) manda cada aviso nuevo a todas. En iPhone pide
// iOS 16.4+ y CB Control instalada en la pantalla de inicio.
// Llave pública VAPID: la misma que VAPID_PUBLICA en app-clientas/avisos/wrangler.toml (la privada es secreto del Worker)
const VAPID_PUBLICA = 'BGoobnbfocVogm_zUv4BuqZsOnqiljCzYKhDacJmH5Sl4uShmZVYPeuDgjVQPwf2pZEQXizmCBLpZs-hqhoYrYk';

const dispositivo = () => esIphone() ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'Computadora';
const idDe = async (endpoint: string) =>
  'push_' + [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint)))]
    .slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');

async function guardar(s: PushSubscription) {
  const id = await idDe(s.endpoint);
  if (await db.suscripciones.get(id)) return;
  const { keys } = s.toJSON();
  await db.suscripciones.put({
    id, endpoint: s.endpoint, p256dh: keys!.p256dh, auth: keys!.auth,
    usuario: db.cloud.currentUser.value.email, dispositivo: dispositivo(), fecha: new Date().toISOString()
  });
}

/** Suscripción push de este navegador (null si no tiene) */
export const suscripcionActual = async () =>
  (await navigator.serviceWorker?.getRegistration())?.pushManager?.getSubscription() ?? null;

export default function AvisosCelular() {
  const soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const [sub, setSub] = useState<PushSubscription | null | undefined>();   // undefined: revisando
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!soporta) return;
    // Si la fila se perdió (o la otra cuenta la borró), se repone sola al abrir la campana
    suscripcionActual().then(s => { setSub(s); if (s) guardar(s).catch(() => {}); }).catch(() => setSub(null));
  }, [soporta]);

  const accion = (f: () => Promise<void>) => async () => {
    setOcupado(true); setMensaje('');
    try { await f(); } catch (e) { setMensaje(`No se pudo: ${(e as Error).message}`); } finally { setOcupado(false); }
  };

  const activar = accion(async () => {
    if (await Notification.requestPermission() !== 'granted') {
      setMensaje('Sin permiso de notificaciones: actívalo en los permisos del sitio (candado junto a la dirección) o en Ajustes del teléfono.');
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) throw new Error('recarga la página e inténtalo otra vez');
    const s = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: Uint8Array.from(atob(VAPID_PUBLICA.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    });
    await guardar(s);
    setSub(s);
  });

  const quitar = accion(async () => {
    if (!sub) return;
    await db.suscripciones.delete(await idDe(sub.endpoint));
    await sub.unsubscribe();
    setSub(null);
  });

  // Prueba por el camino real: un aviso en la campana que el Worker manda a todos los dispositivos suscritos
  const probar = accion(async () => {
    await db.avisos.add({
      id: `avi_prueba_${Date.now()}`, fecha: new Date().toISOString(), tipo: 'sistema', leido: false,
      titulo: 'Aviso de prueba', detalle: `Activado en ${dispositivo()} por ${db.cloud.currentUser.value.email || 'el salón'}. Si llegó con CB Control cerrada, los avisos funcionan.`
    });
    setMensaje('Listo. Cierra CB Control: en menos de un minuto llega «Aviso de prueba» a los dispositivos con avisos activos.');
  });

  const boton = 'flex min-h-[40px] items-center gap-1.5 rounded-md px-3 text-xs';
  let contenido;
  if (!soporta) {
    contenido = esIphone() && !estaInstalada()
      ? <p>En iPhone (iOS 16.4 o más reciente) los avisos llegan con CB Control instalada: en Safari, Compartir → <b>Agregar a pantalla de inicio</b>, ábrela desde su ícono y actívalos aquí.</p>
      : <p>Este navegador no recibe avisos con la app cerrada. Usa Chrome o Safari.</p>;
  } else if (sub === undefined) {
    return null;
  } else if (sub) {
    contenido = (
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto flex items-center gap-1.5 text-green-700"><BellRing size={14} /> Avisos activos en este dispositivo</span>
        <button disabled={ocupado} onClick={probar} className={`${boton} border bg-white text-gray-700 hover:bg-gray-50`}>Probar</button>
        <button disabled={ocupado} onClick={quitar} className={`${boton} text-gray-500 hover:underline`}><BellOff size={13} /> Quitar</button>
      </div>
    );
  } else {
    contenido = (
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto">Recibe aquí los avisos aunque CB Control esté cerrada.</span>
        <button disabled={ocupado} onClick={activar} className={`${boton} bg-marca-negro text-white hover:bg-gray-800`}><BellRing size={13} /> Activar avisos</button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 border-b bg-gray-50 px-5 py-3 text-xs text-gray-600">
      {contenido}
      {mensaje && <p className="text-gray-700">{mensaje}</p>}
    </div>
  );
}
