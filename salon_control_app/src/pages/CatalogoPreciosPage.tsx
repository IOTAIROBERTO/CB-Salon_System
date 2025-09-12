import React, { useEffect, useState } from 'react';

export default function CatalogoPreciosPage() {
  const [servicios, setServicios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    precioSugerido: 0,
    anticipoSugerido: 0
  });

  useEffect(() => {
    const data = localStorage.getItem('servicios');
    if (data) {
      try {
        setServicios(JSON.parse(data));
      } catch (e) {
        console.error('Error parsing servicios:', e);
        setServicios([]);
      }
    } else {
      // Datos iniciales
      const inicial = [
        { id: 's1', nombre: 'Corte de cabello', precioSugerido: 450, anticipoSugerido: 150 },
        { id: 's2', nombre: 'Tinte completo', precioSugerido: 800, anticipoSugerido: 200 },
        { id: 's3', nombre: 'Manicure', precioSugerido: 200, anticipoSugerido: 0 }
      ];
      setServicios(inicial);
      localStorage.setItem('servicios', JSON.stringify(inicial));
    }
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServicio(null);
    setFormData({ nombre: '', precioSugerido: 0, anticipoSugerido: 0 });
  };

  const editServicio = (servicio) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      precioSugerido: servicio.precioSugerido,
      anticipoSugerido: servicio.anticipoSugerido
    });
    setIsModalOpen(true);
  };

  const saveServicio = () => {
    if (!formData.nombre || formData.precioSugerido <= 0) {
      alert('Completa todos los campos');
      return;
    }

    let nuevosServicios;
    if (editingServicio) {
      nuevosServicios = servicios.map(s => 
        s.id === editingServicio.id ? { ...s, ...formData } : s
      );
    } else {
      const nuevo = {
        id: 's' + Date.now(),
        ...formData
      };
      nuevosServicios = [...servicios, nuevo];
    }

    setServicios(nuevosServicios);
    localStorage.setItem('servicios', JSON.stringify(nuevosServicios));
    closeModal();
  };

  const deleteServicio = (id) => {
    if (confirm('¿Eliminar servicio?')) {
      const nuevos = servicios.filter(s => s.id !== id);
      setServicios(nuevos);
      localStorage.setItem('servicios', JSON.stringify(nuevos));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Catálogo de Servicios</h1>
        <button 
          onClick={openModal}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          + Agregar Servicio
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Servicio</th>
              <th className="p-4 text-left">Precio Sugerido</th>
              <th className="p-4 text-left">Anticipo Sugerido</th>
              <th className="p-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map(servicio => (
              <tr key={servicio.id} className="border-t">
                <td className="p-4">{servicio.nombre}</td>
                <td className="p-4">${servicio.precioSugerido}</td>
                <td className="p-4">${servicio.anticipoSugerido}</td>
                <td className="p-4">
                  <button 
                    onClick={() => editServicio(servicio)}
                    className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => deleteServicio(servicio.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {editingServicio ? 'Editar' : 'Nuevo'} Servicio
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nombre del servicio"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Precio Sugerido *</label>
                <input
                  type="number"
                  value={formData.precioSugerido}
                  onChange={(e) => setFormData({...formData, precioSugerido: Number(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Anticipo Sugerido</label>
                <input
                  type="number"
                  value={formData.anticipoSugerido}
                  onChange={(e) => setFormData({...formData, anticipoSugerido: Number(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={closeModal}
                className="flex-1 border rounded px-4 py-2"
              >
                Cancelar
              </button>
              <button 
                onClick={saveServicio}
                className="flex-1 bg-purple-600 text-white rounded px-4 py-2"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}