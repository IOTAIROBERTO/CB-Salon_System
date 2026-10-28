// Llamadas a la API del salón (/api en la misma dirección de la app). Si la API no responde, las pantallas
// ofrecen WhatsApp como respaldo para que ninguna clienta se quede sin agendar.
export class ErrorApi extends Error { constructor(msg: string, public status = 0) { super(msg) } }

async function llamar<T>(ruta: string, init?: RequestInit): Promise<T> {
  let r: Response
  try {
    const ses = sesion()
    r = await fetch(`./api/${ruta}`, { ...init, headers: { 'Content-Type': 'application/json', ...(ses ? { Authorization: `Bearer ${ses}` } : {}), ...(init?.headers || {}) } })
  } catch {
    throw new ErrorApi('Sin conexión. Revisa tu internet o escríbenos por WhatsApp.')
  }
  const datos = await r.json().catch(() => ({}))
  if (r.status === 401 && sesion() && ruta === 'mi-club') salir()   // la sesión venció: se vuelve a pedir el código
  if (!r.ok) throw new ErrorApi(datos.error || 'No pudimos completar tu solicitud.', r.status)
  return datos as T
}

export interface ServicioEnLinea { id: string; nombre: string; categoria: string; precio: number; anticipo: number; duracion: number; descripcion?: string }
export const serviciosEnLinea = () => llamar<{ servicios: ServicioEnLinea[] }>('servicios').then(r => r.servicios)

export interface DiaLibre { fecha: string; horas: string[] }
export const disponibilidad = (servicioId: string, dias = 14) =>
  llamar<{ dias: DiaLibre[]; servicio: { anticipo: number } }>(`disponibilidad?servicioId=${encodeURIComponent(servicioId)}&dias=${dias}`)

export const crearCita = (datos: object) =>
  llamar<{ cita: { id: string; fecha: string; hora: string; servicio: string; anticipo: number } }>('citas', { method: 'POST', body: JSON.stringify(datos) })

export const unirmeClub = (datos: object) =>
  llamar<{ ok: boolean }>('club', { method: 'POST', body: JSON.stringify(datos) })

/** La app recuerda nombre y teléfono en este celular para no volver a escribirlos */
const CLAVE = 'cb-mis-datos'
export const misDatos = (): { nombre: string; telefono: string; cumple: string } => {
  try { return { nombre: '', telefono: '', cumple: '', ...JSON.parse(localStorage.getItem(CLAVE) || '{}') } } catch { return { nombre: '', telefono: '', cumple: '' } }
}
export const recordarDatos = (d: { nombre: string; telefono: string; cumple?: string }) => {
  try { localStorage.setItem(CLAVE, JSON.stringify(d)) } catch { /* modo privado */ }
}

/** Entrada con código por WhatsApp: la sesión firmada se guarda en este celular (90 días) */
const CLAVE_SESION = 'cb-sesion'
export const sesion = () => { try { return localStorage.getItem(CLAVE_SESION) } catch { return null } }
export const salir = () => { try { localStorage.removeItem(CLAVE_SESION) } catch { /* modo privado */ } }
export const pedirCodigo = (telefono: string, turnstile = '') => llamar<{ reto: string }>('acceso/codigo', { method: 'POST', body: JSON.stringify({ telefono, turnstile }) })
export async function verificarCodigo(reto: string, codigo: string) {
  const r = await llamar<{ sesion: string; telefono: string }>('acceso/verificar', { method: 'POST', body: JSON.stringify({ reto, codigo }) })
  try { localStorage.setItem(CLAVE_SESION, r.sesion) } catch { /* modo privado: solo esta vez */ }
  recordarDatos({ ...misDatos(), telefono: r.telefono })
  return r
}

/** Datos que se editan en CB Control y la app muestra (ver src/vivo.tsx) */
export interface DatosSalonVivos {
  salon: { nombre: string; telefono: string; whatsapp: string; direccion: string; comoLlegar: string; horario: string; email?: string }
  club: import('@salon/utils/lealtad').ParametrosCirculo
  antojos: import('@salon/data/menuAntojos').Antojo[]
}
export const salonEnVivo = () => llamar<DatosSalonVivos>('salon')

/** Consentimiento con enlace personal (firma_…): no pide entrar al Club */
export interface DatosFirma { nombre: string; servicio?: string; fecha?: string; hora?: string }
export const firmaPendiente = (id: string) => llamar<DatosFirma>(`firma/${encodeURIComponent(id)}`)
export const enviarFirma = (id: string, datos: object) =>
  llamar<{ ok: boolean }>(`firma/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify(datos) })

export interface MiClub {
  registrada: boolean; nombre?: string; enClub?: boolean; nivel?: string; nombreNivel?: string; puntos?: number; puntosNivel?: number
  siguiente?: { nivel: string; falta: number } | null; saldoTexto?: string; saldoFavor?: number; permanentes?: string[]
  disponibles?: { clave: string; titulo: string; puntos: number }[]; movimientos?: { fecha: string; concepto: string; puntos: number }[]
  proximas?: { fecha: string; hora: string; servicio: string; estado: string }[]
  porFirmar?: { id: string; servicio?: string; fecha?: string }[]
}
export const miClub = () => llamar<MiClub>('mi-club')
