import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import PagoPedido from '@/components/PagoPedido'
import { cancelarMiPedido, miPedido, type PedidoVista } from '@/api'
import { enlaceWhatsApp } from '@/salon'
import { useEnVivo } from '@/vivo'

// «Mi pedido»: productos apartados sin cita (Mi carrito → Solo comprar). Estado en vivo (así ve cuando el salón registra
// su pago), plazo, datos de pago y cancelar mientras siga por pagar.
export default function MiPedido() {
  const { ref = '' } = useParams()
  const [p, setP] = useState<PedidoVista | null>(null)
  const [error, setError] = useState('')
  const [cancelando, setCancelando] = useState(false)
  useEnVivo(() => miPedido(ref).then(x => { setP(x); setError('') }).catch(e => { if (!p) setError(e.message) }), 60_000)

  if (error && !p) return (
    <>
      <Encabezado rotulo="Tu pedido" titulo="No lo encontramos" bajada={error} />
      <main className="contenido px-6"><a href={enlaceWhatsApp('Hola, quiero revisar mi pedido.')} className="boton w-full"><MessageCircle size={16} strokeWidth={1.5} /> Escríbenos por WhatsApp</a></main>
    </>
  )
  if (!p) return <><Encabezado rotulo="Tu pedido" titulo="Un momento…" /><p className="contenido px-6 text-sm text-marca-gris">Cargando tu pedido…</p></>

  return (
    <>
      <Encabezado rotulo="Tu pedido" titulo={p.estado === 'por_pagar' ? 'Apartado para ti' : 'Tu pedido'} />
      <main className="contenido space-y-4 px-6 pb-8 lg:max-w-xl">
        <PagoPedido p={p} />
        {p.puedeCancelar && (cancelando ? (
          <div className="tarjeta space-y-3">
            <p className="text-sm text-marca-grafito">¿Cancelar tu pedido? Lo apartado vuelve a la venta.</p>
            <button onClick={async () => { try { setP(await cancelarMiPedido(ref)) } catch (e) { setError((e as Error).message) } setCancelando(false) }} className="boton w-full">Sí, cancelarlo</button>
            <button onClick={() => setCancelando(false)} className="boton-claro w-full">No, lo conservo</button>
          </div>
        ) : <button onClick={() => setCancelando(true)} className="boton-claro w-full"><X size={15} strokeWidth={1.5} /> Cancelar mi pedido</button>)}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <a href={enlaceWhatsApp('Hola, tengo una pregunta sobre mi pedido.')} className="boton-claro w-full"><MessageCircle size={16} strokeWidth={1.5} /> Escríbenos</a>
        <Link to="/productos" className="block py-2 text-center text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof">Ver productos</Link>
      </main>
    </>
  )
}
