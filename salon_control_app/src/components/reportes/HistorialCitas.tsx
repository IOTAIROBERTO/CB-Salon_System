import { Cita, Cliente, ServicioCatalogo, FiltroHistorial } from '../../types/reportes';
import CitaHistorialCard from './CitaHistorialCard';

interface HistorialCitasProps {
  citasHistorial: Cita[];
  clientes: Cliente[];
  catalogoServicios: ServicioCatalogo[];
  filtroHistorial: FiltroHistorial;
  setFiltroHistorial: (filtro: FiltroHistorial) => void;
  onVerDetalle: (cita: Cita) => void;
}

export default function HistorialCitas({ 
  citasHistorial, 
  clientes, 
  catalogoServicios,
  filtroHistorial,
  setFiltroHistorial,
  onVerDetalle 
}: HistorialCitasProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Historial de Citas</h2>
        <div className="flex gap-2">
          <select
            value={filtroHistorial}
            onChange={(e) => setFiltroHistorial(e.target.value as FiltroHistorial)}
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
            <CitaHistorialCard
              key={cita.id}
              cita={cita}
              clientes={clientes}
              catalogoServicios={catalogoServicios}
              onVerDetalle={onVerDetalle}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            No hay citas en el historial
          </p>
        )}
      </div>
    </div>
  );
}