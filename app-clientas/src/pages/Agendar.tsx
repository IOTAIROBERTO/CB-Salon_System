import { useEffect, useRef, useState } from 'react'
import { Check, MessageCircle } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import { POLITICAS, SERVICIOS, enlaceWhatsApp, nombreCategoria, pesos, type Servicio } from '@/salon'

// Fase 1: la solicitud sale por WhatsApp ya escrita. Cristina o Roberto confirman el horario y mandan el anticipo
// (decisión de la propuesta v7). Cuando exista la API, la solicitud llegará directo a CB Control.
const categorias = [...new Set(SERVICIOS.map(s => s.categoria))]

export default function Agendar() {
  const [elegido, setElegido] = useState<Servicio | null>(null)
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [turno, setTurno] = useState('mañana')
  const [notas, setNotas] = useState('')
  const formulario = useRef<HTMLElement>(null)
  useEffect(() => { if (elegido) formulario.current?.scrollIntoView({ behavior: 'smooth' }) }, [elegido])

  const mensaje = elegido && [
    `Hola, soy ${nombre.trim() || '(mi nombre)'}. Quiero agendar: ${elegido.nombre} (desde ${pesos(elegido.precio)}).`,
    fecha && `Me acomoda el ${new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} por la ${turno}.`,
    notas.trim() && notas.trim()
  ].filter(Boolean).join(' ')

  return (
    <>
      <Encabezado titulo="Agendar" bajada="Elige tu servicio y te confirmamos el horario por WhatsApp" />
      <main className="space-y-5 p-4">
        {categorias.map(cat => (
          <section key={cat}>
            <h2 className="titulo mb-2 text-xl">{nombreCategoria(cat)}</h2>
            <div className="space-y-2">
              {SERVICIOS.filter(s => s.categoria === cat).map(s => (
                <button key={s.id} onClick={() => setElegido(s)}
                  className={`tarjeta flex w-full items-center justify-between text-left ${elegido?.id === s.id ? 'border-marca-dorado bg-marca-marfil' : ''}`}>
                  <span>
                    <span className="block font-medium text-marca-negro">{s.nombre}</span>
                    <span className="text-sm text-marca-gris">Desde {pesos(s.precio)} · {s.duracion} min</span>
                  </span>
                  {elegido?.id === s.id && <Check className="text-marca-dorado" />}
                </button>
              ))}
            </div>
          </section>
        ))}

        {elegido && (
          <section ref={formulario} className="tarjeta scroll-mt-4 space-y-3">
            <h2 className="titulo text-xl">{elegido.nombre}</h2>
            <input className="campo" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
            <input className="campo" type="date" value={fecha} onChange={e => setFecha(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
            <div className="flex gap-2">
              {['mañana', 'tarde'].map(t => (
                <button key={t} onClick={() => setTurno(t)} className={`flex-1 rounded-full border py-2 text-sm ${turno === t ? 'border-marca-dorado bg-marca-champan' : 'border-marca-linea'}`}>
                  Por la {t}
                </button>
              ))}
            </div>
            <textarea className="campo" rows={2} placeholder="¿Algo que debamos saber? (largo de tu cabello, color actual…)" value={notas} onChange={e => setNotas(e.target.value)} />
            <p className="text-xs text-marca-gris">
              Es una solicitud: te confirmamos el horario y te mandamos el anticipo para apartar{elegido.anticipo ? ` (${pesos(elegido.anticipo)})` : ''}.
              Los precios son desde: el final se confirma en tu valoración. {POLITICAS.cambios}
            </p>
            <a href={enlaceWhatsApp(mensaje || '')} className="boton w-full"><MessageCircle size={18} /> Enviar por WhatsApp</a>
          </section>
        )}
      </main>
    </>
  )
}
