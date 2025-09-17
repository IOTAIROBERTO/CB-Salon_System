// src/components/citas/ResumenCobro.tsx
import React from 'react';
import { Percent, Calculator, Gift } from 'lucide-react';
import { 
  CalculoFinal,
  DESCUENTO_PORCENTAJE_OPTIONS,
  formatCurrency,
  esDecenaExacta
} from '../../utils/discountUtils';

interface ResumenCobroProps {
  subtotalServicios: number;
  porcentajeSeleccionado: number;
  propina: number;
  anticipo: number;
  calculoFinal: CalculoFinal;
  onPorcentajeChange: (porcentaje: number) => void;
  onPropinaChange: (propina: number) => void;
}

export default function ResumenCobro({
  subtotalServicios,
  porcentajeSeleccionado,
  propina,
  anticipo,
  calculoFinal,
  onPorcentajeChange,
  onPropinaChange
}: ResumenCobroProps) {
  return (
    <div className="space-y-4">
      {/* Descuento por porcentaje */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Percent size={16} className="text-blue-500" />
          <label className="text-sm font-medium text-gray-700">
            Aplicar descuento
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {DESCUENTO_PORCENTAJE_OPTIONS.map(porcentaje => (
            <button
              key={porcentaje}
              type="button"
              onClick={() => onPorcentajeChange(porcentaje)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                porcentajeSeleccionado === porcentaje
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {porcentaje}%
            </button>
          ))}
        </div>
      </div>

      {/* Campo de propina */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Gift size={16} className="text-purple-500" />
          <label className="text-sm font-medium text-gray-700">
            Propina
          </label>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={propina || ''}
            onChange={(e) => onPropinaChange(Number(e.target.value) || 0)}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            min="0"
            step="10"
            placeholder="0"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Propina adicional que el cliente desea dejar
        </p>
      </div>

      {/* Resumen del cálculo */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Calculator size={16} />
          Desglose del cobro
        </h4>
        
        <div className="space-y-2 text-sm">
          {/* Subtotal de servicios */}
          <div className="flex justify-between">
            <span className="text-gray-700">Subtotal servicios:</span>
            <span className="font-medium">{formatCurrency(calculoFinal.subtotalServicios)}</span>
          </div>

          {/* Descuento (solo si hay) */}
          {calculoFinal.montoDescuento > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Descuento ({calculoFinal.descuentoPorcentaje}%):</span>
              <span>-{formatCurrency(calculoFinal.montoDescuento)}</span>
            </div>
          )}

          {/* Subtotal con descuento */}
          <div className="flex justify-between">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-medium">{formatCurrency(calculoFinal.subtotalConDescuento)}</span>
          </div>

          {/* Anticipo */}
          <div className="flex justify-between text-blue-600">
            <span>Anticipo recibido:</span>
            <span>-{formatCurrency(anticipo)}</span>
          </div>

          {/* Saldo antes de redondeo */}
          {(() => {
            const saldoAntesRedondeo = Math.max(0, calculoFinal.subtotalConDescuento - anticipo);
            return (
              <div className="flex justify-between">
                <span className="text-gray-700">Saldo a cobrar:</span>
                <span className="font-medium">{formatCurrency(saldoAntesRedondeo)}</span>
              </div>
            );
          })()}

          {/* Redondeo (solo si hay) */}
          {calculoFinal.montoRedondeo > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Redondeo a decena:</span>
              <span>+{formatCurrency(calculoFinal.montoRedondeo)}</span>
            </div>
          )}

          {/* Propina (solo si hay) */}
          {calculoFinal.propina > 0 && (
            <div className="flex justify-between text-purple-600">
              <span>Propina:</span>
              <span>+{formatCurrency(calculoFinal.propina)}</span>
            </div>
          )}

          {/* Total final */}
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">Saldo pendiente:</span>
              <span className="font-bold text-red-600 text-lg">
                {formatCurrency(calculoFinal.totalFinal)}
              </span>
            </div>
          </div>
        </div>

        {/* Información sobre el redondeo */}
        {calculoFinal.montoRedondeo > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs text-green-700 flex items-center gap-1">
              <Calculator size={12} />
              Redondeado para facilitar el cambio
            </p>
          </div>
        )}

        {/* Mensaje si ya es decena exacta */}
        {(() => {
          const saldoAntesRedondeo = Math.max(0, calculoFinal.subtotalConDescuento - anticipo);
          return esDecenaExacta(saldoAntesRedondeo) && calculoFinal.propina === 0 && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-xs text-gray-600">
                ✓ El saldo ya es una cantidad exacta
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}