// src/components/citas/CitasStats.tsx
import { Clock, Play, CreditCard, AlertTriangle } from "lucide-react";
import { type Cita, type Servicio } from "../../types/citas";
import { anticiposPorRecibir, porCobrar } from "../../utils/reportUtils";

interface CitasStatsProps {
  citas: Cita[];
  servicios: Servicio[];
}

export default function CitasStats({ citas, servicios }: CitasStatsProps) {
  // Citas pendientes: pendiente y confirmada (no completadas ni canceladas)
  const citasPendientes = citas.filter((c) =>
    ["pendiente", "confirmada"].includes(c.estado)
  ).length;

  // Citas en proceso: solo las iniciadas
  const citasEnProceso = citas.filter((c) => c.estado === "iniciada").length;

  const saldosPendientes = porCobrar(citas, servicios);
  const anticiposPendientes = anticiposPorRecibir(citas);

  return (
    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Citas Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{citasPendientes}</p>
            <p className="text-xs text-gray-500">Pendientes y confirmadas</p>
          </div>
          <Clock size={24} className="text-yellow-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">En Proceso</p>
            <p className="text-2xl font-bold text-purple-600">{citasEnProceso}</p>
            <p className="text-xs text-gray-500">Citas iniciadas</p>
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
            <p className="text-xs text-gray-500">Por cobrar en citas activas</p>
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
            <p className="text-xs text-gray-500">Anticipos no pagados</p>
          </div>
          <AlertTriangle size={24} className="text-orange-600" />
        </div>
      </div>
    </div>
  );
}