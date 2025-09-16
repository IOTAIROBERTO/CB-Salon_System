import { ClientesStats as IClientesStats } from '../../types/clientes';

interface ClientesStatsProps {
  stats: IClientesStats;
}

export default function ClientesStats({ stats }: ClientesStatsProps) {
  const {
    totalClientes,
    clientesActivos,
    clientesInactivos,
    conEmail,
    conTelefono
  } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <p className="text-sm text-gray-600">Total Clientes</p>
        <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <p className="text-sm text-gray-600">Activos</p>
        <p className="text-2xl font-bold text-green-600">{clientesActivos}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <p className="text-sm text-gray-600">Inactivos</p>
        <p className="text-2xl font-bold text-red-600">{clientesInactivos}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <p className="text-sm text-gray-600">Con Email</p>
        <p className="text-2xl font-bold text-blue-600">{conEmail}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <p className="text-sm text-gray-600">Con Teléfono</p>
        <p className="text-2xl font-bold text-purple-600">{conTelefono}</p>
      </div>
    </div>
  );
}