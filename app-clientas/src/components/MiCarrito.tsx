import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import Ventana from '@/components/Ventana'
import NoSoyRobot, { conTurnstile } from '@/components/NoSoyRobot'
import { crearPedido, guardarPedido, misDatos, pedirCodigo, recordarDatos, sesion, verificarCodigo } from '@/api'
import { cambiarCantidad, paraApartar, totalCarrito, useCarrito, vaciarCarrito } from '@/carrito'
import { POLITICAS, pesos } from '@/salon'

/** «Mi carrito»: barra con lo que lleva y, al tocarla, el carrito para apartarlo con su cita o comprarlo solo.
 *  Solo comprar: vista previa con los plazos (48 h para pagar, recoger en 10 días) y se aparta al aceptar. */
export default function MiCarrito() {
  const c = useCarrito()
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [comprando, setComprando] = useState(false)
  const [datos, setDatos] = useState(misDatos)
  const [robot, setRobot] = useState('')
  const [vueltaRobot, setVueltaRobot] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [reto, setReto] = useState('')       // código por WhatsApp para confirmar el teléfono (la API responde 428)
  const [codigo, setCodigo] = useState('')
  if (!c.length || pathname.startsWith('/firmar')) return null
  const piezas = c.reduce((t, i) => t + i.cantidad, 0), total = totalCarrito(c)

  const cerrar = () => { setAbierto(false); setComprando(false); setMensaje(''); setReto(''); setCodigo('') }
  const comprar = async () => {
    setEnviando(true); setMensaje('')
    try {
      const r = await crearPedido({ ...datos, productos: paraApartar(c), turnstile: robot, acepta: true })
      recordarDatos({ nombre: datos.nombre, telefono: datos.telefono })
      vaciarCarrito()
      if (r.pedido.enlace) { guardarPedido(r.pedido.enlace); cerrar(); navegar(`/pedido/${r.pedido.enlace}`) }
      else setMensaje('Recibimos tu pedido. Te escribimos por WhatsApp para confirmarlo.')
    } catch (e) {
      const err = e as { message: string; status?: number }
      if (err.status === 428) {   // falta confirmar el teléfono: el mismo token (aún sin usar) sirve para pedir el código
        try { setReto((await pedirCodigo(datos.telefono, robot)).reto) } catch (e2) { setMensaje((e2 as Error).message) }
      } else setMensaje(err.message)
    }
    finally { setEnviando(false); setRobot(''); setVueltaRobot(v => v + 1) }
  }
  /** Con el código correcto queda la sesión en este celular y se vuelve a apartar */
  const confirmarTelefono = async () => {
    setEnviando(true); setMensaje('')
    try { await verificarCodigo(reto, codigo); setReto(''); setCodigo('') } catch (e) { setMensaje((e as Error).message); setEnviando(false); return }
    await comprar()
  }

  return (
    <>
      <div className="h-16 lg:hidden" />
      <button onClick={() => setAbierto(true)}
        className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-20 flex items-center gap-3 rounded-sm bg-marca-negro px-4 py-3 text-left text-white shadow-lg lg:inset-x-auto lg:bottom-6 lg:right-6 lg:min-w-[22rem]">
        <ShoppingBag size={18} strokeWidth={1.4} className="shrink-0 text-marca-dorado" />
        <span className="min-w-0 flex-1 text-sm">Mi carrito · {piezas} {piezas === 1 ? 'producto' : 'productos'} · {pesos(total)}</span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-marca-dorado">Ver</span>
      </button>

      {abierto && (
        <Ventana onCerrar={cerrar}>
          <p className="rotulo">Mi carrito</p>
          <ul className="mt-3 divide-y divide-marca-linea/70">
            {c.map(i => (
              <li key={i.productoId} className="flex items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1 text-marca-negro">{i.nombre}<span className="block text-xs text-marca-gris">{pesos(i.precio)} c/u</span></span>
                <button onClick={() => cambiarCantidad(i, -1)} aria-label={`Quitar un ${i.nombre}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-marca-linea"><Minus size={14} /></button>
                <span className="w-5 text-center tabular-nums">{i.cantidad}</span>
                <button onClick={() => cambiarCantidad(i, 1)} disabled={i.cantidad >= i.disponible} aria-label={`Agregar un ${i.nombre}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-marca-linea disabled:opacity-30"><Plus size={14} /></button>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-baseline justify-between border-t border-marca-linea pt-3"><span className="text-sm">Total de productos</span><span className="font-display text-2xl text-marca-negro">{pesos(total)}</span></p>

          {!comprando ? (
            <div className="mt-5 space-y-2">
              <button onClick={() => { cerrar(); navegar('/agendar') }} className="boton w-full">{pathname === '/agendar' ? 'Seguir con mi cita' : 'Apartarlos con mi cita'}</button>
              <p className="text-center text-xs text-marca-gris">Se pagan junto con el anticipo de tu cita cuando Cristina la confirme.</p>
              <button onClick={() => setComprando(true)} className="boton-claro w-full">Solo comprar y recoger en el salón</button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <ul className="list-disc space-y-1 border-l border-marca-dorado pl-7 text-xs leading-relaxed text-marca-gris">
                <li>Se apartan a tu nombre al aceptar. Tienes 48 horas para pagar por transferencia o depósito (también en OXXO); si no, se liberan solos y pagar después ya no los aparta.</li>
                <li>Mientras están apartados no se venden en el salón.</li>
                <li>{POLITICAS.pedidos}</li>
              </ul>
              <label className="block">
                <span className="rotulo text-marca-gris">Nombre completo</span>
                <input className="campo" autoComplete="name" value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} />
              </label>
              <label className="block">
                <span className="rotulo text-marca-gris">Teléfono (WhatsApp)</span>
                <input className="campo" type="tel" inputMode="tel" autoComplete="tel" value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} />
              </label>
              {reto && (
                <div className="space-y-3 rounded-sm bg-marca-marfil p-4">
                  <p className="text-sm leading-relaxed text-marca-grafito">Te mandamos un código por WhatsApp al {datos.telefono}. Escríbelo para apartar tus productos.</p>
                  <input className="campo text-center text-2xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                    placeholder="······" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} />
                </div>
              )}
              <NoSoyRobot key={vueltaRobot} onToken={setRobot} />
              {mensaje && <p className="rounded-sm bg-marca-marfil px-3 py-2 text-sm text-marca-grafito">{mensaje}</p>}
              {reto
                ? <button onClick={confirmarTelefono} disabled={enviando || codigo.length !== 6} className="boton w-full disabled:opacity-40">{enviando ? 'Confirmando…' : `Confirmar y apartar · ${pesos(total)}`}</button>
                : <button onClick={comprar} disabled={enviando || (conTurnstile && !robot && !sesion())} className="boton w-full disabled:opacity-40">
                    {enviando ? 'Apartando…' : `Acepto y aparto · ${pesos(total)}`}
                  </button>}
              <button onClick={() => setComprando(false)} className="w-full py-3 text-[11px] uppercase tracking-[0.2em] text-marca-gris">Volver</button>
            </div>
          )}
        </Ventana>
      )}
    </>
  )
}
