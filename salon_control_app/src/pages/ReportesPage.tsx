import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, DollarSign, Users, BarChart3, Download, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ServicioRealizado {
  id: string;
  citaId: string;
  clienteId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  precioCobrado: number;
  anticipoPagado: number;
  saldoPendiente: number;
  metodoPago: string;
  metodoPagoAnticipo: string;
  estado: 'confirmada' | 'completada' | 'cancelada';
  notas?: string;
  fechaCompletado?: string;
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
  ingresos: number;
  servicios: number;
  serviciosCompletados: number;
  anticipos: number;
}

export default function ReportesPage() {
  const [servicios, setServicios] = useState<ServicioRealizado[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogoServicios, setCatalogoServicios] = useState<ServicioCatalogo[]>([]);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showDetails, setShowDetails] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'completada' | 'confirmada' | 'cancelada'>('all');

  useEffect(() => {
    const serviciosData = JSON.parse(localStorage.getItem('serviciosRealizados') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const catalogoData = JSON.parse(localStorage.getItem('servicios') || '[]');
    
    setServicios(serviciosData);
    setClientes(clientesData);
    setCatalogoServicios(catalogoData);
  }, []);

  // Funciones auxiliares
  const getCliente = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Cliente no encontrado';
  const getServicioCatalogo = (id: string) => catalogoServicios.find(s => s.id === id)?.nombre || 'Servicio no encontrado';

  // Obtener datos del reporte según el período
  const getReportData = (): ReportData[] => {
    const now = new Date();
    const data: ReportData[] = [];

    switch (reportPeriod) {
      case 'week':
        // Últimas 7 semanas
        for (let i = 6; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7));
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Inicio de semana
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const weekServicios = servicios.filter(servicio => {
            const servicioDate = new Date(servicio.fecha);
            return servicioDate >= weekStart && servicioDate <= weekEnd;
          });

          const serviciosCompletados = weekServicios.filter(s => s.estado === 'completada');

          data.push({
            periodo: `Sem ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
            ingresos: serviciosCompletados.reduce((sum, s) => sum + s.precioCobrado, 0),
            servicios: weekServicios.length,
            serviciosCompletados: serviciosCompletados.length,
            anticipos: weekServicios.reduce((sum, s) => sum + s.anticipoPagado, 0)
          });
        }
        break;

      case 'month':
        // Últimos 6 meses
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now);
          monthDate.setMonth(now.getMonth() - i);
          
          const monthServicios = servicios.filter(servicio => {
            const servicioDate = new Date(servicio.fecha);
            return servicioDate.getMonth() === monthDate.getMonth() && 
                   servicioDate.getFullYear() === monthDate.getFullYear();
          });

          const serviciosCompletados = monthServicios.filter(s => s.estado === 'completada');

          data.push({
            periodo: monthDate.toLocaleDateString('es-ES', { month: 'short' }),
            ingresos: serviciosCompletados.reduce((sum, s) => sum + s.precioCobrado, 0),
            servicios: monthServicios.length,
            serviciosCompletados: serviciosCompletados.length,
            anticipos: monthServicios.reduce((sum, s) => sum + s.anticipoPagado, 0)
          });
        }
        break;

      case 'year':
        // Últimos 3 años
        for (let i = 2; i >= 0; i--) {
          const yearDate = new Date(now);
          yearDate.setFullYear(now.getFullYear() - i);
          
          const yearServicios = servicios.filter(servicio => {
            const servicioDate = new Date(servicio.fecha);
            return servicioDate.getFullYear() === yearDate.getFullYear();
          });

          const serviciosCompletados = yearServicios.filter(s => s.estado === 'completada');

          data.push({
            periodo: yearDate.getFullYear().toString(),
            ingresos: serviciosCompletados.reduce((sum, s) => sum + s.precioCobrado, 0),
            servicios: yearServicios.length,
            serviciosCompletados: serviciosCompletados.length,
            anticipos: yearServicios.reduce((sum, s) => sum + s.anticipoPagado, 0)
          });
        }
        break;
    }

    return data;
  };

  const reportData = getReportData();
  const maxIngresos = Math.max(...reportData.map(d => d.ingresos), 1);
  const maxServicios = Math.max(...reportData.map(d => d.servicios), 1);

  // Estadísticas generales
  const serviciosCompletados = servicios.filter(s => s.estado === 'completada');
  const totalIngresos = serviciosCompletados.reduce((sum, s) => sum + s.precioCobrado, 0);
  const totalServicios = servicios.length;
  const totalAnticipos = servicios.reduce((sum, s) => sum + s.anticipoPagado, 0);
  const saldosPendientes = servicios.filter(s => s.estado !== 'cancelada').reduce((sum, s) => sum + s.saldoPendiente, 0);
  const ingresoPromedio = serviciosCompletados.length > 0 ? totalIngresos / serviciosCompletados.length : 0;

  // Servicios más populares (solo completados)
  const serviciosStats = catalogoServicios.map(servicioCatalogo => {
    const serviciosDeEsteTipo = serviciosCompletados.filter(s => s.servicioId === servicioCatalogo.id);
    return {
      nombre: servicioCatalogo.nombre,
      cantidad: serviciosDeEsteTipo.length,
      ingresos: serviciosDeEsteTipo.reduce((sum, s) => sum + s.precioCobrado, 0),
      promedioPrecio: serviciosDeEsteTipo.length > 0 
        ? serviciosDeEsteTipo.reduce((sum, s) => sum + s.precioCobrado, 0) / serviciosDeEsteTipo.length 
        : 0
    };
  }).filter(s => s.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad);

  // Métodos de pago más usados
  const metodosPagoStats = serviciosCompletados.reduce((acc: any, servicio) => {
    const metodo = servicio.metodoPago || 'Sin especificar';
    acc[metodo] = (acc[metodo] || 0) + 1;
    return acc;
  }, {});

  // Filtrar servicios para la tabla de detalles
  const serviciosFiltrados = filtroEstado === 'all' 
    ? servicios 
    : servicios.filter(s => s.estado === filtroEstado);

  // Exportar datos
  const exportToCSV = () => {
    const csvContent = [
      ['Período', 'Ingresos', 'Servicios Totales', 'Servicios Completados', 'Anticipos'],
      ...reportData.map(row => [row.periodo, row.ingresos, row.servicios, row.serviciosCompletados, row.anticipos])
    ].map(row => row.join(',')).join('\n');

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Reportes y Análisis
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Reales</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalIngresos.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Solo servicios completados</p>
            </div>
            <DollarSign size={24} className="text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Servicios</p>
              <p className="text-2xl font-bold text-blue-600">{totalServicios}</p>
              <p className="text-xs text-gray-500">{serviciosCompletados.length} completados</p>
            </div>
            <Calendar size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingreso Promedio</p>
              <p className="text-2xl font-bold text-purple-600">
                ${ingresoPromedio.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Por servicio completado</p>
            </div>
            <TrendingUp size={24} className="text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Anticipos</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalAnticipos.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Anticipos recibidos</p>
            </div>
            <Users size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saldos Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">
                ${saldosPendientes.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Por cobrar</p>
            </div>
            <Clock size={24} className="text-orange-600" />
          </div>
        </div>
      </div>

      {/* Selector de período */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 size={20} />
            Tendencias de Ingresos
          </h2>
          <div className="flex gap-2">
            {[
              { key: 'week', label: 'Semanal' },
              { key: 'month', label: 'Mensual' },
              { key: 'year', label: 'Anual' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setReportPeriod(key as any)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  reportPeriod === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de ingresos */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">
          Ingresos por {reportPeriod === 'week' ? 'Semana' : reportPeriod === 'month' ? 'Mes' : 'Año'}
          <span className="text-sm font-normal text-gray-500 ml-2">(Solo servicios completados)</span>
        </h3>
        <div className="space-y-4">
          {reportData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {item.periodo}
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    ${item.ingresos.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({item.serviciosCompletados}/{item.servicios} completados)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(item.ingresos / maxIngresos) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Servicios más populares */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Servicios Más Populares (Completados)</h3>
        <div className="space-y-4">
          {serviciosStats.slice(0, 5).map((servicio, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-400' : 'bg-purple-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{servicio.nombre}</p>
                  <p className="text-sm text-gray-600">
                    {servicio.cantidad} servicios • ${servicio.ingresos.toLocaleString()} • Promedio: ${servicio.promedioPrecio.toFixed(0)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(servicio.cantidad / Math.max(...serviciosStats.map(s => s.cantidad))) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Métodos de Pago Más Usados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(metodosPagoStats).map(([metodo, cantidad]) => (
            <div key={metodo} className="bg-gray-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-gray-900">{cantidad as number}</p>
              <p className="text-sm text-gray-600">{metodo}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle de servicios */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <h3 className="text-lg font-semibold">Detalle de Servicios</h3>
          <div className="flex gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmada">Confirmada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                showDetails ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anticipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de Pago
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosFiltrados.slice(0, 20).map(servicio => (
                  <tr key={servicio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(servicio.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCliente(servicio.clienteId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getServicioCatalogo(servicio.servicioId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {servicio.estado === 'completada' && <CheckCircle size={16} className="text-green-500" />}
                        {servicio.estado === 'confirmada' && <Clock size={16} className="text-blue-500" />}
                        {servicio.estado === 'cancelada' && <XCircle size={16} className="text-red-500" />}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          servicio.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          servicio.estado === 'confirmada' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${servicio.precioCobrado.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      ${servicio.anticipoPagado.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={servicio.saldoPendiente > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                        ${servicio.saldoPendiente.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="space-y-1">
                        {servicio.metodoPagoAnticipo && (
                          <div className="text-xs">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Anticipo: {servicio.metodoPagoAnticipo}
                            </span>
                          </div>
                        )}
                        {servicio.metodoPago && (
                          <div className="text-xs">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              Total: {servicio.metodoPago}
                            </span>
                          </div>
                        )}
                        {!servicio.metodoPago && !servicio.metodoPagoAnticipo && (
                          <span className="text-gray-400 text-xs">Sin especificar</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {serviciosFiltrados.length > 20 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Mostrando los primeros 20 de {serviciosFiltrados.length} servicios.
                <button 
                  onClick={exportToCSV}
                  className="ml-2 text-purple-600 hover:text-purple-800 font-medium"
                >
                  Exportar todos los datos
                </button>
              </div>
            )}
            
            {serviciosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay servicios que coincidan con el filtro seleccionado.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resumen por estados */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Resumen por Estados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">Servicios Confirmados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {servicios.filter(s => s.estado === 'confirmada').length}
                </p>
                <p className="text-sm text-blue-600">
                  Total: ${servicios.filter(s => s.estado === 'confirmada').reduce((sum, s) => sum + s.precioCobrado, 0).toLocaleString()}
                </p>
              </div>
              <Clock size={32} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">Servicios Completados</p>
                <p className="text-2xl font-bold text-green-600">
                  {serviciosCompletados.length}
                </p>
                <p className="text-sm text-green-600">
                  Ingresos: ${totalIngresos.toLocaleString()}
                </p>
              </div>
              <CheckCircle size={32} className="text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 font-medium">Servicios Cancelados</p>
                <p className="text-2xl font-bold text-red-600">
                  {servicios.filter(s => s.estado === 'cancelada').length}
                </p>
                <p className="text-sm text-red-600">
                  Anticipos perdidos: ${servicios.filter(s => s.estado === 'cancelada').reduce((sum, s) => sum + s.anticipoPagado, 0).toLocaleString()}
                </p>
              </div>
              <XCircle size={32} className="text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          ℹ️ Información sobre los Reportes
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Ingresos Reales:</strong> Solo incluye servicios con estado "Completada"</li>
          <li>• <strong>Saldos Pendientes:</strong> Incluye servicios confirmados y completados con saldo por cobrar</li>
          <li>• <strong>Anticipos:</strong> Se cuentan desde que se confirma el servicio</li>
          <li>• <strong>Servicios Populares:</strong> Ranking basado en servicios completados exitosamente</li>
          <li>• <strong>Exportación:</strong> Los datos exportados incluyen todo el período seleccionado</li>
        </ul>
      </div>
    </div>
  );
}