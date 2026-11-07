import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { DiaLibre } from '@/api'
import { FRANJAS, NOMBRE_FRANJA, type Franja, type Preferencia } from '@salon/utils/agenda'

const MAXIMO = 3
const largo = (f: string) => { const t = new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1) }

/** Cuándo le acomoda a la clienta (Agendar y «Mi cita» → Cambiar): hasta 3 días y, en cada uno, la parte del día. Solo se
 *  ofrece lo que de verdad cabe para ese servicio. `children` va debajo de los días. */
export default function ElegirPreferencias({ dias, valor, onCambio, children }: {
  dias: DiaLibre[]; valor: Preferencia[]; onCambio: (p: Preferencia[]) => void; children?: ReactNode
}) {
  const alternar = (fecha: string) => onCambio(valor.some(p => p.fecha === fecha)
    ? valor.filter(p => p.fecha !== fecha)
    : valor.length < MAXIMO ? [...valor, { fecha, franja: 'cualquiera' }] : valor)
  const conFranja = (fecha: string, franja: Franja) => onCambio(valor.map(p => p.fecha === fecha ? { ...p, franja } : p))
  const chip = (activo: boolean) => `rounded-full border px-3 py-1.5 text-xs transition ${activo ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea bg-white text-marca-grafito'}`
  return (
    <>
      <div>
        <span className="rotulo text-marca-gris">Días que te acomodan <span className="normal-case tracking-normal">· hasta {MAXIMO}</span></span>
        <div className="-mx-6 mt-2 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
          {dias.map(d => {
            const f = new Date(`${d.fecha}T12:00:00`)
            const orden = valor.findIndex(p => p.fecha === d.fecha), activo = orden >= 0
            const vacio = !d.franjas.length, lleno = !activo && valor.length >= MAXIMO
            return (
              <button key={d.fecha} type="button" disabled={vacio || lleno} aria-pressed={activo} onClick={() => alternar(d.fecha)}
                className={`relative flex w-14 shrink-0 flex-col items-center rounded-sm border py-2 transition ${activo ? 'border-marca-negro bg-marca-negro text-white' : vacio ? 'border-marca-linea/50 text-marca-gris/40' : lleno ? 'border-marca-linea/70 text-marca-gris/70' : 'border-marca-linea text-marca-negro'}`}>
                <span className="text-[9px] uppercase tracking-[0.14em]">{f.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}</span>
                <span className="font-display text-xl leading-tight">{f.getDate()}</span>
                <span className="text-[9px] uppercase tracking-[0.1em]">{f.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}</span>
              </button>
            )
          })}
        </div>
        {children}
      </div>
      {valor.length > 0 && (
        <div className="space-y-4">
          {valor.map((p, i) => {
            const libres = dias.find(d => d.fecha === p.fecha)?.franjas || []
            return (
              <div key={p.fecha}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-marca-negro"><span className="rotulo mr-2 text-marca-gris">Opción {i + 1}</span>{largo(p.fecha)}</span>
                  <button type="button" onClick={() => alternar(p.fecha)} aria-label={`Quitar ${largo(p.fecha)}`} className="p-2 text-marca-gris"><X size={15} strokeWidth={1.5} /></button>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {FRANJAS.filter(f => libres.includes(f.id)).map(f => (
                    <button key={f.id} type="button" onClick={() => conFranja(p.fecha, f.id)} className={chip(p.franja === f.id)}>{f.nombre} <span className="opacity-70">· {f.detalle}</span></button>
                  ))}
                  <button type="button" onClick={() => conFranja(p.fecha, 'cualquiera')} className={chip(p.franja === 'cualquiera')}>{NOMBRE_FRANJA.cualquiera}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
