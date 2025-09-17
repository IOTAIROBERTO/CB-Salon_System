// src/components/reportes/CitaHistorialCard.tsx
import { Calendar, CheckCircle, XCircle, User, Scissors, DollarSign, Eye, TrendingDown, Calculator, Gift } from 'lucide-react';
import { Cita, Cliente, ServicioCatalogo } from '../../types/reportes';
import { getClienteName, getServicioName } from '../../utils/reportUtils';
import { formatCurrency } from '../../utils/discountUtils';

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
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isCompletada 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {isCompletada ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {isCompletada ? 'Completada' : 'Cancelada'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm mb-3">
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
              <span>{isCompletada ? formatCurrency(cita.precioFinal || 0) : 'N/A'}</span>
            </div>
          </div>

          {/* Información detallada para citas completadas */}
          {isCompletada && (
            <div className="bg-white p-3 rounded-lg border border-green-200 text-xs space-y-2">
              <div className="font-medium text-green-800 mb-2">Desglose de la transacción:</div>
              
              {/* Servicios adicionales */}
              {cita.serviciosAdicionales && cita.serviciosAdicionales.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Servicios adicionales:</span>
                  <span className="font-medium">{cita.serviciosAdicionales.length}</span>
                </div>
              )}

              {/* Subtotal original */}
              {(cita.subtotalOriginal && cita.subtotalOriginal > 0) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal servicios:</span>
                  <span className="font-medium">{formatCurrency(cita.subtotalOriginal)}</span>
                </div>
              )}

              {/* Descuento aplicado */}
              {(cita.montoDescuento && cita.montoDescuento > 0) && (
                <div className="flex justify-between text-orange-600">
                  <div className="flex items-center gap-1">
                    <TrendingDown size={10} />
                    <span>Descuento ({cita.descuentoAplicado?.toFixed(1)}%):</span>
                  </div>
                  <span>-{formatCurrency(cita.montoDescuento)}</span>
                </div>
              )}

              {/* Anticipo */}
              {(cita.montoAnticipo && cita.montoAnticipo > 0) && (
                <div className="flex justify-between text-blue-600">
                  <span>Anticipo recibido:</span>
                  <span>-{formatCurrency(cita.montoAnticipo)}</span>
                </div>
              )}

              {/* Redondeo */}
              {(cita.montoRedondeo && cita.montoRedondeo > 0) && (
                <div className="flex justify-between text-green-600">
                  <div className="flex items-center gap-1">
                    <Calculator size={10} />
                    <span>Redondeo a decena:</span>
                  </div>
                  <span>+{formatCurrency(cita.montoRedondeo)}</span>
                </div>
              )}

              {/* Propina */}
              {(cita.propina && cita.propina > 0) && (
                <div className="flex justify-between text-purple-600">
                  <div className="flex items-center gap-1">
                    <Gift size={10} />
                    <span>Propina:</span>
                  </div>
                  <span>+{formatCurrency(cita.propina)}</span>
                </div>
              )}

              {/* Método de pago y fecha */}
              <div className="border-t border-green-200 pt-2 mt-2 space-y-1">
                {cita.metodoPago && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium capitalize">{cita.metodoPago}</span>
                  </div>
                )}
                {cita.fechaCompletada && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completada el:</span>
                    <span className="font-medium">{new Date(cita.fechaCompletada).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información básica para citas canceladas */}
          {!isCompletada && (
            <div className="text-xs text-gray-600">
              <span>Fecha de la cita: {new Date(cita.fecha).toLocaleDateString('es-ES')}</span>
              {cita.notas && <span> • Notas: {cita.notas}</span>}
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