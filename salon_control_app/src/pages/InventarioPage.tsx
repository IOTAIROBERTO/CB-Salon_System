import { useState } from 'react';

export default function InventarioPage() {
  const [inventario, setInventario] = useState([
    { id: 'p1', nombre: 'Shampoo hidratante', cantidad: 10 },
    { id: 'p2', nombre: 'Tinte rubio', cantidad: 5 }
  ]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-blue-700">
        Agregar Producto
      </button>
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">Producto</th>
            <th className="py-2 px-4 border">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {inventario.map(item => (
            <tr key={item.id} className="text-center">
              <td className="py-2 px-4 border">{item.nombre}</td>
              <td className="py-2 px-4 border">{item.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}