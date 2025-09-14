// src/components/CobroModal.tsx
import { X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Cita, Servicio } from "../types";

interface CobroModalProps {
  cita: Cita;
  servicios: Servicio[];
  onClose: () => void;
  onCompletar: (
    citaId: string,
    precioFinal: number,
    metodoPago: string,
    notas: string
  ) => void;
}

export default function CobroModal({
  cita,
  servicios,
  onClose,
  onCompletar,
}: CobroModalProps) {
  const servicio = servicios.find((s) => s.id === cita.servicioId);

  const [precioFinal, setPrecioFinal] = useState(servicio?.precioSugerido || 0);
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const saldoPendiente = Math.max(0, precioFinal - (cita.montoAnticipo || 0));

  const handleCompletar = () => {
    setShowConfirmation(true);
  };

  const confirmarCompletado = () => {
    if (typeof onCompletar === "function") {
      onCompletar(cita.id, precioFinal, metodoPago, notas);
      onClose();
    } else {
      console.error("onCompletar no es una función válida");
    }
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
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Precio final:</strong> ${precioFinal}</p>
              <p><strong>Anticipo:</strong> ${cita.montoAnticipo || 0}</p>
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Finalizar y Cobrar</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p><strong>Servicio:</strong> {servicio?.nombre}</p>
            <p><strong>Anticipo recibido:</strong> ${cita.montoAnticipo || 0}</p>
            <p><strong>Saldo a cobrar:</strong> <span className="text-red-600 font-semibold">${saldoPendiente}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio final del servicio
            </label>
            <input
              type="number"
              value={precioFinal}
              onChange={(e) => setPrecioFinal(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Precio final"
            />
          </div>

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
            disabled={!metodoPago || precioFinal <= 0}
            className={`px-4 py-2 rounded ${
              metodoPago && precioFinal > 0
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
