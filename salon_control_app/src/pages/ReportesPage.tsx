import { useEffect, useState } from 'react';
import {
  Calendar,
  DollarSign,
  Clock,
  Download,
  ShoppingCart,
  Eye,
  CheckCircle,
  XCircle,
  User,
  Scissors
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
  metodoPago?: string;
  serviciosAdicionales?: Array<{
    servicioId: string;
    nombre: string;
    precio: number;
  }>;
  descuentoAplicado?: number;
  subtotalOriginal?: number;
  montoDescuento?: number;
  fechaCompletada?: string;
  notas?: string;
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
  const [filtroHistorial, setFiltroHistorial] = useState<'todas' | 'completadas' | 'canceladas'>('todas');
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

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

  // Filtrar citas para historial
  const citasHistorial = citas.filter(cita => {
    const esCompletadaOCancelada = ['completada', 'cancelada'].includes(cita.estado);
    if (filtroHistorial === 'completadas') return cita.estado === 'completada';
    if (filtroHistorial === 'canceladas') return cita.estado === 'cancelada';
    return esCompletadaOCancelada; // 'todas'
  }).sort((a, b) => new Date(b.fechaCompletada || b.fecha).getTime() - new Date(a.fechaCompletada || a.fecha).getTime());

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

  // Estadísticas generales
  const citasCompletadas = citas.filter(c => c.estado === 'completada');
  const totalIngresosCitas = citasCompletadas.reduce((sum, c) => sum + (c.precioFinal || 0), 0);
  const totalIngresosVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const totalIngresos = totalIngresosCitas + totalIngresosVentas;

  const saldosPendientes = citas
    .filter(c => c.estado !== 'cancelada')
    .reduce((sum, c) => sum + (c.saldoPendiente || 0), 0);

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
              <p className="text-sm text-gray-600">Saldos Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">${saldosPendientes.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Por cobrar</p>
            </div>
            <Clock size={24} className="text-orange-600" />
          </div>
        </div>
      </div>

      {/* Historial de Citas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Historial de Citas</h2>
          <div className="flex gap-2">
            <select
              value={filtroHistorial}
              onChange={(e) => setFiltroHistorial(e.target.value as any)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="todas">Todas</option>
              <option value="completadas">Completadas</option>
              <option value="canceladas">Canceladas</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {citasHistorial.length > 0 ? (
            citasHistorial.map((cita) => (
              <div key={cita.id} className={`border rounded-lg p-4 ${
                cita.estado === 'completada' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        cita.estado === 'completada' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cita.estado === 'completada' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {cita.estado === 'completada' ? 'Completada' : 'Cancelada'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span>{getCliente(cita.clienteId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scissors size={14} className="text-gray-400" />
                        <span>{getServicioCatalogo(cita.servicioId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{new Date(cita.fecha).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-gray-400" />
                        <span>{cita.estado === 'completada' ? `$${cita.precioFinal || 0}` : 'N/A'}</span>
                      </div>
                    </div>

                    {cita.estado === 'completada' && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span>Anticipo: ${cita.montoAnticipo || 0}</span>
                        {cita.metodoPago && <span> • Pago: {cita.metodoPago}</span>}
                        {cita.fechaCompletada && (
                          <span> • Completada: {new Date(cita.fechaCompletada).toLocaleDateString('es-ES')}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setCitaSeleccionada(cita)}
                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              No hay citas en el historial
            </p>
          )}
        </div>
      </div>

      {/* Modal de detalle de cita */}
      {citaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Detalle de Cita</h2>
              <button onClick={() => setCitaSeleccionada(null)}>
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                citaSeleccionada.estado === 'completada' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {citaSeleccionada.estado === 'completada' ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <XCircle size={20} className="text-red-600" />
                  )}
                  <span className="font-medium text-lg">
                    Cita {citaSeleccionada.estado === 'completada' ? 'Completada' : 'Cancelada'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <p className="text-gray-900">{getCliente(citaSeleccionada.clienteId)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                  <p className="text-gray-900">{getServicioCatalogo(citaSeleccionada.servicioId)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <p className="text-gray-900">{new Date(citaSeleccionada.fecha).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <p className="text-gray-900">{citaSeleccionada.hora}</p>
                </div>
              </div>

              {citaSeleccionada.estado === 'completada' && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Información de Transacción</h3>
                  
                  {citaSeleccionada.serviciosAdicionales && citaSeleccionada.serviciosAdicionales.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Servicios Adicionales</label>
                      <ul className="text-sm text-gray-600">
                        {citaSeleccionada.serviciosAdicionales.map((s, i) => (
                          <li key={i}>• {s.nombre} - ${s.precio}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Anticipo Recibido</label>
                      <p className="text-gray-900">${citaSeleccionada.montoAnticipo || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Pagado</label>
                      <p className="text-gray-900 font-semibold">${citaSeleccionada.precioFinal || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                      <p className="text-gray-900 capitalize">{citaSeleccionada.metodoPago || 'No especificado'}</p>
                    </div>
                  </div>

                  {citaSeleccionada.descuentoAplicado && citaSeleccionada.descuentoAplicado > 0 && (
                    <div className="mt-3 p-3 bg-orange-50 rounded">
                      <p className="text-sm">
                        <span className="font-medium">Descuento aplicado:</span> {citaSeleccionada.descuentoAplicado}% 
                        (-${citaSeleccionada.montoDescuento || 0})
                      </p>
                    </div>
                  )}

                  {citaSeleccionada.fechaCompletada && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Completado</label>
                      <p className="text-gray-900">{new Date(citaSeleccionada.fechaCompletada).toLocaleString('es-ES')}</p>
                    </div>
                  )}
                </div>
              )}

              {citaSeleccionada.notas && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <p className="text-gray-900">{citaSeleccionada.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}