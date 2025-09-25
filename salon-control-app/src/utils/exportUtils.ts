import { ReportData, ReportPeriod } from '../types/reportes';

export const exportReportToCSV = (reportData: ReportData[], period: ReportPeriod): void => {
  const csvContent = [
    ['Período', 'Ingresos Citas', 'Ingresos Ventas', 'Ingresos Totales', 'Servicios', 'Ventas Productos'],
    ...reportData.map(row => [
      row.periodo,
      row.ingresosCitas,
      row.ingresosVentas,
      row.ingresosTotales,
      row.servicios,
      row.ventasProductos
    ])
  ]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_${period}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};