import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Calendar, DollarSign, Users, TrendingUp, Download, Filter } from 'lucide-react';

interface Venta {
  id: string;
  fecha: string;
  clienteId: string;
  servicioId: string;
  precioCobrado: number;
  anticipoPagado: number;
  saldoPendiente: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
}

interface Cliente {
  id: string;
  nombre: string;
}

interface Servicio {
  id: string;
  nombre: string;
  precioActualizado: number;
  categoria?: string;
}

interface Cita {
  id: string;
  fecha: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
}

export default function ReportesPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('ventas');

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  useEffect(() => {
    const ventasData = JSON.parse(localStorage.getItem('ventas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');
    const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
    
    setVentas(ventasData);
    setClientes(clientesData);
    setServicios(serviciosData);
    setCitas(citasData);
  }, []);

  // Filtrar datos por rango de fechas
  const filteredVentas = useMemo(() => {
    return ventas.filter(venta => {
      const ventaDate = new Date(venta.fecha).toISOString().split('T')[0];
      return ventaDate >= dateRange.start && ventaDate <= dateRange.end;
    });
  }, [ventas, dateRange]);

  const filteredCitas = useMemo(() => {
    return citas.filter(cita => {
      const citaDate = new Date(cita.fecha).toISOString().split('T')[0];
      return citaDate >= dateRange.start && citaDate <= dateRange.end;
    });
  }, [citas, dateRange]);

  // Datos para gráfico de ventas por día
  const ventasPorDia = useMemo(() => {
    const ventasGrouped = filteredVentas.reduce((acc, venta) => {
      const fecha = new Date(venta.fecha).toLocaleDateString('es-ES');
      if (!acc[fecha]) {
        acc[fecha] = { fecha, ventas: 0, ingresos: 0 };
      }
      acc[fecha].ventas += 1;
      acc[fecha].ingresos += venta.precioCobrado;
      return acc;
    }, {} as Record<string, { fecha: string; ventas: number; ingresos: number }>);

    return Object.values(ventasGrouped).sort((a, b) => 
      new Date(a.fecha.split('/').reverse().join('-')).getTime() - 
      new Date(b.fecha.split('/').reverse().join('-')).getTime()
    );
  }, [filteredVentas]);

  // Datos para gráfico de servicios más populares
  const serviciosMasPopulares = useMemo(() => {
    const serviciosCount = filteredVentas.reduce((acc, venta) => {
      const servicio = servicios.find(s => s.id === venta.servicioId);
      const nombre = servicio?.nombre || 'Servicio desconocido';
      if (!acc[nombre]) {
        acc[nombre] = { nombre, count: 0, ingresos: 0 };
      }
      acc[nombre].count += 1;
      acc[nombre].ingresos += venta.precioCobrado;
      return acc;
    }, {} as Record<string, { nombre: string; count: number; ingresos: number }>);

    return Object.values(serviciosCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredVentas, servicios]);

  // Datos para gráfico de métodos de pago
  const metodosPago = useMemo(() => {
    const metodosCount = filteredVentas.reduce((acc, venta) => {
      const metodo = venta.metodoPago;
      if (!acc[metodo]) {
        acc[metodo] = { metodo, count: 0, value: 0 };
      }
      acc[metodo].count += 1;
      acc[metodo].value += venta.precioCobrado;
      return acc;
    }, {} as Record<string, { metodo: string; count: number; value: number }>);

    return Object.values(metodosCount);
  }, [filteredVentas]);

  // Estados de citas
  const estadoCitas = useMemo(() => {
    const estadosCount = filteredCitas.reduce((acc, cita) => {
      const estado = cita.estado;
      if (!acc[estado]) {
        acc[estado] = 0;
      }
      acc[estado] += 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(estadosCount).map(([estado, count]) => ({
      estado,
      count
    }));
  }, [filteredCitas]);

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalIngresos = filteredVentas.reduce((sum, v) => sum + v.precioCobrado, 0);
    const totalAnticipos = filteredVentas.reduce((sum, v) => sum + v.anticipoPagado, 0);
    const totalSaldos = filteredVentas.reduce((sum, v) => sum + v.saldoPendiente, 0);
    const clientesUnicos = new Set(filteredVentas.map(v => v.clienteId)).size;
    const promedioVenta = filteredVentas.length > 0 ? totalIngresos / filteredVentas.length : 0;

    return {
      totalVentas: filteredVentas.length,
      totalIngresos,
      totalAnticipos,
      totalSaldos,
      clientesUnicos,
      promedioVenta,
      totalCitas: filteredCitas.length,
      citasCompletadas: filteredCitas.filter(c => c.estado === 'completada').length
    };
  }, [filteredVentas, filteredCitas]);

  const exportToCSV = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Reportes y Análisis</h1>
        
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ventas">Ventas</option>
                <option value="servicios">Servicios</option>
                <option value="citas">Citas</option>
                <option value="clientes">Clientes</option>
              </select>
              
              <button
                onClick={() => exportToCSV(filteredVentas, 'reporte-ventas.csv')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-xl font-bold text-green-600">${stats.totalIngresos.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ventas</p>
              <p className="text-xl font-bold text-blue-600">{stats.totalVentas}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Clientes Únicos</p>
              <p className="text-xl font-bold text-purple-600">{stats.clientesUnicos}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Citas Completadas</p>
              <p className="text-xl font-bold text-orange-600">{stats.citasCompletadas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Ventas por Día */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Día</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="ventas" fill="#8884d8" name="Cantidad de Ventas" />
                <Line yAxisId="right" type="monotone" dataKey="ingresos" stroke="#82ca9d" name="Ingresos ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Servicios Más Populares */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios Más Populares</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviciosMasPopulares}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Métodos de Pago */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metodosPago}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ metodo, count }) => `${metodo}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metodosPago.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Estado de Citas */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Citas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estadoCitas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ estado, count }) => `${estado}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {estadoCitas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">${stats.totalIngresos.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Ingresos Totales</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">${stats.totalAnticipos.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Anticipos Recibidos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">${stats.totalSaldos.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Saldos Pendientes</div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${stats.promedioVenta.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Promedio por Venta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.totalCitas > 0 ? ((stats.citasCompletadas / stats.totalCitas) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">Tasa de Finalización de Citas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Datos Detallados */}
      {reportType === 'ventas' && (
        <div className="mt-6 bg-white rounded-lg shadow border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Detalle de Ventas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anticipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVentas.map(venta => {
                  const cliente = clientes.find(c => c.id === venta.clienteId);
                  const servicio = servicios.find(s => s.id === venta.servicioId);
                  return (
                    <tr key={venta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(venta.fecha).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cliente?.nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {servicio?.nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${venta.precioCobrado.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        ${venta.anticipoPagado.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                        ${venta.saldoPendiente.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {venta.metodoPago}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredVentas.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay datos para el período seleccionado
          </h3>
          <p className="text-gray-600">
            Ajusta el rango de fechas o verifica que hay ventas registradas.
          </p>
        </div>
      )}
    </div>
  );
}