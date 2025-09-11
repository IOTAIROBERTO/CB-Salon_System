import { useEffect, useState } from 'react';
import { Plus, Scissors, Edit, Trash2, Search, X, DollarSign } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  precioActualizado: number;
  anticipo: number;
  duracion?: number; // en minutos
  descripcion?: string;
  categoria: 'corte' | 'color' | 'tratamiento' | 'peinado' | 'otros';
}

export default function PreciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Servicio | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    precioActualizado: 0,
    anticipo: 0,
    duracion: 60,
    descripcion: '',
    categoria: 'otros' as const
  });

  // Cargar datos iniciales desde localStorage
  useEffect(() => {
    const serviciosData = JSON.parse(localStorage.getItem('servicios') || '[]');
    const serviciosUpdated = serviciosData.map((servicio: any) => ({
      ...servicio,
      categoria: servicio.categoria || 'otros',
      duracion: servicio.duracion || 60,
      descripcion: servicio.descripcion || ''
    }));
    setServicios(serviciosUpdated);
  }, []);

  // Detectar modo de vista según el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar servicios
  const filteredServices = servicios.filter(servicio => {
    const searchMatch =
      !searchTerm ||
      servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (servicio.descripcion &&
        servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const categoryMatch = categoryFilter === 'all' || servicio.categoria === categoryFilter;

    return searchMatch && categoryMatch;
  });

  const generateId = () =>
    `servicio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const resetForm = () => {
    setFormData({
      nombre: '',
      precioActualizado: 0,
      anticipo: 0,
      duracion: 60,
      descripcion: '',
      categoria: 'otros'
    });
    setEditingService(null);
  };

  const openNewServiceModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditServiceModal = (servicio: Servicio) => {
    setFormData({
      nombre: servicio.nombre,
      precioActualizado: servicio.precioActualizado,
      anticipo: servicio.anticipo,
      duracion: servicio.duracion || 60,
      descripcion: servicio.descripcion || '',
      categoria: servicio.categoria
    });
    setEditingService(servicio);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const isFormValid = () => formData.nombre.trim() && formData.precioActualizado > 0;

  const saveService = () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedServices;

    if (editingService) {
      const updatedService = { ...editingService, ...formData };
      updatedServices = servicios.map(s =>
        s.id === editingService.id ? updatedService : s
      );
    } else {
      const newService: Servicio = {
        id: generateId(),
        ...formData
      };
      updatedServices = [...servicios, newService];
    }

    setServicios(updatedServices);
    localStorage.setItem('servicios', JSON.stringify(updatedServices));
    closeModal();

    const message = editingService
      ? 'Servicio actualizado exitosamente!'
      : 'Servicio agregado exitosamente!';
    alert(message);
  };

  const deleteService = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      const updatedServices = servicios.filter(s => s.id !== id);
      setServicios(updatedServices);
      localStorage.setItem('servicios', JSON.stringify(updatedServices));
    }
  };

  const updatePrice = (id: string, newPrice: number) => {
    if (newPrice < 0) return;

    const updatedServices = servicios.map(s =>
      s.id === id ? { ...s, precioActualizado: newPrice } : s
    );
    setServicios(updatedServices);
    localStorage.setItem('servicios', JSON.stringify(updatedServices));
  };

  const updateAnticipo = (id: string, newAnticipo: number) => {
    if (newAnticipo < 0) return;

    const updatedServices = servicios.map(s =>
      s.id === id ? { ...s, anticipo: newAnticipo } : s
    );
    setServicios(updatedServices);
    localStorage.setItem('servicios', JSON.stringify(updatedServices));
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'corte':
        return 'text-blue-600 bg-blue-100';
      case 'color':
        return 'text-purple-600 bg-purple-100';
      case 'tratamiento':
        return 'text-green-600 bg-green-100';
      case 'peinado':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Calcular estadísticas
  const avgPrice =
    servicios.length > 0
      ? servicios.reduce((sum, s) => sum + s.precioActualizado, 0) / servicios.length
      : 0;
  const totalRevenue = servicios.reduce((sum, s) => sum + s.precioActualizado, 0);

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Lista de Servicios</h1>
          <button
            onClick={openNewServiceModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 justify-center w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Nuevo Servicio</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Total Servicios</p>
            <p className="text-2xl font-bold text-gray-900">{servicios.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Precio Promedio</p>
            <p className="text-2xl font-bold text-purple-600">${avgPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Servicio Más Caro</p>
            <p className="text-2xl font-bold text-blue-600">
              $
              {servicios.length > 0
                ? Math.max(...servicios.map(s => s.precioActualizado)).toFixed(2)
                : '0.00'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Valor Total Servicios</p>
            <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar servicios..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <select
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              <option value="corte">Corte</option>
              <option value="color">Color</option>
              <option value="tratamiento">Tratamiento</option>
              <option value="peinado">Peinado</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vista en tabla */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Actual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anticipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map(servicio => (
                  <tr key={servicio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Scissors className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{servicio.nombre}</div>
                          {servicio.descripcion && (
                            <div className="text-sm text-gray-500">{servicio.descripcion}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(servicio.categoria)}`}
                      >
                        {servicio.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={servicio.precioActualizado}
                        onChange={(e) => updatePrice(servicio.id, parseFloat(e.target.value) || 0)}
                        className="w-24 text-center border rounded px-2 py-1 text-sm font-medium text-gray-900"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={servicio.anticipo}
                        onChange={(e) => updateAnticipo(servicio.id, parseFloat(e.target.value) || 0)}
                        className="w-24 text-center border rounded px-2 py-1 text-sm text-blue-600"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDuration(servicio.duracion || 60)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditServiceModal(servicio)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteService(servicio.id)}
                          className="text-red-600 hover:text-red-900 p-1"
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
        // Vista en tarjetas para móviles
        <div className="grid gap-4">
          {filteredServices.map(servicio => (
            <div key={servicio.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <Scissors className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{servicio.nombre}</h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(servicio.categoria)}`}
                    >
                      {servicio.categoria}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditServiceModal(servicio)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deleteService(servicio.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {servicio.descripcion && (
                <p className="text-sm text-gray-600 mb-3">{servicio.descripcion}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Precio:</span>
                  <div className="flex items-center">
                    <DollarSign size={16} className="text-gray-400 mr-1" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={servicio.precioActualizado}
                      onChange={(e) => updatePrice(servicio.id, parseFloat(e.target.value) || 0)}
                      className="w-20 text-center border rounded px-2 py-1 text-sm font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Anticipo:</span>
                  <div className="flex items-center">
                    <DollarSign size={16} className="text-blue-400 mr-1" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={servicio.anticipo}
                      onChange={(e) => updateAnticipo(servicio.id, parseFloat(e.target.value) || 0)}
                      className="w-20 text-center border rounded px-2 py-1 text-sm text-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duración:</span>
                  <span className="text-sm text-gray-900">
                    {formatDuration(servicio.duracion || 60)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">Saldo restante:</span>
                  <span className="text-sm font-medium text-orange-600">
                    ${(servicio.precioActualizado - servicio.anticipo).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Scissors size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios registrados</h3>
          <p className="text-gray-500 mb-4">
            Comienza agregando un nuevo servicio para tu catálogo
          </p>
          <button
            onClick={openNewServiceModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Agregar Servicio
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <select
                    className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as Servicio['categoria'] })}
                  >
                    <option value="corte">Corte</option>
                    <option value="color">Color</option>
                    <option value="tratamiento">Tratamiento</option>
                    <option value="peinado">Peinado</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={formData.precioActualizado}
                      onChange={(e) => setFormData({ ...formData, precioActualizado: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Anticipo</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={formData.anticipo}
                      onChange={(e) => setFormData({ ...formData, anticipo: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Duración (minutos)</label>
                  <input
                    type="number"
                    min="1"
                    className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.duracion}
                    onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveService}
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg ${
                    isFormValid()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingService ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
