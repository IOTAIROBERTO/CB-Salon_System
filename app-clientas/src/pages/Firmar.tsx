import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import { enviarFirma, firmaPendiente, type DatosFirma } from '@/api'
import { enlaceWhatsApp } from '@/salon'
import {
  AUTORIZACION_DATOS, AUTORIZACION_MARKETING, CHECKS_CLIENTA, CONDICIONES, OPCIONES_REDES, PREGUNTA_FOTOS, PREGUNTA_REDES
} from '@salon/utils/consentimiento'

// Consentimiento informado firmado en el celular con el enlace personal que manda el salón (WhatsApp o QR).
// No pide entrar al Club. Mismos textos que el formato en papel (CB Control: utils/consentimiento.ts).

/** Recuadro para firmar con el dedo; avisa la firma como PNG (vacío al borrar) */
function Firma({ onFirma }: { onFirma: (png: string) => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const dibujando = useRef(false)
  const largo = useRef(0)              // píxeles trazados: un toque suelto no es firma
  const ultimo = useRef([0, 0] as readonly [number, number])
  const ctx = () => lienzo.current!.getContext('2d')!
  useEffect(() => {
    const c = lienzo.current!, r = window.devicePixelRatio || 1
    c.width = c.offsetWidth * r
    c.height = c.offsetHeight * r
    const g = ctx()
    g.scale(r, r)
    g.lineWidth = 2.2
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.strokeStyle = '#111111'
  }, [])
  const punto = (e: PointerEvent) => { const b = lienzo.current!.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top] as const }
  const bajar = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dibujando.current = true
    ultimo.current = punto(e)
    ctx().beginPath()
    ctx().moveTo(...ultimo.current)
  }
  const mover = (e: PointerEvent) => {
    if (!dibujando.current) return
    const p = punto(e)
    largo.current += Math.hypot(p[0] - ultimo.current[0], p[1] - ultimo.current[1])
    ultimo.current = p
    ctx().lineTo(...p)
    ctx().stroke()
  }
  const soltar = () => {
    if (!dibujando.current) return
    dibujando.current = false
    if (largo.current > 120) onFirma(lienzo.current!.toDataURL('image/png'))
  }
  const borrar = () => {
    ctx().clearRect(0, 0, lienzo.current!.width, lienzo.current!.height)
    largo.current = 0
    onFirma('')
  }
  return (
    <div>
      <canvas ref={lienzo} onPointerDown={bajar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
        className="h-40 w-full touch-none rounded-sm border border-marca-linea bg-white" aria-label="Recuadro para firmar" />
      <div className="mt-1 flex justify-between text-xs text-marca-gris">
        <span>Firma con tu dedo</span>
        <button type="button" onClick={borrar} className="underline">Borrar</button>
      </div>
    </div>
  )
}

const fechaLarga = (f?: string) => f ? new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : ''

