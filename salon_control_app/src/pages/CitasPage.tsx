import { useState } from 'react';

export default function CitasPage() {
  const [citas] = useState([
    { id: 'ct1', cliente: 'Ana López', fecha: '2025-09-10', servicio: 'Corte de cabello' },
    { id: 'ct2', cliente: 'María García', fecha: '2025-09-12', servicio: 'Spa reconstrucción' }
  ]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Citas</h1>
      <button className="bg-purple-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-purple-700">
        Agregar Cita
      </button>
      <ul className="space-y-2">
        {citas.map(cita => (
          <li key={cita.id} className="p-3 border rounded-lg shadow bg-white">
            <p><strong>Cliente:</strong> {cita.cliente}</p>
            <p><strong>Fecha:</strong> {cita.fecha}</p>
            <p><strong>Servicio:</strong> {cita.servicio}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}