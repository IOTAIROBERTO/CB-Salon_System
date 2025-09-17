// src/components/citas/CobroModal.tsx
import { X, Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Cita, Servicio } from "../../types/citas";
import ResumenCobro from "./ResumenCobro";
import { 
  calcularTotalFinal, 
  formatCurrency 
} from "../../utils/discountUtils";

interface CobroModalProps {
  cita: Cita;
  servicios: Servicio[];
  onClose: () => void;
  onCompletar: (citaId: string, precioFinal: number, metodoPago: string, notas: string, serviciosAdicionales?: any[]) => void;
}

interface ServicioAdicional {
  servicioId: string;
  nombre: string;
  precio: number;
}

export default function CobroModal({ cita, servicios, onClose, onCompletar }: CobroModalProps) {
  // Estado para el servicio seleccionado (inicialmente el servicio original de la cita)
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = useState(cita.servicioId);
  const [serviciosAdicionales, setServiciosAdicionales] = useState<ServicioAdicional[]>([]);
  
  // Estados para descuentos y propina
  const [porcentajeSeleccionado, setPorcentajeSeleccionado] = useState(0);
  const [propina, setPropina] = useState(0);
  
  const [anticipoRecibido, setAnticipoRecibido] = useState(cita.montoAnticipo || 0);
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showServiciosDropdown, setShowServiciosDropdown] = useState(false);

  // Obtener el servicio actualmente seleccionado
  const servicioActual = servicios.find((s) => s.id === servicioSeleccionadoId);

  // Cálculos base
  const subtotalServicios = (servicioActual?.precioSugerido || 0) + 
    serviciosAdicionales.reduce((sum, s) => sum + s.precio, 0);
  
  // Calcular todos los valores finales
  const calculoFinal = calcularTotalFinal(
    subtotalServicios, 
    porcentajeSeleccionado, 
    propina,
    anticipoRecibido
  );

  const agregarServicio = (servicio: Servicio) => {
    const nuevoServicio: ServicioAdicional = {
      servicioId: servicio.id,
      nombre: servicio.nombre,
      precio: servicio.precioSugerido
    };
    setServiciosAdicionales([...serviciosAdicionales, nuevoServicio]);
    setShowServiciosDropdown(false);
  };

  const eliminarServicio = (index: number) => {
    setServiciosAdicionales(serviciosAdicionales.filter((_, i) => i !== index));
  };

  const cambiarServicioPrincipal = (servicioId: string) => {
    setServicioSeleccionadoId(servicioId);
  };

  const handleCompletar = () => {
    setShowConfirmation(true);
  };

  const confirmarCompletado = () => {
    // El precio final incluye todo: saldo + redondeo + propina
    const precioFinalCompleto = calculoFinal.subtotalConDescuento + calculoFinal.montoRedondeo + calculoFinal.propina;
    
    // Incluir toda la información del servicio modificado y cálculos
    const datosCompletos = {
      servicioSeleccionado: servicioSeleccionadoId,
      serviciosAdicionales: serviciosAdicionales,
      descuento: calculoFinal.descuentoPorcentaje,
      tipoDescuento: 'porcentaje',
      subtotalServicios: calculoFinal.subtotalServicios,
      montoDescuento: calculoFinal.montoDescuento,
      montoRedondeo: calculoFinal.montoRedondeo,
      propina: calculoFinal.propina,
      anticipoRecibido: anticipoRecibido,
      porcentajeOriginal: porcentajeSeleccionado,
      subtotalConDescuento: calculoFinal.subtotalConDescuento
    };
    
    onCompletar(cita.id, precioFinalCompleto, metodoPago, notas, datosCompletos);
    onClose();
  };

  const cancelarCompletado = () => {
    setShowConfirmation(false);
  };

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={24} className="text-orange-500" />
            <h2 className="text-lg font-semibold">Confirmar Finalización</h2>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-gray-700">¿Está seguro que desea finalizar esta cita?</p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p><strong>Servicio principal:</strong> {servicioActual?.nombre}</p>
              {serviciosAdicionales.length > 0 && (
                <div>
                  <strong>Servicios adicionales:</strong>
                  <ul className="ml-4 list-disc">
                    {serviciosAdicionales.map((s, i) => (
                      <li key={i}>{s.nombre} - {formatCurrency(s.precio)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p><strong>Subtotal servicios:</strong> {formatCurrency(calculoFinal.subtotalServicios)}</p>
              {calculoFinal.montoDescuento > 0 && (
                <p><strong>Descuento ({calculoFinal.descuentoPorcentaje}%):</strong> -{formatCurrency(calculoFinal.montoDescuento)}</p>
              )}
              <p><strong>Subtotal:</strong> {formatCurrency(calculoFinal.subtotalConDescuento)}</p>
              <p><strong>Anticipo recibido:</strong> -{formatCurrency(anticipoRecibido)}</p>
              {calculoFinal.montoRedondeo > 0 && (
                <p><strong>Redondeo:</strong> +{formatCurrency(calculoFinal.montoRedondeo)}</p>
              )}
              {calculoFinal.propina > 0 && (
                <p><strong>Propina:</strong> +{formatCurrency(calculoFinal.propina)}</p>
              )}
              <p><strong>Saldo pendiente:</strong> {formatCurrency(calculoFinal.totalFinal)}</p>
              <p><strong>Método de pago:</strong> {metodoPago}</p>
            </div>
            <p className="text-sm text-orange-600">
              Una vez finalizada, la cita se marcará como completada y se contabilizará en los reportes.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={cancelarCompletado}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarCompletado}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Confirmar y Finalizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Finalizar y Cobrar</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda: Servicios y configuraciones */}
          <div className="space-y-4">
            {/* Servicios */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Servicios
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowServiciosDropdown(!showServiciosDropdown)}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Plus size={14} />
                    Añadir
                  </button>
                  
                  {showServiciosDropdown && (
                    <div className="absolute right-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {servicios
                        .filter(s => s.id !== servicioSeleccionadoId)
                        .map(servicio => (
                          <button
                            key={servicio.id}
                            onClick={() => agregarServicio(servicio)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
                          >
                            <div className="font-medium">{servicio.nombre}</div>
                            <div className="text-gray-500">{formatCurrency(servicio.precioSugerido)}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Servicio principal - Editable */}
              <div className="bg-gray-50 p-3 rounded-lg mb-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <select
                      value={servicioSeleccionadoId}
                      onChange={(e) => cambiarServicioPrincipal(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm bg-white"
                    >
                      {servicios.map(servicio => (
                        <option key={servicio.id} value={servicio.id}>
                          {servicio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-green-600 font-semibold ml-3">
                    {formatCurrency(servicioActual?.precioSugerido || 0)}
                  </span>
                </div>
              </div>

              {/* Servicios adicionales */}
              {serviciosAdicionales.map((servicio, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg mb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{servicio.nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-semibold">
                        {formatCurrency(servicio.precio)}
                      </span>
                      <button
                        onClick={() => eliminarServicio(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Anticipo recibido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anticipo recibido
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={anticipoRecibido}
                  onChange={(e) => setAnticipoRecibido(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de pago *
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar método de pago</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del servicio..."
                className="w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Columna derecha: Resumen de cobro */}
          <div>
            <ResumenCobro
              subtotalServicios={subtotalServicios}
              porcentajeSeleccionado={porcentajeSeleccionado}
              propina={propina}
              anticipo={anticipoRecibido}
              calculoFinal={calculoFinal}
              onPorcentajeChange={setPorcentajeSeleccionado}
              onPropinaChange={setPropina}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCompletar}
            disabled={!metodoPago}
            className={`px-4 py-2 rounded ${
              metodoPago
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Completar Cita
          </button>
        </div>
      </div>
    </div>
  );
}