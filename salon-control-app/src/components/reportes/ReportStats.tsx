import { Calendar, DollarSign, Clock, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react';
import { ReportStats as IReportStats } from '../../types/reportes';
import { formatCurrency } from '../../utils/financialUtils';

interface ReportStatsProps {
  stats: IReportStats;
}

export default function ReportStats({ stats }: ReportStatsProps) {
  const {
    totalIngresos,
    totalIngresosCitas,
    totalIngresosVentas,
    totalGastos,
    gananciaNeta,
    saldosPendientes,
    citasCompletadas,
    totalVentas
  } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Ingresos Totales (Bruto)</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
            <p className="text-xs text-gray-500">Servicios + Productos</p>
          </div>
          <DollarSign size={24} className="text-green-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-red-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Gastos Totales</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalGastos)}</p>
            <p className="text-xs text-gray-500">Insumos y servicios</p>
          </div>
          <TrendingDown size={24} className="text-red-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-green-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Ganancia Neta</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(gananciaNeta)}</p>
            <p className="text-xs text-gray-500">Ingresos - Gastos</p>
          </div>
          <TrendingUp size={24} className="text-green-700" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Ingresos Servicios</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalIngresosCitas)}</p>
            <p className="text-xs text-gray-500">{citasCompletadas} completados</p>
          </div>
          <Calendar size={24} className="text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Ingresos Productos</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalIngresosVentas)}</p>
            <p className="text-xs text-gray-500">{totalVentas} ventas</p>
          </div>
          <ShoppingCart size={24} className="text-purple-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Saldos Pendientes</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(saldosPendientes)}</p>
            <p className="text-xs text-gray-500">Por cobrar</p>
          </div>
          <Clock size={24} className="text-orange-600" />
        </div>
      </div>
    </div>
  );
}