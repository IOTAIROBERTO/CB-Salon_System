// Cobro de una cita: el precio base y el «cobro exprés» (un toque, sin cambios), con los mismos cálculos que el cobro
// completo (CobroModal) para que reportes, comisiones y puntos del Club salgan iguales. Lógica pura, sin base de datos.
import { calculateChargeBreakdown } from './financialUtils';

interface CitaCobro { servicioId: string; precioAcordado?: number; montoAnticipo?: number; anticipoConfirmado?: boolean }
interface ServicioCobro { id: string; precioSugerido: number }

/** Precio del servicio principal: el que Cristina acordó al valorar si sigue siendo ese servicio; si no, el de catálogo */
export const precioBase = (cita: CitaCobro, servicioId: string, servicios: ServicioCobro[]) =>
  servicioId === cita.servicioId && cita.precioAcordado != null
    ? cita.precioAcordado
    : servicios.find(s => s.id === servicioId)?.precioSugerido || 0;

/** Cobro sin cambios: sin adicionales, descuento, propina ni saldo; solo se descuenta el anticipo ya recibido.
 *  `datos` es lo mismo que el cobro completo le pasa a completarCita. */
export function cobroExpres(cita: CitaCobro, servicios: ServicioCobro[]) {
  const anticipo = cita.anticipoConfirmado ? cita.montoAnticipo || 0 : 0;
  const c = calculateChargeBreakdown(precioBase(cita, cita.servicioId, servicios), 0, 0, anticipo);
  return {
    precioFinal: c.subtotalConDescuento + c.montoRedondeo + c.propina,   // igual que CobroModal: total sin restar anticipo
    aCobrar: c.totalFinal,                                             // lo que se paga hoy
    anticipo, redondeo: c.montoRedondeo, subtotal: c.subtotalConDescuento,
    datos: {
      servicioSeleccionado: cita.servicioId, serviciosAdicionales: [], descuento: 0, tipoDescuento: 'porcentaje',
      subtotalServicios: c.subtotalServicios, montoDescuento: 0, montoRedondeo: c.montoRedondeo, propina: 0,
      anticipoRecibido: anticipo, porcentajeOriginal: 0, subtotalConDescuento: c.subtotalConDescuento, pagadoConSaldo: 0
    }
  };
}
