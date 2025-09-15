// src/components/CobroModal.tsx
import { X, Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Cita, Servicio } from "../types";

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
  const [descuento, setDescuento] = useState(0);
  const [anticipoRecibido, setAnticipoRecibido] = useState(cita.montoAnticipo || 0);
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showServiciosDropdown, setShowServiciosDropdown] = useState(false);

  // Obtener el servicio actualmente seleccionado
  const servicioActual = servicios.find((s) => s.id === servicioSeleccionadoId);

  // Cálculos
  const subtotalServicios = (servicioActual?.precioSugerido || 0) + 
    serviciosAdicionales.reduce((sum, s) => sum + s.precio, 0);
  
  const montoDescuento = subtotalServicios * (descuento / 100);
  const total = subtotalServicios - montoDescuento;
  const saldoPendiente = Math.max(0, total - anticipoRecibido);

  const opcionesDescuento = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

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
    // Incluir toda la información del servicio modificado
    const datosCompletos = {
      servicioSeleccionado: servicioSeleccionadoId,
      serviciosAdicionales: serviciosAdicionales,
      descuento: descuento,
      subtotalServicios: subtotalServicios,
      montoDescuento: montoDescuento,
      anticipoRecibido: anticipoRecibido // Agregar el anticipo modificado
    };
    onCompletar(cita.id, total, metodoPago, notas, datosCompletos);
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
                      <li key={i}>{s.nombre} - ${s.precio}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p><strong>Subtotal:</strong> ${subtotalServicios}</p>
              {descuento > 0 && <p><strong>Descuento ({descuento}%):</strong> -${montoDescuento}</p>}
              <p><strong>Total final:</strong> ${total}</p>
              <p><strong>Anticipo recibido:</strong> ${anticipoRecibido}</p>
              <p><strong>Saldo cobrado:</strong> ${saldoPendiente}</p>
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Finalizar y Cobrar</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Servicios */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Servicio
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
                          <div className="text-gray-500">${servicio.precioSugerido}</div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Servicio principal - Ahora editable */}
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
                <span className="text-green-600 font-semibold ml-3">${servicioActual?.precioSugerido || 0}</span>
              </div>
            </div>

            {/* Servicios adicionales */}
            {serviciosAdicionales.map((servicio, index) => (
              <div key={index} className="bg-blue-50 p-3 rounded-lg mb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{servicio.nombre}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-semibold">${servicio.precio}</span>
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

          {/* Aplicar descuento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aplicar descuento
            </label>
            <div className="flex flex-wrap gap-2">
              {opcionesDescuento.map(porcentaje => (
                <button
                  key={porcentaje}
                  onClick={() => setDescuento(porcentaje)}
                  className={`px-3 py-1 text-sm rounded ${
                    descuento === porcentaje
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {porcentaje}%
                </button>
              ))}
            </div>
          </div>

          {/* Resumen de precios */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Subtotal servicios:</span>
              <span>${subtotalServicios}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Descuento ({descuento}%):</span>
                <span>-${montoDescuento}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">${total}</span>
            </div>
          </div>

          {/* Anticipo recibido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anticipo recibido
            </label>
            <input
              type="number"
              value={anticipoRecibido}
              onChange={(e) => setAnticipoRecibido(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Saldo pendiente */}
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Saldo pendiente:</span>
              <span className="text-red-600 font-bold text-lg">${saldoPendiente}</span>
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

        <div className="flex justify-end gap-2 mt-6">
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