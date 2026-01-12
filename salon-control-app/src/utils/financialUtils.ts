/**
 * Centralized financial utilities for Salon Total Control
 * Ensures consistent arithmetic calculations across the system.
 */

export interface CommissionResult {
    totalCommission: number;
    perEmployeeCommission: number;
    percentageUsed: number;
}

/**
 * Formats a number as pesos (MXN)
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Calculates commission for one or more employees
 */
export const calculateCommission = (
    baseAmount: number,
    numEmployees: number = 1,
    overridePercentage?: number,
    defaultEmployeePercentage: number = 30
): CommissionResult => {
    const safeNumEmployees = numEmployees > 0 ? numEmployees : 1;

    const percentage = (overridePercentage !== undefined && overridePercentage > 0)
        ? overridePercentage
        : defaultEmployeePercentage;

    const totalCommission = (baseAmount * percentage) / 100;
    const perEmployeeCommission = totalCommission / safeNumEmployees;

    return {
        totalCommission,
        perEmployeeCommission,
        percentageUsed: percentage
    };
};

/**
 * Standard rounding to nearest 10 (Salon policy)
 */
export const roundToNextTen = (amount: number): number => {
    const units = amount % 10;
    if (units === 0) return amount;
    return amount + (10 - units);
};

export const esDecenaExacta = (amount: number): boolean => {
    return amount % 10 === 0;
};

/**
 * Full breakdown of a service/appointment charge
 * Using names compatible with existing UI components
 */
export interface ChargeBreakdown {
    subtotalServicios: number;
    descuentoPorcentaje: number;
    montoDescuento: number;
    subtotalConDescuento: number;
    montoRedondeo: number;
    propina: number;
    totalFinal: number;
}

export const calculateChargeBreakdown = (
    itemsSubtotal: number,
    discountPercentage: number = 0,
    tip: number = 0,
    prepayment: number = 0
): ChargeBreakdown => {
    const discountAmount = itemsSubtotal * (discountPercentage / 100);
    const totalWithDiscount = Math.max(0, itemsSubtotal - discountAmount);

    const remainingToPay = Math.max(0, totalWithDiscount - prepayment);
    const totalWithRounding = roundToNextTen(remainingToPay);
    const roundingAmount = totalWithRounding - remainingToPay;

    const totalFinal = totalWithRounding + tip;

    return {
        subtotalServicios: itemsSubtotal,
        descuentoPorcentaje: discountPercentage,
        montoDescuento: discountAmount,
        subtotalConDescuento: totalWithDiscount,
        montoRedondeo: roundingAmount,
        propina: tip,
        totalFinal
    };
};
