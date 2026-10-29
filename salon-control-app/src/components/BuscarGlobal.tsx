import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarPlus, Gift, MessageCircle, Search, User, X } from 'lucide-react';
import { db } from '../db/db';
import CitaExpres from './hoy/CitaExpres';
import { enlaceWhatsApp } from '../utils/lealtad';
import { normalizarFolio } from '../utils/saldo';
import { fechaLocalISO } from '../utils/dateValidation';

// Búsqueda global: clientas (nombre, teléfono o correo), citas y tarjetas de regalo desde cualquier pantalla.
// Se abre con la lupa, Ctrl+K, «/» o el evento cb-buscar (botón «Buscar» de Hoy). Está dos veces en el marco (barra
// lateral y barra del celular): solo responde la que se ve. Dentro de la barra negra del celular hereda texto blanco:
// el panel fija su color (text-gray-900) y lleva .tocable.
const norma = (t = '') => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const tel10 = (t = '') => t.replace(/\D/g, '').slice(-10);
const escribiendo = (el: EventTarget | null) => el instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

export default function BuscarGlobal({ variante = 'icono' }: { variante?: 'icono' | 'barra' }) {
  const navigate = useNavigate();
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [citaPara, setCitaPara] = useState<string | null>(null);

  useEffect(() => {
    const visible = () => !!boton.current?.offsetParent;   // la instancia oculta (barra lateral en celular o al revés) no abre
    const abrir = () => { if (visible()) setAbierto(true); };
    const tecla = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !escribiendo(e.target))) { if (visible()) { e.preventDefault(); setAbierto(true); } }
      else if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', tecla);
    window.addEventListener('cb-buscar', abrir);
    return () => { window.removeEventListener('keydown', tecla); window.removeEventListener('cb-buscar', abrir); };
  }, []);

  // Solo se lee la base con el buscador abierto
  const clientes = useLiveQuery(() => abierto ? db.clientes.toArray() : [], [abierto]) || [];
  const citas = useLiveQuery(() => abierto ? db.citas.toArray() : [], [abierto]) || [];
  const servicios = useLiveQuery(() => abierto ? db.servicios.toArray() : [], [abierto]) || [];
  const tarjetas = useLiveQuery(() => abierto ? db.tarjetasRegalo.toArray() : [], [abierto]) || [];

  const q = norma(texto), digitos = texto.replace(/\D/g, ''), folio = normalizarFolio(texto);
  const hay = q.length >= 2;
  const deClientas = !hay ? [] : clientes.filter(c => norma(c.nombre).includes(q) || (digitos.length >= 3 && tel10(c.telefono).includes(digitos)) || (!!c.email && norma(c.email).includes(q)))
    .sort((a, b) => Number(b.activo !== false) - Number(a.activo !== false)).slice(0, 8);
  const ids = new Set(deClientas.map(c => c.id));
  const hoy = fechaLocalISO();
  const deCitas = !hay ? [] : citas.filter(c => c.estado !== 'cancelada' && (ids.has(c.clienteId) || norma(servicios.find(s => s.id === c.servicioId)?.nombre).includes(q)))
    .sort((a, b) => (Number(b.fecha >= hoy) - Number(a.fecha >= hoy)) || (a.fecha >= hoy ? `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`) : `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`)))
    .slice(0, 6);
  const deTarjetas = folio.length >= 2 ? tarjetas.filter(t => t.folio.includes(folio)).slice(0, 4) : [];

  const cerrar = () => { setAbierto(false); setTexto(''); };
  const ir = (ruta: string) => { cerrar(); navigate(ruta); };
  const nombre = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Clienta';
  const fila = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50';
  const accion = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100';

  return (
    <>
      {variante === 'barra' ? (
        <button ref={boton} onClick={() => setAbierto(true)} className="flex w-full items-center gap-2 rounded-md bg-white/[0.06] px-3 py-2 text-[13px] text-white/60 hover:bg-white/10 hover:text-white">
          <Search size={15} strokeWidth={1.5} /> <span className="flex-1 text-left">Buscar</span> <kbd className="text-[10px] text-white/40">Ctrl K</kbd>
        </button>
      ) : (
        <button ref={boton} onClick={() => setAbierto(true)} aria-label="Buscar" className="rounded-md p-2.5 text-white/70 hover:bg-white/10 hover:text-white">
          <Search size={19} strokeWidth={1.5} />
        </button>
      )}

      {abierto && (
        <div className="tocable fixed inset-0 z-[60] flex items-start justify-center bg-black/40 text-gray-900 sm:p-6" onClick={cerrar}>
          <div className="flex max-h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[80dvh] sm:rounded-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b px-4">
              <Search size={18} className="shrink-0 text-gray-400" />
              <input autoFocus value={texto} onChange={e => setTexto(e.target.value)} placeholder="Clienta, teléfono, servicio o folio"
                className="min-w-0 flex-1 border-0 py-4 text-base outline-none focus:ring-0" />
              <button onClick={cerrar} aria-label="Cerrar" className="p-2 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto pb-2">
              {!hay && <p className="px-4 py-6 text-sm text-gray-500">Escribe al menos dos letras o números.</p>}
              {hay && !deClientas.length && !deCitas.length && !deTarjetas.length && <p className="px-4 py-6 text-sm text-gray-500">Sin resultados para «{texto}».</p>}

              {deClientas.length > 0 && <p className="px-4 pb-1 pt-3 text-[10px] uppercase tracking-[0.24em] text-gray-400">Clientas</p>}
              {deClientas.map(c => {
                const wa = enlaceWhatsApp(c.telefono, `¡Hola, ${c.nombre.split(' ')[0]}! `);
                return (
                  <div key={c.id} className="flex items-center pr-2 hover:bg-gray-50">
                    <button onClick={() => ir(`/clientes?ficha=${encodeURIComponent(c.id)}`)} className={fila}>
                      <User size={16} className="shrink-0 text-gray-400" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-gray-900">{c.nombre}{c.activo === false ? ' (inactiva)' : ''}</span><span className="block text-xs text-gray-500">{c.telefono}</span></span>
                    </button>
                    <button onClick={() => { setCitaPara(c.id); cerrar(); }} aria-label={`Nueva cita para ${c.nombre}`} className={accion}><CalendarPlus size={17} /></button>
                    {wa && <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp a ${c.nombre}`} className={`${accion} text-green-700`}><MessageCircle size={17} /></a>}
                  </div>
                );
              })}

              {deCitas.length > 0 && <p className="px-4 pb-1 pt-3 text-[10px] uppercase tracking-[0.24em] text-gray-400">Citas</p>}
              {deCitas.map(c => (
                <button key={c.id} onClick={() => ir(`/citas?q=${encodeURIComponent(nombre(c.clienteId))}`)} className={fila}>
                  <span className="w-20 shrink-0 text-xs text-gray-500">{new Date(`${c.fecha}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} {c.hora}</span>
                  <span className="min-w-0 flex-1 truncate">{nombre(c.clienteId)} · {servicios.find(s => s.id === c.servicioId)?.nombre || 'Servicio'}</span>
                  <span className="shrink-0 text-xs text-gray-400">{c.estado === 'no_llego' ? 'no llegó' : c.estado}</span>
                </button>
              ))}

              {deTarjetas.length > 0 && <p className="px-4 pb-1 pt-3 text-[10px] uppercase tracking-[0.24em] text-gray-400">Tarjetas de regalo</p>}
              {deTarjetas.map(t => (
                <button key={t.id} onClick={() => ir('/ventas')} className={fila}>
                  <Gift size={16} className="shrink-0 text-gray-400" />
                  <span className="flex-1">Folio {t.folio} · ${t.monto.toLocaleString('es-MX')}</span>
                  <span className="text-xs text-gray-400">{t.activadaPor ? `activada · ${nombre(t.activadaPor)}` : 'por activar'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {citaPara && <CitaExpres clienteInicial={citaPara} onClose={() => setCitaPara(null)} />}
    </>
  );
}
