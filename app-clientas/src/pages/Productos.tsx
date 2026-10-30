import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Minus, Plus } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import { BENEFICIOS_NIVEL, CORTESIAS_SIEMPRE, NOMBRE_CLUB, NOMBRE_NIVEL, POLITICAS, enlaceWhatsApp, pesos } from '@/salon'
import { useEnVivo, useSalon } from '@/vivo'
import { esComida } from '@salon/data/menuAntojos'
import { miPedido, pedidosGuardados, productosApp, type PedidoVista, type ProductoApp } from '@/api'
import { cambiarCantidad, useCarrito } from '@/carrito'

// El menú del break sale de CB Control (data/menuAntojos.ts) con los precios en vivo del Inventario (categoría Break).
// Los productos son los del Inventario marcados «en la app», con lo disponible en vivo (existencia menos lo apartado).
const B = BENEFICIOS_NIVEL

/** Pedidos de solo productos hechos en este celular que siguen abiertos (por pagar o por recoger) */
function MisPedidos() {
  const [abiertos, setAbiertos] = useState<{ ref: string; p: PedidoVista }[]>([])
  useEnVivo(async () => {
    const lista = await Promise.all(pedidosGuardados().slice(0, 3).map(ref => miPedido(ref).then(p => ({ ref, p })).catch(() => null)))
    setAbiertos(lista.filter((x): x is { ref: string; p: PedidoVista } => !!x && (x.p.estado === 'por_pagar' || x.p.estado === 'pagado')))
  })
  return <>{abiertos.map(({ ref, p }) => (
    <Link key={ref} to={`/pedido/${ref}`} className="tarjeta mt-4 flex items-center justify-between gap-3 text-sm">
      <span><span className="rotulo block">Tu pedido · {p.estado === 'por_pagar' ? 'por pagar' : 'pagado, por recoger'}</span>{p.items.map(i => `${i.cantidad} × ${i.nombre}`).join(', ')}</span>
      <span className="font-display text-xl text-marca-negro">{pesos(p.total)}</span>
    </Link>
  ))}</>
}

