// src/components/CitasStats.tsx
import { Clock, Play, CreditCard, AlertTriangle } from "lucide-react";
import { Cita, Servicio } from "../types";

interface CitasStatsProps {
  citas: Cita[];
  servicios: Servicio[];
}

export default function CitasStats({ citas, servicios }: CitasStatsProps) {
  const citasPendientes = citas.filter((c) =>
    ["pendiente", "confirmada"].includes(c.estado)
  ).length;

  const citasEnProceso = citas.filter((c) => c.estado === "iniciada").length;

  // Saldos pendientes = Precio total de servicios - anticipos ya pagados/confirmados
  const saldosPendientes = citas
    .filter(c => c.estado !== "completada" && c.estado !== "cancelada")
    .reduce((sum, c) => {
      const servicio = servicios.find(s => s.id === c.servicioId);
      const precioServicio = servicio?.precioSugerido || 0;
      const anticipoPagado = (c.anticipoConfirmado && c.montoAnticipo) ? c.montoAnticipo : 0;
      return sum + Math.max(0, precioServicio - anticipoPagado);
    }, 0);

  // Anticipos pendientes = Total de anticipos sugeridos - anticipos ya pagados/confirmados
  // Considerar también los anticipos modificados en el proceso de cobro
  const anticiposPendientes = citas
    .filter(c => c.estado !== "cancelada")
    .reduce((sum, c) => {
      const servicio = servicios.find(s => s.id === c.servicioId);
      const anticipoSugerido = servicio?.anticipoSugerido || 0;
      // Usar el anticipo confirmado/pagado (que puede haber sido modificado en el cobro)
      const anticipoPagado = (c.anticipoConfirmado && c.montoAnticipo) ? c.montoAnticipo : 0;
      return sum + Math.max(0, anticipoSugerido - anticipoPagado);
    }, 0);

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Citas Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{citasPendientes}</p>
          </div>
          <Clock size={24} className="text-yellow-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">En Proceso</p>
            <p className="text-2xl font-bold text-purple-600">{citasEnProceso}</p>
          </div>
          <Play size={24} className="text-purple-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Saldos Pendientes</p>
            <p className="text-2xl font-bold text-red-600">
              ${saldosPendientes.toLocaleString()}
            </p>
          </div>
          <CreditCard size={24} className="text-red-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Anticipos Pendientes</p>
            <p className="text-2xl font-bold text-orange-600">
              ${anticiposPendientes.toLocaleString()}
            </p>
          </div>
          <AlertTriangle size={24} className="text-orange-600" />
        </div>
      </div>
    </div>
  );
}