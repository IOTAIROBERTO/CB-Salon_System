import { useReportData } from '../hooks/useReportData';
import { useHistorialCitas } from '../hooks/useHistorialCitas';
import ReportStats from '../components/reportes/ReportStats';
import ExportButton from '../components/reportes/ExportButton';
import HistorialCitas from '../components/reportes/HistorialCitas';
import CitaDetalleModal from '../components/reportes/CitaDetalleModal';

export default function ReportesPage() {
  // Custom hooks para separar la lógica
  const {
    citas,
    clientes,
    catalogoServicios,
    reportPeriod,
    setReportPeriod,
    stats,
    reportData
  } = useReportData();

  const {
    filtroHistorial,
    setFiltroHistorial,
    citaSeleccionada,
    setCitaSeleccionada,
    citasHistorial
  } = useHistorialCitas(citas);

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
        <div className="flex gap-2">
          <ExportButton reportData={reportData} period={reportPeriod} />
        </div>
      </div>

      {/* Estadísticas principales */}
      <ReportStats stats={stats} />

      {/* Historial de Citas */}
      <HistorialCitas
        citasHistorial={citasHistorial}
        clientes={clientes}
        catalogoServicios={catalogoServicios}
        filtroHistorial={filtroHistorial}
        setFiltroHistorial={setFiltroHistorial}
        onVerDetalle={setCitaSeleccionada}
      />

      {/* Modal de detalle de cita */}
      <CitaDetalleModal
        cita={citaSeleccionada}
        clientes={clientes}
        catalogoServicios={catalogoServicios}
        onClose={() => setCitaSeleccionada(null)}
      />
    </div>
  );
}