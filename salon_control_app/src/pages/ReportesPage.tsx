import { useEffect, useState } from 'react';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart
} from 'lucide-react';

interface Cita {
  id: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'iniciada' | 'completada' | 'cancelada';
  precioFinal?: number;
  montoAnticipo?: number;
  saldoPendiente?: number;
  metodoPagoFinal?: string;
  metodoPagoAnticipo?: string;
  fechaCompletada?: string;
}

interface Venta {
  id: string;
  fecha: string;
  clienteId?: string;
  clienteNombre?: string;
  productos: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
  total: number;
  metodoPago: string;
  notas?: string;
}

interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
}

interface ServicioCatalogo {
  id: string;
  nombre: string;
  precioSugerido: number;
}

interface ReportData {
  periodo: string;
  ingresosCitas: number;
  ingresosVentas: number;
  ingresosTotales: number;
  servicios: number;
  ventasProductos: number;
}

export default function ReportesPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogoServicios, setCatalogoServicios] = useState<ServicioCatalogo[]>([]);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showDetails, setShowDetails] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'completada' | 'confirmada' | 'cancelada'>('all');

  useEffect(() => {
    const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
    const ventasData = JSON.parse(localStorage.getItem('ventas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const catalogoData = JSON.parse(localStorage.getItem('servicios') || '[]');

    setCitas(citasData);
    setVentas(ventasData);
    setClientes(clientesData);
    setCatalogoServicios(catalogoData);
  }, []);

  const getCliente = (id: string) =>
    clientes.find(c => c.id === id)?.nombre || 'Cliente no encontrado';

  const getServicioCatalogo = (id: string) =>
    catalogoServicios.find(s => s.id === id)?.nombre || 'Servicio no encontrado';

  // Datos de reportes
  const getReportData = (): ReportData[] => {
    const now = new Date();
    const data: ReportData[] = [];

    switch (reportPeriod) {
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
            servicios: yearCitas.length,
            ventasProductos: yearVentas.length
          });
        }
        break;
    }

    return data;
  };

  const reportData = getReportData();
  const maxIngresos = Math.max(...reportData.map(d => d.ingresosTotales), 1);

  // Estadísticas generales
  const citasCompletadas = citas.filter(c => c.estado === 'completada');
  const totalIngresosCitas = citasCompletadas.reduce((sum, c) => sum + (c.precioFinal || 0), 0);
  const totalIngresosVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const totalIngresos = totalIngresosCitas + totalIngresosVentas;

  const totalAnticipos = citas.reduce((sum, c) => sum + (c.montoAnticipo || 0), 0);
  const saldosPendientes = citas
    .filter(c => c.estado !== 'cancelada')
    .reduce((sum, c) => sum + (c.saldoPendiente || 0), 0);

  const promedioServicio =
    citasCompletadas.length > 0 ? totalIngresosCitas / citasCompletadas.length : 0;

  const exportToCSV = () => {
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
    a.download = `reporte_${reportPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 justify-center"
          >
            <Download size={20} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <p className="text-xs text-gray-500">{citasCompletadas.length} completados</p>
            </div>
            <Calendar size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Productos</p>
              <p className="text-2xl font-bold text-purple-600">${totalIngresosVentas.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{ventas.length} ventas</p>
            </div>
            <ShoppingCart size={24} className="text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio Servicio</p>
              <p className="text-2xl font-bold text-orange-600">${promedioServicio.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Por servicio completado</p>
            </div>
            <TrendingUp size={24} className="text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Anticipos</p>
              <p className="text-2xl font-bold text-blue-600">${totalAnticipos.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Anticipos recibidos</p>
            </div>
            <Users size={24} className="text-blue-600" />
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
    </div>
  );
}
