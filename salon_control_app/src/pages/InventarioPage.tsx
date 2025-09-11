import { useState, useEffect } from 'react';
import { Plus, Package, Search, Edit, Trash2, AlertTriangle, X } from 'lucide-react';

interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  cantidadMinima: number;
  precio: number;
  proveedor: string;
  categoria: 'shampoo' | 'tinte' | 'tratamiento' | 'herramientas' | 'otros';
  fechaVencimiento?: string;
  notas?: string;
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: 0,
    cantidadMinima: 5,
    precio: 0,
    proveedor: '',
    categoria: 'otros' as const,
    fechaVencimiento: '',
    notas: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const inventarioData = localStorage.getItem('inventario');
    if (inventarioData) {
      setProductos(JSON.parse(inventarioData));
    } else {
      // Datos iniciales de ejemplo
      const datosIniciales: Producto[] = [
        {
          id: 'p1',
          nombre: 'Shampoo Hidratante L\'Oreal',
          cantidad: 10,
          cantidadMinima: 3,
          precio: 250.00,
          proveedor: 'Distribuidora Belleza',
          categoria: 'shampoo'
        },
        {
          id: 'p2',
          nombre: 'Tinte Rubio Cenizo',
          cantidad: 5,
          cantidadMinima: 2,
          precio: 180.00,
          proveedor: 'Cosméticos Pro',
          categoria: 'tinte'
        },
        {
          id: 'p3',
          nombre: 'Mascarilla Reparadora',
          cantidad: 2,
          cantidadMinima: 5,
          precio: 320.00,
          proveedor: 'Beauty Supply',
          categoria: 'tratamiento'
        }
      ];
      setProductos(datosIniciales);
      localStorage.setItem('inventario', JSON.stringify(datosIniciales));
    }
  }, []);

  // Detectar modo de vista según pantalla
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar productos
  const filteredProducts = productos.filter(producto => {
    const searchMatch = !searchTerm || 
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.proveedor.toLowerCase().includes(searchTerm.toLowerCase());

    const categoryMatch = categoryFilter === 'all' || producto.categoria === categoryFilter;
    
    const stockMatch = !lowStockFilter || producto.cantidad <= producto.cantidadMinima;

    return searchMatch && categoryMatch && stockMatch;
  });

  const generateId = () => `producto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const resetForm = () => {
    setFormData({
      nombre: '',
      cantidad: 0,
      cantidadMinima: 5,
      precio: 0,
      proveedor: '',
      categoria: 'otros',
      fechaVencimiento: '',
      notas: ''
    });
    setEditingProduct(null);
  };

  const openNewProductModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditProductModal = (producto: Producto) => {
    setFormData({
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      cantidadMinima: producto.cantidadMinima,
      precio: producto.precio,
      proveedor: producto.proveedor,
      categoria: producto.categoria,
      fechaVencimiento: producto.fechaVencimiento || '',
      notas: producto.notas || ''
    });
    setEditingProduct(producto);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const isFormValid = () => formData.nombre.trim() && formData.cantidad >= 0 && formData.precio >= 0;

  const saveProduct = () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedProducts;

    if (editingProduct) {
      const updatedProduct = { 
        ...editingProduct, 
        ...formData,
        fechaVencimiento: formData.fechaVencimiento || undefined
      };
      updatedProducts = productos.map(p => p.id === editingProduct.id ? updatedProduct : p);
    } else {
      const newProduct: Producto = {
        id: generateId(),
        ...formData,
        fechaVencimiento: formData.fechaVencimiento || undefined
      };
      updatedProducts = [...productos, newProduct];
    }

    setProductos(updatedProducts);
    localStorage.setItem('inventario', JSON.stringify(updatedProducts));
    closeModal();

    const message = editingProduct ? 'Producto actualizado exitosamente!' : 'Producto agregado exitosamente!';
    alert(message);
  };

  const deleteProduct = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      const updatedProducts = productos.filter(p => p.id !== id);
      setProductos(updatedProducts);
      localStorage.setItem('inventario', JSON.stringify(updatedProducts));
    }
  };

  const updateStock = (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    const updatedProducts = productos.map(p => 
      p.id === id ? { ...p, cantidad: newQuantity } : p
    );
    setProductos(updatedProducts);
    localStorage.setItem('inventario', JSON.stringify(updatedProducts));
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'shampoo': return 'text-blue-600 bg-blue-100';
      case 'tinte': return 'text-purple-600 bg-purple-100';
      case 'tratamiento': return 'text-green-600 bg-green-100';
      case 'herramientas': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isLowStock = (producto: Producto) => producto.cantidad <= producto.cantidadMinima;
  const lowStockCount = productos.filter(isLowStock).length;
  const totalValue = productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventario</h1>
          <button
            onClick={openNewProductModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 justify-center w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Agregar Producto</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Total Productos</p>
            <p className="text-2xl font-bold text-gray-900">{productos.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {lowStockCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-2xl font-bold text-blue-600">${totalValue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-600">Productos Activos</p>
            <p className="text-2xl font-bold text-green-600">
              {productos.filter(p => p.cantidad > 0).length}
            </p>
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
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              <option value="shampoo">Shampoo</option>
              <option value="tinte">Tinte</option>
              <option value="tratamiento">Tratamiento</option>
              <option value="herramientas">Herramientas</option>
              <option value="otros">Otros</option>
            </select>

            <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Solo stock bajo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        /* Vista de tabla - Desktop y tablet */
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(producto => (
                  <tr key={producto.id} className={`hover:bg-gray-50 ${isLowStock(producto) ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{producto.nombre}</div>
                          {isLowStock(producto) && (
                            <div className="flex items-center text-red-600 text-sm">
                              <AlertTriangle size={14} className="mr-1" />
                              Stock bajo
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(producto.categoria)}`}>
                        {producto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={producto.cantidad}
                          onChange={(e) => updateStock(producto.id, parseInt(e.target.value) || 0)}
                          className={`w-16 text-center border rounded px-2 py-1 text-sm ${
                            isLowStock(producto) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <span className="text-sm text-gray-500">/ {producto.cantidadMinima}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${producto.precio.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {producto.proveedor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditProductModal(producto)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteProduct(producto.id)}
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
        /* Vista de tarjetas - Móvil */
        <div className="grid gap-4">
          {filteredProducts.map(producto => (
            <div key={producto.id} className={`bg-white p-4 rounded-lg shadow border ${isLowStock(producto) ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{producto.nombre}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(producto.categoria)}`}>
                      {producto.categoria}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditProductModal(producto)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deleteProduct(producto.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              {isLowStock(producto) && (
                <div className="flex items-center text-red-600 text-sm mb-3 p-2 bg-red-100 rounded">
                  <AlertTriangle size={16} className="mr-2" />
                  Stock bajo - Reabastecer pronto
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stock actual:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={producto.cantidad}
                      onChange={(e) => updateStock(producto.id, parseInt(e.target.value) || 0)}
                      className={`w-16 text-center border rounded px-2 py-1 text-sm ${
                        isLowStock(producto) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-sm text-gray-500">/ {producto.cantidadMinima}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Precio:</span>
                  <span className="text-sm font-bold text-gray-900">${producto.precio.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Proveedor:</span>
                  <span className="text-sm text-gray-900">{producto.proveedor}</span>
                </div>
                
                {producto.fechaVencimiento && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vencimiento:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(producto.fechaVencimiento).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || categoryFilter !== 'all' || lowStockFilter 
              ? 'No se encontraron productos' 
              : 'No hay productos en inventario'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all' || lowStockFilter
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer producto al inventario'
            }
          </p>
          {(!searchTerm && categoryFilter === 'all' && !lowStockFilter) && (
            <button
              onClick={openNewProductModal}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Agregar Primer Producto
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Shampoo Hidratante L'Oreal"
                    required
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="shampoo">Shampoo</option>
                    <option value="tinte">Tinte</option>
                    <option value="tratamiento">Tratamiento</option>
                    <option value="herramientas">Herramientas</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cantidad}
                      onChange={e => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Cantidad Mínima */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cantidadMinima}
                      onChange={e => setFormData({ ...formData, cantidadMinima: parseInt(e.target.value) || 1 })}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={e => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre del proveedor"
                  />
                </div>

                {/* Fecha de Vencimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={e => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Notas adicionales sobre el producto..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveProduct}
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isFormValid()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editingProduct ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}