// Llamadas a la API del salón (/api en la misma dirección de la app). Si la API no responde, las pantallas
// ofrecen WhatsApp como respaldo para que ninguna clienta se quede sin agendar.
export class ErrorApi extends Error { constructor(msg: string, public status = 0) { super(msg) } }

async function llamar<T>(ruta: string, init?: RequestInit): Promise<T> {
  let r: Response
  try {
    r = await fetch(`./api/${ruta}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  } catch {
    throw new ErrorApi('Sin conexión. Revisa tu internet o escríbenos por WhatsApp.')
  }
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErrorApi(datos.error || 'No pudimos completar tu solicitud.', r.status)
  return datos as T
}

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
