import { Calendar, DollarSign, Clock, ShoppingCart } from 'lucide-react';
import { ReportStats as IReportStats } from '../../types/reportes';

interface ReportStatsProps {
  stats: IReportStats;
}

export default function ReportStats({ stats }: ReportStatsProps) {
  const {
    totalIngresos,
    totalIngresosCitas,
    totalIngresosVentas,
    saldosPendientes,
    citasCompletadas,
    totalVentas
  } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Ingresos Totales</p>
            <p className="text-2xl font-bold text-green-600">${totalIngresos.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Servicios + Productos</p>
          </div>
          <DollarSign size={24} className="text-green-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Ingresos Servicios</p>
            <p className="text-2xl font-bold text-blue-600">${totalIngresosCitas.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{citasCompletadas} completados</p>
          </div>
          <Calendar size={24} className="text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Ingresos Productos</p>
            <p className="text-2xl font-bold text-purple-600">${totalIngresosVentas.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{totalVentas} ventas</p>
          </div>
          <ShoppingCart size={24} className="text-purple-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Saldos Pendientes</p>
            <p className="text-2xl font-bold text-orange-600">${saldosPendientes.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Por cobrar</p>
          </div>
          <Clock size={24} className="text-orange-600" />
        </div>
      </div>
    </div>
  );
}