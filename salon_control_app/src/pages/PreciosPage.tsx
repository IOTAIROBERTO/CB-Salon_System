import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Scissors } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  precioSugerido: number;
  anticipoSugerido: number;
}

export default function CatalogoPreciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    precioSugerido: 0,
    anticipoSugerido: 0
  });

  useEffect(() => {
    // Cargar servicios o crear datos iniciales
    const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');
    if (serviciosData.length === 0) {
      // Datos iniciales
      const serviciosIniciales = [
        {
          id: 's1',
          nombre: 'Corte de cabello',
          precioSugerido: 450,
          anticipoSugerido: 150
        },
        {
          id: 's2',
          nombre: 'Ampolleta hidratación intensiva',
          precioSugerido: 150,
          anticipoSugerido: 0
        },
        {
          id: 's3',
          nombre: 'Corte de cabello + ampolleta hidratación intensiva',
          precioSugerido: 600,
          anticipoSugerido: 150
        },
        {
          id: 's4',
          nombre: 'Spa reconstrucción / hidratación',
          precioSugerido: 500,
          anticipoSugerido: 150
        },
        {
          id: 's5',
          nombre: 'Matiz corto',
          precioSugerido: 550,
          anticipoSugerido: 150
        }
      ];
      setServicios(serviciosIniciales);
      localStorage.setItem('servicios', JSON.stringify(serviciosIniciales));
    } else {
      setServicios(serviciosData);
    }
  }, []);

  // Generar ID único
  const generateId = () => `serv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      precioSugerido: 0,
      anticipoSugerido: 0
    });
    setEditingServicio(null);
  };

  // Abrir modal para nuevo servicio
  const openNewServicioModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Abrir modal para editar servicio
  const openEditServicioModal = (servicio: Servicio) => {
    setFormData({
      nombre: servicio.nombre,
      precioSugerido: servicio.precioSugerido,
      anticipoSugerido: servicio.anticipoSugerido
    });
    setEditingServicio(servicio);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulario
  const isFormValid = () => {
    return formData.nombre.trim() !== '' && formData.precioSugerido > 0;
  };

  // Guardar servicio
  const saveServicio = () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedServicios;

    if (editingServicio) {
      // Actualizar servicio existente
      updatedServicios = servicios.map(servicio =>
        servicio.id === editingServicio.id
          ? { ...servicio, ...formData }
          : servicio
      );
    } else {
      // Crear nuevo servicio
      const newServicio: Servicio = {
        id: generateId(),
        nombre: formData.nombre.trim(),
        precioSugerido: Number(formData.precioSugerido),
        anticipoSugerido: Number(formData.anticipoSugerido)
      };
      updatedServicios = [...servicios, newServicio];
    }

    setServicios(updatedServicios);
    localStorage.setItem('servicios', JSON.stringify(updatedServicios));
    closeModal();
    
    alert((editingServicio ? 'Servicio actualizado' : 'Servicio agregado') + ' exitosamente!');
  };

  // Eliminar servicio
  const deleteServicio = (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) return;
    
    const updatedServicios = servicios.filter(servicio => servicio.id !== id);
    setServicios(updatedServicios);
    localStorage.setItem('servicios', JSON.stringify(updatedServicios));
    
    alert('Servicio eliminado exitosamente');
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Catálogo de Servicios
          </h1>
          <button 
            onClick={openNewServicioModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 justify-center"
          >
            <Plus size={20} />
            <span>Agregar Servicio</span>
          </button>
        </div>

        {/* Información */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            ℹ️ Información del Catálogo
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Los precios y anticipos son sugeridos, se pueden modificar al crear servicios</li>
            <li>• Los precios están protegidos y solo se pueden editar desde las acciones</li>
            <li>• Estos servicios aparecerán disponibles al crear citas</li>
          </ul>
        </div>
      </div>

      {/* Lista de servicios */}
      {servicios.length > 0 ? (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Sugerido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anticipo Sugerido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {servicios.map(servicio => (
                  <tr key={servicio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Scissors size={16} className="text-purple-600 mr-2" />
                        <div className="font-medium text-gray-900">{servicio.nombre}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold text-green-600">
                          ${servicio.precioSugerido.toLocaleString()}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Protegido
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold text-blue-600">
                          ${servicio.anticipoSugerido.toLocaleString()}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Protegido
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditServicioModal(servicio)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Editar servicio"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteServicio(servicio.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Eliminar servicio"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Scissors size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios en el catálogo</h3>
          <p className="text-gray-600 mb-4">Comienza agregando tu primer servicio al catálogo.</p>
          <button 
            onClick={openNewServicioModal}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Agregar Primer Servicio
          </button>
        </div>
      )}

      {/* Modal para agregar/editar servicio */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Ej: Corte de cabello, Pedicure, Manicure..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Sugerido *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.precioSugerido}
                      onChange={(e) => handleInputChange('precioSugerido', Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anticipo Sugerido
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.anticipoSugerido}
                      onChange={(e) => handleInputChange('anticipoSugerido', Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      max={formData.precioSugerido}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveServicio}
                  disabled={!isFormValid()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isFormValid()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingServicio ? 'Actualizar' : 'Agregar'} Servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}