import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ReportData, ReportPeriod } from '../../types/reportes';

interface ReportChartProps {
  data: ReportData[];
  period: ReportPeriod;
}

export default function ReportChart({ data, period }: ReportChartProps) {
  if (data.length === 0) return null;

  const formatPeriodLabel = (period: ReportPeriod): string => {
    switch (period) {
      case 'week': return 'Últimas 7 semanas';
      case 'month': return 'Últimos 6 meses';
      case 'year': return 'Últimos 3 años';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Evolución de Ingresos - {formatPeriodLabel(period)}
        </h2>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="periodo" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              labelFormatter={(label) => `Período: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey="ingresosCitas" 
              fill="#3B82F6" 
              name="Ingresos Servicios"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="ingresosVentas" 
              fill="#8B5CF6" 
              name="Ingresos Productos"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Servicios</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span>Productos</span>
        </div>
      </div>
    </div>
  );
}