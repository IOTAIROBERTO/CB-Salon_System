import { useEffect, useState } from 'react';
import * as echarts from 'echarts';

export default function ReportesPage() {
  const [ventas, setVentas] = useState<any[]>([]);

  useEffect(() => {
    const ventasData = JSON.parse(localStorage.getItem('ventas') || '[]');
    setVentas(ventasData);
  }, []);

  useEffect(() => {
    if (ventas.length > 0) {
      renderChart('chart-semanal', 'Ventas Semanales', ventas);
      renderChart('chart-mensual', 'Ventas Mensuales', ventas);
      renderChart('chart-anual', 'Ventas Anuales', ventas);
    }
  }, [ventas]);

  const renderChart = (id: string, title: string, ventasData: any[]) => {
    const chartDom = document.getElementById(id);
    if (!chartDom) return;
    const chart = echarts.init(chartDom);

    const fechas = ventasData.map(v => new Date(v.fecha).toLocaleDateString());
    const valores = ventasData.map(v => v.precioCobrado);

    chart.setOption({
      title: { text: title },
      tooltip: {},
      xAxis: { type: 'category', data: fechas },
      yAxis: { type: 'value' },
      series: [
        {
          data: valores,
          type: 'bar'
        }
      ]
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>
      <div id="chart-semanal" className="w-full h-64 mb-6"></div>
      <div id="chart-mensual" className="w-full h-64 mb-6"></div>
      <div id="chart-anual" className="w-full h-64"></div>
    </div>
  );
}