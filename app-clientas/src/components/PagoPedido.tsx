import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'
import type { PedidoVista } from '@/api'
import { enlaceWhatsApp, pesos } from '@/salon'
import { plazo } from '@/carrito'

const fecha = (iso?: string) => iso ? new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : ''

/** Lo que paga (productos y anticipo de su cita), hasta cuándo y cómo; o en qué quedó. Lo usan «Mi cita» y «Mi pedido». */
export default function PagoPedido({ p, conCita = false }: { p: PedidoVista; conCita?: boolean }) {
  const [copiado, setCopiado] = useState(false)
  const porPagar = p.estado === 'por_pagar'
  const estado = {
    por_pagar: p.venceEn
      ? `Paga a más tardar ${plazo(p.venceEn)}. Si no, ${conCita ? 'tu cita y ' : ''}${p.items.length ? 'tus productos se liberan' : 'tu horario se libera'} solos y pagar después ya no los aparta.`
      : 'Cuando Cristina revise tu cita te diremos el total (productos y anticipo) y hasta cuándo pagarlo.',
    pagado: `Pagado.${p.items.length ? ` Recoge tus productos en tu cita o a más tardar el ${fecha(p.recogerHasta)}.` : ''}`,
    entregado: 'Entregado. ¡Gracias!',
    vencido: 'Venció sin pago: lo apartado se liberó.',
    no_recogido: 'No se recogió a tiempo: lo que pagaste quedó como tu saldo a favor.',
    cancelado: 'Cancelado: lo apartado se liberó.'
  }[p.estado]

  return (
    <section className="tarjeta space-y-3">
      <p className="rotulo">{porPagar ? 'Por pagar' : 'Tu pago'}</p>
      <ul className="space-y-1 text-sm text-marca-grafito">
        {p.items.map(i => <li key={i.productoId} className="flex justify-between gap-3"><span>{i.cantidad} × {i.nombre}</span><span className="tabular-nums">{pesos(i.precio * i.cantidad)}</span></li>)}
        {p.anticipo > 0 && <li className="flex justify-between gap-3"><span>Anticipo de tu cita</span><span className="tabular-nums">{pesos(p.anticipo)}</span></li>}
        <li className="flex items-baseline justify-between gap-3 border-t border-marca-linea pt-2"><span className="text-marca-negro">Total</span><span className="font-display text-2xl text-marca-negro">{pesos(p.total)}</span></li>
      </ul>
      <p className="text-sm leading-relaxed text-marca-gris">{estado}</p>
      {porPagar && p.venceEn && p.datosPago && (
        <div className="rounded-sm bg-marca-marfil p-3 text-sm leading-relaxed text-marca-grafito">
          <p className="text-xs uppercase tracking-[0.18em] text-marca-gris">Transferencia o depósito (también en OXXO)</p>
          <p className="mt-1 whitespace-pre-line">{p.datosPago}</p>
          <button onClick={() => navigator.clipboard?.writeText(p.datosPago!).then(() => setCopiado(true))}
            className="mt-2 flex min-h-[40px] items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof">
            {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar datos'}
          </button>
          <a href={enlaceWhatsApp(`Hola, te mando mi comprobante de pago por ${pesos(p.total)}.`)} className="boton-claro mt-2 w-full">
            <MessageCircle size={16} strokeWidth={1.5} /> Mandar mi comprobante
          </a>
          <p className="mt-2 text-xs text-marca-gris">Pago en línea con tarjeta, OXXO o Mercado Pago: muy pronto.</p>
        </div>
      )}
    </section>
  )
}