export default function Firmar() {
  const { id = '' } = useParams()
  const [datos, setDatos] = useState<DatosFirma | null>(null)
  const [error, setError] = useState('')
  const [salud, setSalud] = useState<number[]>([])
  const [datosSalud, setDatosSalud] = useState(false)
  const [fotos, setFotos] = useState<boolean | null>(null)
  const [redes, setRedes] = useState<keyof typeof OPCIONES_REDES>('no')
  const [marketing, setMarketing] = useState(false)
  const [nombre, setNombre] = useState('')
  const [menor, setMenor] = useState(false)
  const [tutor, setTutor] = useState('')
  const [firma, setFirma] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    firmaPendiente(id).then(d => { setDatos(d); setNombre(d.nombre) }).catch(e => setError(e.message))
  }, [id])

  const falta = !datosSalud ? 'Acepta el uso de tus datos de salud' : fotos === null ? 'Responde si podemos tomarte fotos'
    : nombre.trim().length < 3 ? 'Escribe tu nombre completo' : menor && tutor.trim().length < 3 ? 'Escribe el nombre de quien firma por ti'
    : !firma ? 'Firma en el recuadro' : ''

  const enviar = async () => {
    setEnviando(true)
    setError('')
    try {
      await enviarFirma(id, { salud, datosSalud, fotos: !!fotos, redes: fotos ? redes : 'no', marketing, nombreFirma: nombre, menor, tutor, firma })
      setListo(true)
      window.scrollTo(0, 0)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  if (listo) return (
    <main className="px-6 pb-8 pt-[calc(env(safe-area-inset-top)+4rem)]">
      <div className="tarjeta aparece space-y-4 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-marca-negro text-marca-dorado"><Check size={22} /></div>
        <h1 className="titulo text-3xl">¡Gracias, {nombre.split(' ')[0]}!</h1>
        <p className="text-sm leading-relaxed text-marca-gris">Tu consentimiento quedó guardado en el salón. Si algo de tu salud cambia antes de tu cita, avísanos.</p>
        <Link to="/" className="boton-claro inline-block">Ir al inicio</Link>
      </div>
    </main>
  )

  if (!datos) return (
    <>
      <Encabezado rotulo="Consentimiento informado" titulo="Antes de tu servicio" />
      <main className="px-6 pb-8">
        {error
          ? <div className="tarjeta space-y-4 p-6 text-sm">
              <p className="text-marca-grafito">{error}</p>
              <a href={enlaceWhatsApp('Hola, necesito un nuevo enlace para firmar mi consentimiento.')} className="boton inline-block">Pedirlo por WhatsApp</a>
            </div>
          : <p className="text-sm text-marca-gris">Cargando…</p>}
      </main>
    </>
  )

  return (
    <>
      <Encabezado rotulo="Consentimiento informado" titulo="Antes de tu servicio"
        bajada="Lee, marca lo que aplique y firma. Toma dos minutos y vale igual que el formato en papel." />
      <main className="space-y-8 px-6 pb-8">
        <section className="tarjeta space-y-1 p-6 text-sm">
          <p className="rotulo text-marca-gris">Tus datos</p>
          <p className="text-marca-negro">{datos.nombre}</p>
          {datos.servicio && <p className="text-marca-grafito">{datos.servicio}{datos.fecha && ` · ${fechaLarga(datos.fecha)}${datos.hora ? ` a las ${datos.hora}` : ''}`}</p>}
        </section>

        <section className="space-y-3">
          <p className="rotulo">Historial y salud</p>
          <p className="text-sm text-marca-gris">Marca lo que aplique; si nada aplica, déjalo en blanco. Es confidencial y sirve para cuidar tu cabello y tu salud.</p>
          {CHECKS_CLIENTA.map((t, i) => (
            <label key={i} className="flex items-start gap-3 text-sm leading-relaxed text-marca-grafito">
              <input type="checkbox" checked={salud.includes(i)} onChange={e => setSalud(e.target.checked ? [...salud, i] : salud.filter(x => x !== i))}
                className="mt-1 h-4 w-4 shrink-0 accent-marca-dorado-prof" />
              {t}
            </label>
          ))}
        </section>

        <section className="space-y-3">
          <p className="rotulo">Condiciones del servicio</p>
          {CONDICIONES.map(([titulo, texto]) => (
            <p key={titulo} className="text-sm leading-relaxed text-marca-grafito"><span className="text-marca-negro">{titulo}.</span> {texto}</p>
          ))}
        </section>

        <section className="space-y-4">
          <p className="rotulo">Autorizaciones</p>
          <label className="flex items-start gap-3 rounded-sm bg-white p-4 text-sm leading-relaxed text-marca-grafito">
            <input type="checkbox" checked={datosSalud} onChange={e => setDatosSalud(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-marca-dorado-prof" />
            <span>{AUTORIZACION_DATOS} <a href="./formatos/aviso-de-privacidad.pdf" target="_blank" className="underline">Leer el aviso de privacidad</a></span>
          </label>
          <div className="text-sm text-marca-grafito">
            <p>{PREGUNTA_FOTOS}</p>
            <div className="mt-2 flex gap-2">
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={() => setFotos(v)}
                  className={`rounded-full border px-5 py-1.5 ${fotos === v ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea'}`}>{v ? 'Sí' : 'No'}</button>
              ))}
            </div>
          </div>
          {fotos && (
            <div className="text-sm text-marca-grafito">
              <p>{PREGUNTA_REDES}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(OPCIONES_REDES) as (keyof typeof OPCIONES_REDES)[]).map(k => (
                  <button key={k} type="button" onClick={() => setRedes(k)}
                    className={`rounded-full border px-4 py-1.5 ${redes === k ? 'border-marca-negro bg-marca-negro text-white' : 'border-marca-linea'}`}>{OPCIONES_REDES[k]}</button>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-start gap-3 text-sm leading-relaxed text-marca-grafito">
            <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-marca-dorado-prof" />
            {AUTORIZACION_MARKETING} <span className="text-marca-gris">(opcional)</span>
          </label>
        </section>

        <section className="space-y-4">
          <p className="rotulo">Firma</p>
          <label className="block"><span className="rotulo text-marca-gris">Nombre completo de la clienta</span>
            <input className="campo mt-1" value={nombre} onChange={e => setNombre(e.target.value)} autoComplete="name" />
          </label>
          <label className="flex items-center gap-3 text-sm text-marca-grafito">
            <input type="checkbox" checked={menor} onChange={e => setMenor(e.target.checked)} className="h-4 w-4 accent-marca-dorado-prof" />
            La clienta es menor de edad (firma su madre, padre o tutor)
          </label>
          {menor && (
            <label className="block"><span className="rotulo text-marca-gris">Nombre de la madre, padre o tutor</span>
              <input className="campo mt-1" value={tutor} onChange={e => setTutor(e.target.value)} />
            </label>
          )}
          <Firma onFirma={setFirma} />
          <p className="text-xs leading-relaxed text-marca-gris">Al firmar guardamos la fecha, la hora y el dispositivo como constancia.</p>
          {error && <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button onClick={enviar} disabled={enviando || !!falta} className="boton w-full disabled:opacity-40">
            {enviando ? 'Guardando…' : falta || 'Firmar y enviar'}
          </button>
        </section>
      </main>
    </>
  )
}
