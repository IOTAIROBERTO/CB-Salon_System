// src/components/reportes/CitaDetalleModal.tsx
import { CheckCircle, XCircle, TrendingDown, Calculator, Gift } from 'lucide-react';
import { Cita, Cliente, ServicioCatalogo } from '../../types/reportes';
import { getClienteName, getServicioName } from '../../utils/reportUtils';
import { formatCurrency } from '../../utils/discountUtils';

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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Detalle de Cita</h2>
          <button onClick={onClose}>
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Estado de la cita */}
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

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <p className="text-gray-900">{getClienteName(cita.clienteId, clientes)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicio Principal</label>
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

          {/* Información de transacción para citas completadas */}
          {isCompletada && (
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4 text-lg">Información de Transacción</h3>
              
              {/* Servicios adicionales */}
              {cita.serviciosAdicionales && cita.serviciosAdicionales.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Adicionales</label>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <ul className="text-sm text-gray-700 space-y-1">
                      {cita.serviciosAdicionales.map((s, i) => (
                        <li key={i} className="flex justify-between">
                          <span>• {s.nombre}</span>
                          <span className="font-medium">{formatCurrency(s.precio)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Desglose financiero */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Desglose Financiero</h4>
                <div className="space-y-2 text-sm">
                  {/* Subtotal de servicios */}
                  {(cita.subtotalOriginal && cita.subtotalOriginal > 0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal de servicios:</span>
                      <span className="font-medium">{formatCurrency(cita.subtotalOriginal)}</span>
                    </div>
                  )}

                  {/* Descuento aplicado */}
                  {(cita.montoDescuento && cita.montoDescuento > 0) && (
                    <div className="flex justify-between text-orange-600">
                      <div className="flex items-center gap-1">
                        <TrendingDown size={14} />
                        <span>Descuento ({cita.descuentoAplicado?.toFixed(1)}%):</span>
                      </div>
                      <span className="font-medium">-{formatCurrency(cita.montoDescuento)}</span>
                    </div>
                  )}

                  {/* Subtotal después del descuento */}
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(cita.subtotalConDescuento || cita.subtotalOriginal || cita.precioFinal || 0)}</span>
                  </div>

                  {/* Anticipo */}
                  <div className="flex justify-between text-blue-600">
                    <span>Anticipo recibido:</span>
                    <span className="font-medium">-{formatCurrency(cita.montoAnticipo || 0)}</span>
                  </div>

                  {/* Saldo antes de redondeo */}
                  {(() => {
                    const saldoAntesRedondeo = Math.max(0, 
                      (cita.subtotalConDescuento || cita.subtotalOriginal || cita.precioFinal || 0) - 
                      (cita.montoAnticipo || 0)
                    );
                    return (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Saldo a cobrar:</span>
                        <span className="font-medium">{formatCurrency(saldoAntesRedondeo)}</span>
                      </div>
                    );
                  })()}

                  {/* Redondeo */}
                  {(cita.montoRedondeo && cita.montoRedondeo > 0) && (
                    <div className="flex justify-between text-green-600">
                      <div className="flex items-center gap-1">
                        <Calculator size={14} />
                        <span>Redondeo a decena:</span>
                      </div>
                      <span className="font-medium">+{formatCurrency(cita.montoRedondeo)}</span>
                    </div>
                  )}

                  {/* Propina */}
                  {(cita.propina && cita.propina > 0) && (
                    <div className="flex justify-between text-purple-600">
                      <div className="flex items-center gap-1">
                        <Gift size={14} />
                        <span>Propina:</span>
                      </div>
                      <span className="font-medium">+{formatCurrency(cita.propina)}</span>
                    </div>
                  )}

                  {/* Total final */}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Total pagado:</span>
                      <span className="font-bold text-green-600 text-lg">{formatCurrency(cita.precioFinal || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                  <p className="text-gray-900 capitalize">{cita.metodoPago || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Completado</label>
                  <p className="text-gray-900">
                    {cita.fechaCompletada ? new Date(cita.fechaCompletada).toLocaleString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          {cita.notas && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded">{cita.notas}</p>
            </div>
          )}

          {/* Botón de cierre */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}