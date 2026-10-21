// Saldo a favor y tarjetas de regalo (respuestas de la v2): la tarjeta se vende con
// folio y vale 6 meses para activarse; activada, su monto pasa a saldo a favor de la
// clienta y ese saldo no vence. Se usa como anticipo o como pago total o parcial de
// servicios y productos. Lógica pura, sin base de datos.

export const MONTOS_TARJETA = [300, 500, 1000, 1500, 2000, 2500];
export const MESES_PARA_ACTIVAR = 6;

interface TarjetaS { folio: string; monto: number; fechaVenta: string; activadaPor?: string }
interface MovS { clienteId: string; monto: number }

export type EstadoTarjeta = 'por activar' | 'activada' | 'vencida';

const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const normalizarFolio = (f: string) => f.trim().toUpperCase().replace(/\s+/g, '');

/** Último día para activar la tarjeta (YYYY-MM-DD) */
export const venceActivacion = (fechaVenta: string) => {
  // Con hora (ISO) se toma el día local de la venta; solo fecha, se lee como día local
  const d = fechaVenta.length > 10 ? new Date(fechaVenta) : new Date(`${fechaVenta}T12:00:00`);
  d.setMonth(d.getMonth() + MESES_PARA_ACTIVAR);
  return isoLocal(d);
};

export const estadoTarjeta = (t: TarjetaS, hoy = new Date()): EstadoTarjeta =>
  t.activadaPor ? 'activada' : isoLocal(hoy) > venceActivacion(t.fechaVenta) ? 'vencida' : 'por activar';

/** Por qué no se puede activar (o null si se puede) */
export const errorActivacion = (t: TarjetaS | undefined, hoy = new Date()) =>
  !t ? 'No existe una tarjeta con ese folio'
    : t.activadaPor ? 'Esa tarjeta ya se activó'
      : estadoTarjeta(t, hoy) === 'vencida' ? `Venció el ${venceActivacion(t.fechaVenta)}: tenía ${MESES_PARA_ACTIVAR} meses para activarse` : null;

export const saldoDe = (movimientos: MovS[], clienteId: string) =>
  Math.round(movimientos.filter(m => m.clienteId === clienteId).reduce((t, m) => t + m.monto, 0) * 100) / 100;

/** Cuánto saldo se puede usar en un cobro: no más de lo disponible ni de lo que falta pagar */
export const saldoUsable = (disponible: number, porPagar: number) => Math.max(0, Math.min(disponible, porPagar));
