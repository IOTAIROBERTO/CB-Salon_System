// Lo que la app toma de CB Control (una sola fuente de verdad): datos del salón, políticas y reglas del Club.
// El catálogo (nombres, precios, descripciones) llega en vivo de la API: nunca se copia aquí.
import { DATOS_SALON, POLITICAS, POLITICAS_RESERVA } from '@salon/data/datosSalon'

export { DATOS_SALON, POLITICAS, POLITICAS_RESERVA }
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

export const pesos = (n: number) => `$${n.toLocaleString('es-MX')}`

// El número llega en vivo de CB Control (Configuración → General) con /api/salon; mientras, el del código
let whatsapp = DATOS_SALON.whatsapp
export const usarWhatsApp = (numero: string) => { if (numero) whatsapp = numero }
export const enlaceWhatsApp = (texto: string) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`
export const ENLACE_MAPA = 'https://www.google.com/maps/search/?api=1&query=Cristina+Borquez+Beauty+Salon+Plaza+Galilea+Hermosillo'
export const ENLACE_INSTAGRAM = 'https://www.instagram.com/cristinaborquez.beauty/'
export const ENLACE_FACEBOOK = 'https://www.facebook.com/profile.php?id=100063481215682'
