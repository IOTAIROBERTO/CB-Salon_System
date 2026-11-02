import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Popup propio para confirmar y avisar en todo CB Control (en lugar de confirm() y alert() del navegador, que en el
// celular instalado se ven ajenos y a veces ni salen). `await confirmar('¿Eliminar…?')` da true solo si tocó «Sí».
interface Pregunta { texto: string; si?: string; no?: string; peligro?: boolean; aviso?: boolean; resolver: (ok: boolean) => void }

let mostrar: ((p: Pregunta) => void) | null = null;
const PELIGRO = /elimin|borr|quit|baja|cancel|desactiv|reinici/i;

/** Pregunta antes de cambiar o borrar algo. Sin el popup montado (pruebas) usa el del navegador. */
export const confirmar = (texto: string, o: Partial<Pick<Pregunta, 'si' | 'no' | 'peligro'>> = {}) =>
  new Promise<boolean>(resolver => mostrar ? mostrar({ texto, peligro: PELIGRO.test(texto), ...o, resolver }) : resolver(window.confirm(texto)));

/** Avisa algo (un error, que falta un dato) y espera a que lo cierre */
export const avisar = (texto = '') =>
  new Promise<void>(listo => mostrar ? mostrar({ texto, aviso: true, resolver: () => listo() }) : (window.alert(texto), listo()));

export default function ConfirmarHost() {
  const [p, setP] = useState<Pregunta | null>(null);
  const boton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Si llega otra pregunta con una abierta, la abierta cuenta como «No»
    mostrar = nueva => setP(vieja => { vieja?.resolver(false); return nueva; });
    return () => { mostrar = null; };
  }, []);
  useEffect(() => {
    if (!p) return;
    boton.current?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); cerrar(false); } };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });
  if (!p) return null;
  const cerrar = (ok: boolean) => { setP(null); p.resolver(ok); };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => cerrar(false)}>
      <div role="alertdialog" aria-modal="true" aria-label={p.aviso ? 'Aviso' : 'Confirmar'} onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-marca-dorado-prof">{p.aviso ? 'Aviso' : 'Confirmar'}</p>
        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-gray-900">{p.texto}</p>
        <div className="mt-5 flex gap-2">
          {!p.aviso && <button onClick={() => cerrar(false)} className="min-h-[44px] flex-1 rounded border text-sm text-gray-700 hover:bg-gray-50">{p.no || 'No'}</button>}
          <button ref={boton} onClick={() => cerrar(true)}
            className={`min-h-[44px] flex-1 rounded text-sm text-white ${p.peligro && !p.aviso ? 'bg-red-700 hover:bg-red-800' : 'bg-marca-negro hover:bg-gray-800'}`}>
            {p.aviso ? 'Entendido' : p.si || 'Sí'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
