import type { ReactNode } from 'react'
import type { DiaLibre } from '@/api'

/** Días y horas libres en tiempo real (Agendar y «Mi cita» → Cambiar). `children` va debajo de los días. */
export default function ElegirHorario({ dias, fecha, hora, onFecha, onHora, children }: {
  dias: DiaLibre[]; fecha: string; hora: string; onFecha: (f: string) => void; onHora: (h: string) => void; children?: ReactNode
}) {
  return (
    <>
      <div>
        <span className="rotulo text-marca-gris">Día</span>
        <div className="-mx-6 mt-2 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
          {dias.map(d => {
            const f = new Date(`${d.fecha}T12:00:00`)
            const activo = d.fecha === fecha, vacio = !d.horas.length
            return (
              <button key={d.fecha} disabled={vacio} onClick={() => { onFecha(d.fecha); onHora('') }}
                className={`flex w-14 shrink-0 flex-col items-center rounded-sm border py-2 transition ${activo ? 'border-marca-negro bg-marca-negro text-white' : vacio ? 'border-marca-linea/50 text-marca-gris/40' : 'border-marca-linea text-marca-negro'}`}>
                <span className="text-[9px] uppercase tracking-[0.14em]">{f.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}</span>
                <span className="font-display text-xl leading-tight">{f.getDate()}</span>
                <span className="text-[9px] uppercase tracking-[0.1em]">{f.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}</span>
              </button>
            )
          })}
        </div>
        {children}
      </div>
      {fecha && (
        <div>
          <span className="rotulo text-marca-gris">Hora</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {dias.find(d => d.fecha === fecha)?.horas.map(h => (
              <button key={h} onClick={() => onHora(h)}
                className={`rounded-sm border py-2.5 text-sm tabular-nums transition ${hora === h ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea text-marca-negro'}`}>{h}</button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
