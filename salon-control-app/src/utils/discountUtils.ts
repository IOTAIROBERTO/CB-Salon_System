// src/utils/discountUtils.ts

export interface CalculoFinal {
  subtotalServicios: number;
  descuentoPorcentaje: number;
  montoDescuento: number;
  subtotalConDescuento: number;
  montoRedondeo: number;
  propina: number;
  totalFinal: number;
}

// Opciones de descuento por porcentaje
export const DESCUENTO_PORCENTAJE_OPTIONS = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50
];

/**
 * Redondea un monto hacia arriba a la siguiente decena
 * Ejemplo: 347 -> 350, 350 -> 350, 352 -> 360
 */
export const redondearADecenaSiguiente = (monto: number): number => {
  const unidades = monto % 10;
  if (unidades === 0) {
    return monto; // Ya es una decena exacta
  }
  return monto + (10 - unidades);
};

/**
 * Calcula el monto de redondeo necesario para llegar a la siguiente decena
 */
export const calcularMontoRedondeo = (monto: number): number => {
  const montoRedondeado = redondearADecenaSiguiente(monto);
  return montoRedondeado - monto;
};

/**
 * Calcula el descuento por porcentaje
 */
export const calcularDescuentoPorcentaje = (montoOriginal: number, porcentaje: number): number => {
  return montoOriginal * (porcentaje / 100);
};

/**
 * Calcula todos los valores finales incluyendo descuento, redondeo y propina
 */
export const calcularTotalFinal = (
  subtotalServicios: number,
  porcentajeDescuento: number,
  propina: number,
  anticipo: number
): CalculoFinal => {
  // 1. Calcular descuento
  const montoDescuento = calcularDescuentoPorcentaje(subtotalServicios, porcentajeDescuento);
  const subtotalConDescuento = subtotalServicios - montoDescuento;
  
  // 2. Calcular lo que falta por pagar después del anticipo
  const saldoSinRedondeo = Math.max(0, subtotalConDescuento - anticipo);
  
  // 3. Calcular redondeo solo del saldo pendiente (no del subtotal)
  const montoRedondeo = calcularMontoRedondeo(saldoSinRedondeo);
  
  // 4. Calcular total final
  const totalFinal = saldoSinRedondeo + montoRedondeo + propina;

  return {
    subtotalServicios,
    descuentoPorcentaje: porcentajeDescuento,
    montoDescuento,
    subtotalConDescuento,
    montoRedondeo,
    propina,
    totalFinal
  };
};

/**
 * Formatea un monto como moneda
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};

/**
 * Verifica si un número es una decena exacta
 */
export const esDecenaExacta = (numero: number): boolean => {
  return numero % 10 === 0;
};