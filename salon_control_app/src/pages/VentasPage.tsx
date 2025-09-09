import { useEffect, useState } from 'react';

interface Venta {
  id: string;
  fecha: string;
  clienteId: string;
  servicioId: string;
  precioCobrado: number;
  anticipoPagado: number;
  saldoPendiente: number;
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);

  useEffect(() => {
    const ventasData = JSON.parse(localStorage.getItem('ventas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');
    setVentas(ventasData);
    setClientes(clientesData);
    setServicios(serviciosData);
  }, []);

  const getCliente = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Desconocido';
  const getServicio = (id: string) => servicios.find(s => s.id === id)?.nombre || 'Servicio';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ventas</h1>
      <button className="bg-green-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-green-700">
        Nueva Venta
      </button>
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">Fecha</th>
            <th className="py-2 px-4 border">Cliente</th>
            <th className="py-2 px-4 border">Servicio</th>
            <th className="py-2 px-4 border">Precio Cobrado</th>
            <th className="py-2 px-4 border">Anticipo</th>
            <th className="py-2 px-4 border">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map(venta => (
            <tr key={venta.id} className="text-center">
              <td className="py-2 px-4 border">{new Date(venta.fecha).toLocaleDateString()}</td>
              <td className="py-2 px-4 border">{getCliente(venta.clienteId)}</td>
              <td className="py-2 px-4 border">{getServicio(venta.servicioId)}</td>
              <td className="py-2 px-4 border">${venta.precioCobrado}</td>
              <td className="py-2 px-4 border">${venta.anticipoPagado}</td>
              <td className="py-2 px-4 border">${venta.saldoPendiente}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}