function Producto({ p, enCarrito }: { p: ProductoApp; enCarrito: number }) {
  const item = { productoId: p.id, nombre: p.nombre, precio: p.precio, disponible: p.disponible }
  return (
    <div className="tarjeta flex gap-4 !p-4">
      {p.foto ? <img src={p.foto} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-sm object-cover" />
        : <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-sm bg-marca-champan/50 font-display text-3xl text-marca-dorado-prof">{p.nombre[0]}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-marca-negro">{p.nombre}</p>
        <p className="text-sm tabular-nums text-marca-negro">{pesos(p.precio)}</p>
        {p.descripcion && <p className="mt-1 text-xs leading-relaxed text-marca-gris">{p.descripcion}</p>}
        <p className="mt-1 text-xs text-marca-gris">{p.disponible === 0 ? 'Agotado por ahora' : p.disponible <= 3 ? `Quedan ${p.disponible}` : ''}</p>
        {enCarrito ? (
          <div className="mt-2 flex items-center gap-3">
            <button onClick={() => cambiarCantidad(item, -1)} aria-label={`Quitar un ${p.nombre}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-marca-linea"><Minus size={14} /></button>
            <span className="tabular-nums">{enCarrito}</span>
            <button onClick={() => cambiarCantidad(item, 1)} disabled={enCarrito >= p.disponible} aria-label={`Agregar un ${p.nombre}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-marca-linea disabled:opacity-30"><Plus size={14} /></button>
          </div>
        ) : (
          <button onClick={() => cambiarCantidad(item, 1)} disabled={!p.disponible} className="mt-2 min-h-[40px] text-[11px] uppercase tracking-[0.2em] text-marca-dorado-prof disabled:text-marca-gris/50">Agregar al carrito</button>
        )}
      </div>
    </div>
  )
}

export default function Productos() {
  const MENU_ANTOJOS = useSalon().antojos
  const [productos, setProductos] = useState<ProductoApp[] | null>(null)
  useEnVivo(() => productosApp().then(setProductos).catch(() => setProductos(p => p ?? [])))   // lo disponible, en vivo
  const carrito = useCarrito()
  const grupos = [...new Set(MENU_ANTOJOS.map(a => a.grupo))]
  return (
    <>
      <Encabezado rotulo="Durante tu cita y en casa" titulo="Break y productos" bajada="Algo rico mientras te consentimos, y lo que usamos en el salón para cuidar tu color." />
      <main className="contenido space-y-10 px-6 pb-8 lg:grid lg:grid-cols-[1fr_1.4fr] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-16 lg:gap-y-12 lg:space-y-0">
        <section>
          <p className="rotulo">Siempre de cortesía</p>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {CORTESIAS_SIEMPRE.map(c => (
              <div key={c.nombre} className="overflow-hidden rounded-sm bg-white text-center">
                {c.foto
                  ? <img src={`./antojos/${c.foto}.jpg`} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  : <div className="flex aspect-square w-full items-center justify-center bg-marca-champan/50 font-display text-3xl text-marca-dorado-prof">té</div>}
                <p className="px-1 py-2 text-xs text-marca-negro">{c.nombre}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:row-span-2">
          <p className="rotulo">Menú del break</p>
          <h2 className="titulo mt-1 text-3xl">Para disfrutar en tu cita</h2>
          <p className="mt-2 text-sm leading-relaxed text-marca-gris">Pídelos en recepción. ¿Traes tu lunch? Tenemos microondas para calentarlo.</p>
          {grupos.map(g => (
            <div key={g} className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-marca-gris">{g}</p>
              <div className="mt-1">
                {MENU_ANTOJOS.filter(a => a.grupo === g).map(a => (
                  <div key={a.id} className="flex items-center gap-4 border-b border-marca-linea/70 py-3">
                    {a.foto
                      ? <img src={`./antojos/${a.foto}.jpg`} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-sm object-cover" />
                      : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-marca-champan/50 font-display text-xl text-marca-dorado-prof">{a.nombre[0]}</span>}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-marca-negro">{a.nombre}</p>
                      <p className="text-xs text-marca-gris">{[a.detalle, esComida(a) ? `Club: ${B.ambar.antojosComida}–${B.onix.antojosComida}%` : ''].filter(Boolean).join(' · ')}</p>
                    </div>
                    <p className="text-sm tabular-nums text-marca-negro">{pesos(a.precio)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="tarjeta mt-6 space-y-2 p-5 text-sm leading-relaxed text-marca-gris">
            <p className="rotulo">Con el {NOMBRE_CLUB}</p>
            <p>En la comida del break (no incluye bebidas): <span className="text-marca-negro">{NOMBRE_NIVEL.ambar} {B.ambar.antojosComida}% · {NOMBRE_NIVEL.dorado} {B.dorado.antojosComida}% · {NOMBRE_NIVEL.onix} {B.onix.antojosComida}%</span>.</p>
            <p>En {NOMBRE_NIVEL.onix}, además, comida y bebida del break de cortesía cada mes.</p>
          </div>
        </section>

        <section>
          <p className="rotulo">Cuidado en casa</p>
          <h2 className="titulo mt-1 text-3xl">Productos</h2>
          <MisPedidos />
          {productos === null && <p className="mt-4 text-sm text-marca-gris">Cargando productos…</p>}
          {productos?.length === 0 && (
            <div className="tarjeta mt-4 p-6">
              <p className="rotulo">Próximamente</p>
              <p className="titulo mt-2 text-2xl">El catálogo, aquí</p>
              <p className="mt-2 text-sm leading-relaxed text-marca-gris">
                Podrás ver precios y apartar para recoger en el salón. Con el {NOMBRE_CLUB} tus compras suman el doble de puntos y tienes descuento desde {NOMBRE_NIVEL.miel}.
              </p>
            </div>
          )}
          {!!productos?.length && (
            <div className="mt-4 space-y-3">
              {productos.map(p => <Producto key={p.id} p={p} enCarrito={carrito.find(i => i.productoId === p.id)?.cantidad || 0} />)}
              <p className="text-xs leading-relaxed text-marca-gris">Apártalos con tu cita (pagas todo junto) o cómpralos solos para recoger en el salón. Tienes 48 horas para pagar y, mientras, nadie más se los lleva.</p>
            </div>
          )}
          <p className="mt-4 border-l border-marca-dorado pl-3 text-xs leading-relaxed text-marca-gris">{POLITICAS.pedidos}</p>
          <a href={enlaceWhatsApp('Hola, quiero preguntar por un producto:')} className="boton-claro mt-6 w-full lg:w-auto"><MessageCircle size={16} strokeWidth={1.5} /> Pregunta por un producto</a>
        </section>
      </main>
    </>
  )
}
