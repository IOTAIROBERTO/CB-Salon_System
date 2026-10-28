import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { DATOS_SALON, MENU_ANTOJOS, REGLAS_CLUB, usarWhatsApp } from '@/salon'
import { salonEnVivo, type DatosSalonVivos } from '@/api'

// Lo que se edita en CB Control y la app muestra (datos del salón, horario, reglas del Club, precios de antojos) llega
// en vivo de /api/salon: al abrir, al volver a la app y cada minuto. Mientras tanto, los valores del código.
const INICIAL: DatosSalonVivos = {
  salon: { ...DATOS_SALON },
  club: REGLAS_CLUB,
  antojos: MENU_ANTOJOS
}
const Datos = createContext<DatosSalonVivos>(INICIAL)
export const useSalon = () => useContext(Datos)

/** Corre `cargar` al montar, cuando la app vuelve a estar a la vista y cada `ms` (por omisión, cada minuto) */
export function useEnVivo(cargar: () => unknown, ms = 60_000, activo = true) {
  const ultima = useRef(cargar)
  ultima.current = cargar
  useEffect(() => {
    if (!activo) return
    const correr = () => { if (document.visibilityState === 'visible') ultima.current() }
    correr()
    const id = setInterval(correr, ms)
    document.addEventListener('visibilitychange', correr)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', correr) }
  }, [ms, activo])
}

export function DatosVivos({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState(INICIAL)
  useEnVivo(() => salonEnVivo().then(d => { usarWhatsApp(d.salon.whatsapp); setDatos(d) }).catch(() => { /* sin red: se queda lo último */ }))
  return <Datos.Provider value={datos}>{children}</Datos.Provider>
}
