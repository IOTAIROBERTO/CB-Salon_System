import { useEffect, useState } from 'react';

interface Cliente {
  id: string;
  nombre: string;
  cumple: string;
  comentarios: string;
  posibleBaja: boolean;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    setClientes(clientesData);
  }, []);

  const togglePosibleBaja = (id: string) => {
    const updated = clientes.map(cliente =>
      cliente.id === id ? { ...cliente, posibleBaja: !cliente.posibleBaja } : cliente
    );
    setClientes(updated);
    localStorage.setItem('clientes', JSON.stringify(updated));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>
      <button className="bg-purple-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-purple-700">
        Nuevo Cliente
      </button>
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">Nombre</th>
            <th className="py-2 px-4 border">Cumpleaños</th>
            <th className="py-2 px-4 border">Comentarios</th>
            <th className="py-2 px-4 border">Posible Baja</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(cliente => (
            <tr key={cliente.id} className="text-center">
              <td className="py-2 px-4 border">{cliente.nombre}</td>
              <td className="py-2 px-4 border">{cliente.cumple}</td>
              <td className="py-2 px-4 border">
                <input
                  type="text"
                  defaultValue={cliente.comentarios}
                  className="border rounded px-2 py-1 w-full"
                  onBlur={(e) => {
                    const updated = clientes.map(c =>
                      c.id === cliente.id ? { ...c, comentarios: e.target.value } : c
                    );
                    setClientes(updated);
                    localStorage.setItem('clientes', JSON.stringify(updated));
                  }}
                />
              </td>
              <td className="py-2 px-4 border">
                <input
                  type="checkbox"
                  checked={cliente.posibleBaja}
                  onChange={() => togglePosibleBaja(cliente.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}