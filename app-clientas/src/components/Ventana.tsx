import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Ventana emergente: abajo en el celular, al centro en la computadora. Va directo al <body>: dentro de la pantalla, la
 *  animación de entrada (transform) haría que `fixed` se midiera contra la página y la ventana quedaría fuera de vista. */
export default function Ventana({ onCerrar, children }: { onCerrar: () => void; children: ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-marca-negro/50 lg:items-center" onClick={onCerrar}>
      <section className="aparece max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] lg:rounded-sm"
        onClick={e => e.stopPropagation()}>
        {children}
      </section>
    </div>,
    document.body
  )
}
