import { Cita, Venta, ReportData, ReportStats, ReportPeriod } from '../types/reportes';
import { Expense } from '../db/db';

export const calculateReportStats = (
  citas: Cita[],
  ventas: Venta[],
  gastos: Expense[] = []
): ReportStats => {
  const citasCompletadas = citas.filter(c => c.estado === 'completada');
  const totalIngresosCitas = citasCompletadas.reduce((sum, c) => sum + (c.precioFinal || 0), 0);
  const totalIngresosVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const totalIngresos = totalIngresosCitas + totalIngresosVentas;

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const gananciaNeta = totalIngresos - totalGastos;

  const saldosPendientes = citas
    .filter(c => c.estado !== 'cancelada')
    .reduce((sum, c) => sum + (c.saldoPendiente || 0), 0);

  return {
    totalIngresos,
    totalIngresosCitas,
    totalIngresosVentas,
    totalGastos,
    gananciaNeta,
    saldosPendientes,
    citasCompletadas: citasCompletadas.length,
    totalVentas: ventas.length
  };
};

export const generateReportData = (
  citas: Cita[],
  ventas: Venta[],
  period: ReportPeriod
): ReportData[] => {
  const now = new Date();
  const data: ReportData[] = [];

  switch (period) {
    case 'week':
      // Últimas 7 semanas
      for (let i = 6; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekCitas = citas.filter(cita => {
          const citaDate = new Date(cita.fecha);
          return citaDate >= weekStart && citaDate <= weekEnd && cita.estado === 'completada';
        });

        const weekVentas = ventas.filter(venta => {
          const ventaDate = new Date(venta.fecha);
          return ventaDate >= weekStart && ventaDate <= weekEnd;
        });

        const ingresosCitas = weekCitas.reduce((sum, c) => sum + (c.precioFinal || 0), 0);
        const ingresosVentas = weekVentas.reduce((sum, v) => sum + v.total, 0);

        data.push({
          periodo: `Sem ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          ingresosCitas,
          ingresosVentas,
          ingresosTotales: ingresosCitas + ingresosVentas,
          gastos: 0, // Placeholder for now or calculate per period if needed
          gananciaNeta: ingresosCitas + ingresosVentas,
          servicios: weekCitas.length,
          ventasProductos: weekVentas.length
        });
      }
      break;

    case 'month':
      // Últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(now.getMonth() - i);

        const monthCitas = citas.filter(cita => {
          const citaDate = new Date(cita.fecha);
          return (
            citaDate.getMonth() === monthDate.getMonth() &&
            citaDate.getFullYear() === monthDate.getFullYear() &&
            cita.estado === 'completada'
          );
        });

        const monthVentas = ventas.filter(venta => {
          const ventaDate = new Date(venta.fecha);
          return (
            ventaDate.getMonth() === monthDate.getMonth() &&
            ventaDate.getFullYear() === monthDate.getFullYear()
          );
        });

        const ingresosCitas = monthCitas.reduce((sum, c) => sum + (c.precioFinal || 0), 0);
        const ingresosVentas = monthVentas.reduce((sum, v) => sum + v.total, 0);

        data.push({
          periodo: monthDate.toLocaleDateString('es-ES', { month: 'short' }),
          ingresosCitas,
          ingresosVentas,
          ingresosTotales: ingresosCitas + ingresosVentas,
          gastos: 0,
          gananciaNeta: ingresosCitas + ingresosVentas,
          servicios: monthCitas.length,
          ventasProductos: monthVentas.length
        });
      }
      break;

    case 'year':
      // Últimos 3 años
      for (let i = 2; i >= 0; i--) {
        const yearDate = new Date(now);
        yearDate.setFullYear(now.getFullYear() - i);

        const yearCitas = citas.filter(cita => {
          const citaDate = new Date(cita.fecha);
          return citaDate.getFullYear() === yearDate.getFullYear() && cita.estado === 'completada';
        });

        const yearVentas = ventas.filter(venta => {
          const ventaDate = new Date(venta.fecha);
          return ventaDate.getFullYear() === yearDate.getFullYear();
        });

        const ingresosCitas = yearCitas.reduce((sum, c) => sum + (c.precioFinal || 0), 0);
        const ingresosVentas = yearVentas.reduce((sum, v) => sum + v.total, 0);

        data.push({
          periodo: yearDate.getFullYear().toString(),
          ingresosCitas,
          ingresosVentas,
          ingresosTotales: ingresosCitas + ingresosVentas,
          gastos: 0,
          gananciaNeta: ingresosCitas + ingresosVentas,
          servicios: yearCitas.length,
          ventasProductos: yearVentas.length
        });
      }
      break;
  }

  return data;
};

export const getClienteName = (clienteId: string, clientes: any[]): string => {
  return clientes.find(c => c.id === clienteId)?.nombre || 'Cliente no encontrado';
};

export const getServicioName = (servicioId: string, servicios: any[]): string => {
  return servicios.find(s => s.id === servicioId)?.nombre || 'Servicio no encontrado';
};