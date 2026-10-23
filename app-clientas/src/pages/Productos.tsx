import { MessageCircle } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import { BENEFICIOS_NIVEL, CORTESIAS_SIEMPRE, MENU_ANTOJOS, NOMBRE_CLUB, NOMBRE_NIVEL, POLITICAS, enlaceWhatsApp, pesos } from '@/salon'

// El menú de antojos sale de CB Control (data/menuAntojos.ts). El catálogo de productos vendrá del inventario por la API
// (fase 3); mientras, se pregunta por WhatsApp.
const grupos = [...new Set(MENU_ANTOJOS.map(a => a.grupo))]
const B = BENEFICIOS_NIVEL

export default function Productos() {
  return (
    <>
      <Encabezado rotulo="Durante tu cita y en casa" titulo="Antojos y productos" bajada="Algo rico mientras te consentimos, y lo que usamos en el salón para cuidar tu color." />
      <main className="space-y-10 px-6 pb-8">
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

        <section>
          <p className="rotulo">Menú de antojos</p>
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
                      <p className="text-xs text-marca-gris">{[a.detalle, a.seleccion ? `Club: ${B.ambar.antojosSeleccion}–${B.onix.antojosSeleccion}%` : ''].filter(Boolean).join(' · ')}</p>
                    </div>
                    <p className="text-sm tabular-nums text-marca-negro">{pesos(a.precio)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="tarjeta mt-6 space-y-2 p-5 text-sm leading-relaxed text-marca-gris">
            <p className="rotulo">Con el {NOMBRE_CLUB}</p>
            <p><span className="text-marca-negro">{NOMBRE_NIVEL.ambar}:</span> {B.ambar.antojosSeleccion}% en waffles, snacks y galletas.</p>
            <p><span className="text-marca-negro">{NOMBRE_NIVEL.dorado}:</span> {B.dorado.antojosSeleccion}% en waffles, snacks y galletas.</p>
            <p><span className="text-marca-negro">{NOMBRE_NIVEL.onix}:</span> {B.onix.antojosSeleccion}% en waffles, snacks y galletas, {B.onix.antojosResto}% en todo lo demás y un antojo con bebida de cortesía cada mes.</p>
          </div>
        </section>

        <section>
          <p className="rotulo">Cuidado en casa</p>
          <h2 className="titulo mt-1 text-3xl">Productos</h2>
          <div className="tarjeta mt-4 p-6">
            <p className="rotulo">Próximamente</p>
            <p className="titulo mt-2 text-2xl">El catálogo, aquí</p>
            <p className="mt-2 text-sm leading-relaxed text-marca-gris">
              Podrás ver precios y apartar para recoger en el salón. Con el {NOMBRE_CLUB} tus compras suman el doble de puntos y tienes descuento desde {NOMBRE_NIVEL.miel}.
            </p>
          </div>
          <p className="mt-4 border-l border-marca-dorado pl-3 text-xs leading-relaxed text-marca-gris">{POLITICAS.pedidos}</p>
          <a href={enlaceWhatsApp('Hola, quiero preguntar por un producto:')} className="boton-claro mt-6 w-full"><MessageCircle size={16} strokeWidth={1.5} /> Pregunta por un producto</a>
        </section>
      </main>
    </>
  )
}
