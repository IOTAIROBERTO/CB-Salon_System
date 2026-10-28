// Lo que la app toma de CB Control (una sola fuente de verdad): datos del salón, políticas, catálogo y reglas del Club.
// Cuando exista la API (Cloudflare Workers), el catálogo y los puntos de cada clienta vendrán de ahí.
import { DATOS_SALON, POLITICAS, POLITICAS_RESERVA } from '@salon/data/datosSalon'
import catalogo from '@salon/data/servicios_dataset.json'

export { DATOS_SALON, POLITICAS, POLITICAS_RESERVA }
export { DESCRIPCIONES_SERVICIO } from '@salon/data/descripcionesServicios'
export { MENU_ANTOJOS, CORTESIAS_SIEMPRE } from '@salon/data/menuAntojos'
export {
  NOMBRE_CIRCULO as NOMBRE_CLUB, NOMBRE_NIVEL, NIVELES, BENEFICIOS_NIVEL, REGALOS_NIVEL, CLAVES_REGALO, ANIVERSARIO_PUNTOS, DIAS_PUNTOS_DOBLES,
  PARAMETROS_CIRCULO as REGLAS_CLUB, REGLA_CANJE, AVISO_GASTO, textoSaldoPuntos, montoCanje, montoTarjeta, multiplicador, umbral
} from '@salon/utils/lealtad'

export interface Servicio { id: string; nombre: string; categoria: string; precio: number; anticipo: number; duracion: number; descripcion?: string }

const CATEGORIAS: Record<string, string> = {
  color: 'Color', corte: 'Corte', tratamiento: 'Tratamientos', maquillaje: 'Maquillaje', peinado: 'Peinado'
}
export const nombreCategoria = (c: string) => CATEGORIAS[c] || 'Otros'

/** Servicios del salón en Hermosillo con precios 2027 (los de novia fuera de la ciudad se cotizan por WhatsApp) */
export const SERVICIOS: Servicio[] = (catalogo as { id: string; nombre: string; categoria: string; precio2027: number; anticipo2027: number; duracion: number }[])
  .filter(s => s.precio2027 > 0 && !/for[aá]neo/i.test(s.nombre))
  .map(s => ({ id: s.id, nombre: s.nombre, categoria: s.categoria, precio: s.precio2027, anticipo: s.anticipo2027, duracion: s.duracion }))

export const pesos = (n: number) => `$${n.toLocaleString('es-MX')}`

export const enlaceWhatsApp = (texto: string) => `https://wa.me/${DATOS_SALON.whatsapp}?text=${encodeURIComponent(texto)}`
export const ENLACE_MAPA = 'https://www.google.com/maps/search/?api=1&query=Cristina+Borquez+Beauty+Salon+Plaza+Galilea+Hermosillo'
export const ENLACE_INSTAGRAM = 'https://www.instagram.com/cristinaborquez.beauty/'
export const ENLACE_FACEBOOK = 'https://www.facebook.com/profile.php?id=100063481215682'
