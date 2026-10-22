import { MessageCircle } from 'lucide-react'
import Encabezado from '@/components/Encabezado'
import { NOMBRE_CLUB, POLITICAS, enlaceWhatsApp } from '@/salon'

// El catálogo vendrá del inventario de CB Control por la API (fase 3); mientras, se pregunta por WhatsApp.
export default function Productos() {
  return (
    <>
      <Encabezado titulo="Productos" bajada="Lo que usamos en el salón, para cuidar tu color en casa" />
      <main className="space-y-3 p-4">
        <div className="tarjeta">
          <p className="font-medium text-marca-negro">Muy pronto, el catálogo aquí</p>
          <p className="mt-1 text-sm text-marca-gris">
            Podrás ver precios y apartar para recoger en el salón. Con el {NOMBRE_CLUB} tus compras suman el doble de puntos y desbloqueas descuentos.
          </p>
        </div>
        <p className="px-1 text-xs text-marca-gris">{POLITICAS.pedidos}</p>
        <a href={enlaceWhatsApp('Hola, quiero preguntar por un producto:')} className="boton-claro w-full"><MessageCircle size={18} /> Pregunta por un producto</a>
      </main>
    </>
  )
}
