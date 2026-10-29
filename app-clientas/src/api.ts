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
  llamar<{ cita: { id: string; fecha: string; hora: string; servicio: string; anticipo: number; enlace: string } }>('citas', { method: 'POST', body: JSON.stringify(datos) })

export const unirmeClub = (datos: object) =>
  llamar<{ ok: boolean }>('club', { method: 'POST', body: JSON.stringify(datos) })

/** La app recuerda en este celular (si la clienta quiere) su nombre, teléfono y último servicio para no volver a
 *  escribirlos; solo aquí, nunca se mandan a otro lado. «Olvidar mis datos» los borra. */
const CLAVE = 'cb-mis-datos'
export interface MisDatos { nombre: string; telefono: string; cumple: string; ultimoServicio?: string }
export const misDatos = (): MisDatos => {
  try { return { nombre: '', telefono: '', cumple: '', ...JSON.parse(localStorage.getItem(CLAVE) || '{}') } } catch { return { nombre: '', telefono: '', cumple: '' } }
}
export const recordarDatos = (d: Partial<MisDatos>) => {
  try { localStorage.setItem(CLAVE, JSON.stringify({ ...misDatos(), ...d })) } catch { /* modo privado */ }
}
export const olvidarDatos = () => {
  try { localStorage.removeItem(CLAVE); localStorage.removeItem(CLAVE_CITAS) } catch { /* modo privado */ }
}

/** «Mi cita»: enlace personal de cada cita (<id>.<secreto>) para verla, cambiarla o cancelarla sin cuenta */
export interface VistaCita {
  servicio: string; servicioId: string; duracion?: number; fecha: string; hora: string
  estado: 'pendiente' | 'confirmada' | 'iniciada' | 'completada' | 'cancelada' | 'no_llego'
  precio: number; precioAcordado: boolean; anticipo: number; anticipoPagado: boolean; formaAnticipo?: string; datosPago: string
  anticipoASaldo?: number; anticipoPerdido?: number; sinCosto: boolean; puedeCancelar: boolean; puedeReagendar: boolean
  resumen: string; aceptadaEn?: string; porAceptar: boolean; puedeCambiarServicio: boolean
}
const rutaCita = (ref: string) => `cita/${encodeURIComponent(ref)}`
export const miCita = (ref: string) => llamar<VistaCita>(rutaCita(ref))
export const cancelarMiCita = (ref: string) => llamar<VistaCita>(`${rutaCita(ref)}/cancelar`, { method: 'POST', body: '{}' })
export const reagendarMiCita = (ref: string, fecha: string, hora: string, servicioId?: string) =>
  llamar<VistaCita>(`${rutaCita(ref)}/reagendar`, { method: 'POST', body: JSON.stringify({ fecha, hora, servicioId }) })
/** Acepta el resumen que dejó Cristina al valorar (lo que se hará, precio final y anticipo) */
export const aceptarMiCita = (ref: string) => llamar<VistaCita>(`${rutaCita(ref)}/aceptar`, { method: 'POST', body: '{}' })

/** Las citas que se pidieron o abrieron en este celular (para mostrar la próxima en Inicio) */
const CLAVE_CITAS = 'cb-mis-citas'
export interface CitaGuardada { ref: string; fecha: string; hora: string; servicio: string }
export const citasGuardadas = (): CitaGuardada[] => { try { return JSON.parse(localStorage.getItem(CLAVE_CITAS) || '[]') } catch { return [] } }
export const guardarCita = (c: CitaGuardada) => {
  try { localStorage.setItem(CLAVE_CITAS, JSON.stringify([c, ...citasGuardadas().filter(x => x.ref !== c.ref)].slice(0, 10))) } catch { /* modo privado */ }
}
export const olvidarCita = (ref: string) => {
  try { localStorage.setItem(CLAVE_CITAS, JSON.stringify(citasGuardadas().filter(x => x.ref !== ref))) } catch { /* modo privado */ }
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
