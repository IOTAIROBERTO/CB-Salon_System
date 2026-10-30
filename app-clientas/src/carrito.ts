import { useEffect, useState } from 'react'

// «Mi carrito» en este celular: los productos que va juntando. Al pedir su cita se apartan con ella, o los aparta solos
// («Solo comprar»); en los dos casos se pagan con plazo (salon-control-app/src/utils/pedidos.ts).
export interface EnCarrito { productoId: string; nombre: string; precio: number; cantidad: number; disponible: number }

const CLAVE = 'cb-carrito', EVENTO = 'cb-carrito'
export const leerCarrito = (): EnCarrito[] => { try { return JSON.parse(localStorage.getItem(CLAVE) || '[]') } catch { return [] } }
const guardar = (c: EnCarrito[]) => {
  try { localStorage.setItem(CLAVE, JSON.stringify(c.filter(i => i.cantidad > 0))) } catch { /* modo privado */ }
  window.dispatchEvent(new Event(EVENTO))
}
/** Suma (o resta) piezas, sin pasar de lo disponible */
export const cambiarCantidad = (p: Omit<EnCarrito, 'cantidad'>, delta: number) => {
  const c = leerCarrito(), i = c.find(x => x.productoId === p.productoId)
  const cantidad = Math.max(0, Math.min(p.disponible, (i?.cantidad || 0) + delta))
  guardar(i ? c.map(x => x.productoId === p.productoId ? { ...x, ...p, cantidad } : x) : [...c, { ...p, cantidad }])
}
export const vaciarCarrito = () => guardar([])
export const totalCarrito = (c: EnCarrito[]) => c.reduce((t, i) => t + i.precio * i.cantidad, 0)
/** Lo que se manda a la API: solo producto y cantidad (el precio lo pone el salón) */
export const paraApartar = (c: EnCarrito[]) => c.map(({ productoId, cantidad }) => ({ productoId, cantidad }))

/** El carrito, al día en todas las pantallas (y entre pestañas) */
export function useCarrito() {
  const [c, setC] = useState(leerCarrito)
  useEffect(() => {
    const actualizar = () => setC(leerCarrito())
    window.addEventListener(EVENTO, actualizar)
    window.addEventListener('storage', actualizar)
    return () => { window.removeEventListener(EVENTO, actualizar); window.removeEventListener('storage', actualizar) }
  }, [])
  return c
}

/** «el jueves 30 de octubre a las 10:00 (faltan 1 d 3 h)» */
export function plazo(iso: string) {
  const d = new Date(iso), min = Math.round((d.getTime() - Date.now()) / 60000)
  const cuando = `el ${d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
  if (min <= 0) return cuando
  return `${cuando} (faltan ${min >= 1440 ? `${Math.floor(min / 1440)} d ${Math.floor((min % 1440) / 60)} h` : min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`})`
}
