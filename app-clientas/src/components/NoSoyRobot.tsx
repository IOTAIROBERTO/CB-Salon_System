import { useEffect, useRef } from 'react'

// Cloudflare Turnstile («no soy robot»): casi siempre invisible, solo pide un clic si duda. La llave del sitio es pública.
// Vacía = apagado (la API tampoco lo exige mientras no tenga TURNSTILE_SECRETO). Para encenderlo: primero esta llave
// (y publicar), después el secreto en Cloudflare; al revés, la API rechazaría los formularios de la app vieja.
// ponytail: llave en el código; pasarla a variable de compilación si algún día hay más de un sitio
export const LLAVE_TURNSTILE = '0x4AAAAAAFpNP41ffM88iuiF'
export const conTurnstile = !!LLAVE_TURNSTILE

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: object) => string; remove: (id: string) => void } } }

let script: Promise<void> | null = null
const cargar = () => script ??= new Promise<void>((ok, mal) => {
  const s = document.createElement('script')
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  s.async = true
  s.onload = () => ok()
  s.onerror = () => { script = null; mal() }
  document.head.appendChild(s)
})

/** Entrega el token (vacío si vence). Cada token sirve una vez: para otro envío, montarlo de nuevo (cambiar su key).
 *  Si el widget no carga, avisa con «error» para no dejar el botón bloqueado: la API decide (y ofrece WhatsApp). */
export default function NoSoyRobot({ onToken }: { onToken: (token: string) => void }) {
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!conTurnstile) return
    let id: string | undefined
    cargar().then(() => {
      if (!caja.current || !window.turnstile) return
      id = window.turnstile.render(caja.current, {
        sitekey: LLAVE_TURNSTILE, appearance: 'interaction-only', language: 'es',
        callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken('error')
      })
    }).catch(() => onToken('error'))
    return () => { if (id) window.turnstile?.remove(id) }
  }, [])
  return conTurnstile ? <div ref={caja} /> : null
}
