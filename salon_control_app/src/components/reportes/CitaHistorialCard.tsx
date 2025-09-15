import { Calendar, CheckCircle, XCircle, User, Scissors, DollarSign, Eye } from 'lucide-react';
import { Cita, Cliente, ServicioCatalogo } from '../../types/reportes';
import { getClienteName, getServicioName } from '../../utils/reportUtils';

interface CitaHistorialCardProps {
  cita: Cita;
  clientes: Cliente[];
  catalogoServicios: ServicioCatalogo[];
  onVerDetalle: (cita: Cita) => void;
}

export default function CitaHistorialCard({ 
  cita, 
  clientes, 
  catalogoServicios, 
  onVerDetalle 
}: CitaHistorialCardProps) {
  const isCompletada = cita.estado === 'completada';

  return (
    <div className={`border rounded-lg p-4 ${
      isCompletada ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isCompletada 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {isCompletada ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {isCompletada ? 'Completada' : 'Cancelada'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              <span>{getClienteName(cita.clienteId, clientes)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Scissors size={14} className="text-gray-400" />
              <span>{getServicioName(cita.servicioId, catalogoServicios)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <span>{new Date(cita.fecha).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-gray-400" />
              <span>{isCompletada ? `$${cita.precioFinal || 0}` : 'N/A'}</span>
            </div>
          </div>

          {isCompletada && (
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
          onClick={() => onVerDetalle(cita)}
          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
}