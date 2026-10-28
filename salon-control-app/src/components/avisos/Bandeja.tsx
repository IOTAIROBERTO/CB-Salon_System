import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, CalendarCheck, Check, Crown, MessageCircle, ShoppingBag, X } from 'lucide-react';
import { db, type Aviso } from '../../db/db';
import { enlaceWhatsApp } from '../../utils/lealtad';
import { fechaLocalISO } from '../../utils/dateValidation';

// Bandeja del salón: lo que las clientas hacen solas en la app (citas, altas al Club) llega aquí en tiempo real
// por Dexie Cloud. Con la ventana abierta también sale una notificación del navegador. Arriba, fija, la lista de
// citas de la app que siguen sin confirmar (no vencen solas: se quedan aquí hasta que alguien las confirme o cancele).
const ICONO = { cita: CalendarCheck, club: Crown, pedido: ShoppingBag, sistema: Bell } as const;

// Compartido entre las campanas (barra lateral, cajón y encabezado móvil): cada aviso notifica una sola vez
let vistos: Set<string> | null = null;

const hace = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  if (min < 24 * 60) return `hace ${Math.round(min / 60)} h`;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

export default function Bandeja({ oscuro = true }: { oscuro?: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const avisos = useLiveQuery(() => db.avisos.orderBy('fecha').reverse().limit(60).toArray()) || [];
  const citas = useLiveQuery(() => db.citas.where('estado').equals('pendiente').toArray()) || [];
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const servicios = useLiveQuery(() => db.servicios.toArray()) || [];
  const sinLeer = avisos.filter(a => !a.leido).length;
  const hoy = fechaLocalISO();
  const porConfirmar = citas.filter(c => c.origen && c.fecha >= hoy).sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));

  // Notificación del navegador por cada aviso nuevo que llega con la ventana abierta
  useEffect(() => {
    if (!avisos.length && vistos === null) return;
    if (vistos === null) { vistos = new Set(avisos.map(a => a.id)); return; }   // lo que ya había al abrir no suena
    for (const a of avisos) {
      if (vistos.has(a.id)) continue;
      vistos.add(a.id);
      if (!a.leido && 'Notification' in window && Notification.permission === 'granted')
        new Notification(a.titulo, { body: a.detalle, icon: './marca/CB_monograma_dorado.svg', tag: a.id });
    }
  }, [avisos]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = sinLeer ? `(${sinLeer}) ${base}` : base;
  }, [sinLeer]);

  const marcar = (a: Aviso) => db.avisos.update(a.id, { leido: true });
  const marcarTodo = () => db.avisos.bulkUpdate(avisos.filter(a => !a.leido).map(a => ({ key: a.id, changes: { leido: true } })));
  const confirmar = async (a: Aviso) => {
    if (a.refId) await db.citas.update(a.refId, { estado: 'confirmada' });
    await marcar(a);
  };
  // Confirmar desde la lista fija: también quedan leídos sus avisos
  const confirmarCita = async (citaId: string) => {
    await db.citas.update(citaId, { estado: 'confirmada' });
    const suyos = avisos.filter(a => a.refId === citaId && !a.leido);
    if (suyos.length) await db.avisos.bulkUpdate(suyos.map(a => ({ key: a.id, changes: { leido: true } })));
  };
  const fechaCorta = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  const pedirPermiso = () => 'Notification' in window && Notification.requestPermission();

  const whatsapp = (a: Aviso) => {
    const c = clientes.find(x => x.id === a.clienteId);
    if (!c || (a.tipo !== 'cita' && a.tipo !== 'club')) return null;
    const nombre = c.nombre.split(' ')[0];
    const texto = a.tipo === 'cita'
      ? `¡Hola, ${nombre}! Recibimos tu cita en Cristina Borquez Beauty Salon: ${(a.detalle || '').split(' · «')[0]}. Te la confirmamos con gusto.`
      : `¡Hola, ${nombre}! Bienvenida al Club Cristina Borquez. Desde tu próxima visita empiezas a juntar puntos.`;
    return enlaceWhatsApp(c.telefono, texto);
  };

  return (
    <>
      <button onClick={() => setAbierta(true)} aria-label={`Avisos${sinLeer ? `: ${sinLeer} sin leer` : ''}`}
        className={`relative rounded-md p-2 ${oscuro ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Bell size={19} strokeWidth={1.5} />
        {porConfirmar.length > 0
          ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white" title="Citas de la app por confirmar">{porConfirmar.length}</span>
          : sinLeer > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-marca-dorado px-1 text-[10px] font-medium text-marca-negro">{sinLeer}</span>}
      </button>

      {abierta && (
        <div className="fixed inset-0 z-[60]">
          <div onClick={() => setAbierta(false)} className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-marca-dorado-prof">Bandeja</p>
                <h2 className="text-2xl text-gray-900">Avisos de la app</h2>
              </div>
              <button onClick={() => setAbierta(false)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100" aria-label="Cerrar"><X size={20} /></button>
            </div>
            <div className="flex items-center justify-between gap-2 border-b px-5 py-2 text-xs text-gray-500">
              <span>{citas.length} cita{citas.length === 1 ? '' : 's'} por confirmar</span>
              <div className="flex gap-3">
                {'Notification' in window && Notification.permission === 'default' && <button onClick={pedirPermiso} className="text-marca-dorado-prof hover:underline">Activar notificaciones</button>}
                {sinLeer > 0 && <button onClick={marcarTodo} className="hover:underline">Marcar todo leído</button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {porConfirmar.length > 0 && (
                <div className="border-b bg-red-50/60 px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-red-700">Por confirmar · desde la app</p>
                  {porConfirmar.map(c => {
                    const cl = clientes.find(x => x.id === c.clienteId);
                    const sv = servicios.find(x => x.id === c.servicioId);
                    const wa = enlaceWhatsApp(cl?.telefono, `¡Hola, ${(cl?.nombre || '').split(' ')[0]}! Sobre tu cita de ${sv?.nombre || 'tu servicio'} el ${fechaCorta(c.fecha)} a las ${c.hora}: `);
                    return (
                      <div key={c.id} className="mt-3 flex items-center gap-3">
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="truncate font-medium text-gray-900">{cl?.nombre || 'Clienta'} · {fechaCorta(c.fecha)} {c.hora}</p>
                          <p className="truncate text-gray-600">{sv?.nombre || 'Servicio'}{c.montoAnticipo ? ` · anticipo $${c.montoAnticipo.toLocaleString('es-MX')} ${c.anticipoConfirmado ? 'pagado' : 'pendiente'}` : ''}</p>
                        </div>
                        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-md border bg-white p-2 text-gray-700 hover:bg-gray-50" aria-label="WhatsApp"><MessageCircle size={14} /></a>}
                        <button onClick={() => confirmarCita(c.id)} className="flex items-center gap-1 rounded-md bg-marca-negro px-3 py-1.5 text-xs text-white hover:bg-gray-800"><Check size={13} /> Confirmar</button>
                      </div>
                    );
                  })}
                  <p className="mt-3 text-[11px] text-gray-500">Para cambiarla de hora o cancelarla, ábrela en Citas.</p>
                </div>
              )}
              {!avisos.length && <p className="p-6 text-sm text-gray-500">Aquí llegan las citas y registros al Club que las clientas hacen desde la app.</p>}
              {avisos.map(a => {
                const Icono = ICONO[a.tipo] || Bell;
                const pendiente = a.tipo === 'cita' && citas.some(c => c.id === a.refId);
                const wa = whatsapp(a);
                return (
                  <div key={a.id} className={`border-b px-5 py-4 ${a.leido ? '' : 'bg-marca-marfil/60'}`}>
                    <div className="flex gap-3">
                      <Icono size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-marca-dorado-prof" />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">{a.titulo}</p>
                          <span className="shrink-0 text-[11px] text-gray-400">{hace(a.fecha)}</span>
                        </div>
                        {a.detalle && <p className="mt-0.5 text-sm text-gray-600">{a.detalle}</p>}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pendiente && (
                            <button onClick={() => confirmar(a)} className="flex items-center gap-1 rounded-md bg-marca-negro px-3 py-1.5 text-xs text-white hover:bg-gray-800">
                              <Check size={13} /> Confirmar cita
                            </button>
                          )}
                          {wa && (
                            <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => marcar(a)}
                              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                              <MessageCircle size={13} /> WhatsApp
                            </a>
                          )}
                          {!a.leido && <button onClick={() => marcar(a)} className="px-2 py-1.5 text-xs text-gray-500 hover:underline">Leído</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
