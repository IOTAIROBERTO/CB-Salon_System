import { CheckCircle, XCircle } from 'lucide-react';
import { Cita, Cliente, ServicioCatalogo } from '../../types/reportes';
import { getClienteName, getServicioName } from '../../utils/reportUtils';

interface CitaDetalleModalProps {
  cita: Cita | null;
  clientes: Cliente[];
  catalogoServicios: ServicioCatalogo[];
  onClose: () => void;
}

export default function CitaDetalleModal({ 
  cita, 
  clientes, 
  catalogoServicios, 
  onClose 
}: CitaDetalleModalProps) {
  if (!cita) return null;

  const isCompletada = cita.estado === 'completada';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Detalle de Cita</h2>
          <button onClick={onClose}>
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            isCompletada ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isCompletada ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <XCircle size={20} className="text-red-600" />
              )}
              <span className="font-medium text-lg">
                Cita {isCompletada ? 'Completada' : 'Cancelada'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <p className="text-gray-900">{getClienteName(cita.clienteId, clientes)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
              <p className="text-gray-900">{getServicioName(cita.servicioId, catalogoServicios)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <p className="text-gray-900">{new Date(cita.fecha).toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <p className="text-gray-900">{cita.hora}</p>
            </div>
          </div>

          {isCompletada && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Información de Transacción</h3>
              
              {cita.serviciosAdicionales && cita.serviciosAdicionales.length > 0 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servicios Adicionales</label>
                  <ul className="text-sm text-gray-600">
                    {cita.serviciosAdicionales.map((s, i) => (
                      <li key={i}>• {s.nombre} - ${s.precio}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anticipo Recibido</label>
                  <p className="text-gray-900">${cita.montoAnticipo || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Pagado</label>
                  <p className="text-gray-900 font-semibold">${cita.precioFinal || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                  <p className="text-gray-900 capitalize">{cita.metodoPago || 'No especificado'}</p>
                </div>
              </div>

              {cita.descuentoAplicado && cita.descuentoAplicado > 0 && (
                <div className="mt-3 p-3 bg-orange-50 rounded">
                  <p className="text-sm">
                    <span className="font-medium">Descuento aplicado:</span> {cita.descuentoAplicado}% 
                    (-${cita.montoDescuento || 0})
                  </p>
                </div>
              )}

              {cita.fechaCompletada && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Completado</label>
                  <p className="text-gray-900">{new Date(cita.fechaCompletada).toLocaleString('es-ES')}</p>
                </div>
              )}
            </div>
          )}

          {cita.notas && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <p className="text-gray-900">{cita.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}