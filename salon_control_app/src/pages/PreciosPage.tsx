import { useEffect, useState } from 'react';
import data from '../data/servicios_dataset.json';

interface Servicio {
  id: string;
  nombre: string;
  precioActualizado: number;
  anticipo: number;
}

export default function PreciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    setServicios(data);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Lista de Servicios</h1>
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">Servicio</th>
            <th className="py-2 px-4 border">Precio Actualizado</th>
            <th className="py-2 px-4 border">Precio Cobrado</th>
            <th className="py-2 px-4 border">Anticipo</th>
          </tr>
        </thead>
        <tbody>
          {servicios.map(servicio => (
            <tr key={servicio.id} className="text-center">
              <td className="py-2 px-4 border">{servicio.nombre}</td>
              <td className="py-2 px-4 border">${servicio.precioActualizado}</td>
              <td className="py-2 px-4 border">
                <input type="number" className="border rounded px-2 py-1 w-24" defaultValue={servicio.precioActualizado} />
              </td>
              <td className="py-2 px-4 border">${servicio.anticipo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}