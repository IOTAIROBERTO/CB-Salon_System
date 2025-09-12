import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Package, TrendingDown, AlertTriangle } from 'lucide-react';

interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  stockMinimo: number;
  categoria: string;
  fechaUltimaCompra?: string;
  proveedor?: string;
}

export default function InventarioPage() {
  const [inventario, setInventario] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'stock'>('create');
  
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: 0,
    precio: 0,
    stockMinimo: 5,
    categoria: '',
    proveedor: ''
  });

  const [stockData, setStockData] = useState({
    cantidad: 0,
    operacion: 'suma' as 'suma' | 'resta',
    motivo: ''
  });

  useEffect(() => {
    // Inicializar con datos de ejemplo si no existen
    const inventarioData = JSON.parse(localStorage.getItem('inventario') || '[]');
    if (inventarioData.length === 0) {
      const inventarioInicial = [
        {
          id: 'p1',
          nombre: 'Shampoo hidratante',
          cantidad: 10,
          precio: 250.00,
          stockMinimo: 5,
          categoria: 'Cuidado capilar',
          proveedor: 'Beauty Supply Co.'
        },
        {
          id: 'p2',
          nombre: 'Tinte rubio',
          cantidad: 3,
          precio: 180.00,
          stockMinimo: 5,
          categoria: 'Coloración',
          proveedor: 'Color Pro'
        },
        {
          id: 'p3',
          nombre: 'Esmalte de uñas rojo',
          cantidad: 8,
          precio: 75.00,
          stockMinimo: 3,
          categoria: 'Manicure',
          proveedor: 'Nail Beauty'
        }
      ];
      setInventario(inventarioInicial);
      localStorage.setItem('inventario', JSON.stringify(inventarioInicial));
    } else {
      setInventario(inventarioData);
    }
  }, []);

  // Calcular estadísticas
  const totalProductos = inventario.length;
  const productosStockBajo = inventario.filter(p => p.cantidad <= p.stockMinimo).length;
  const valorTotalInventario = inventario.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
  const categorias = [...new Set(inventario.map(p => p.categoria))].length;

  // Generar ID único
  const generateId = () => `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Limpiar formularios
  const resetForm = () => {
    setFormData({
      nombre: '',
      cantidad: 0,
      precio: 0,
      stockMinimo: 5,
      categoria: '',
      proveedor: ''
    });
    setEditingProducto(null);
  };

  const resetStockForm = () => {
    setStockData({
      cantidad: 0,
      operacion: 'suma',
      motivo: ''
    });
  };

  // Abrir modal para nuevo producto
  const openNewProductoModal = () => {
    resetForm();
    setModalType('create');
    setIsModalOpen(true);
  };

  // Abrir modal para editar producto (solo datos, no stock)
  const openEditProductoModal = (producto: Producto) => {
    setFormData({
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      precio: producto.precio,
      stockMinimo: producto.stockMinimo,
      categoria: producto.categoria,
      proveedor: producto.proveedor || ''
    });
    setEditingProducto(producto);
    setModalType('edit');
    setIsModalOpen(true);
  };

  // Abrir modal para editar stock
  const openStockModal = (producto: Producto) => {
    resetStockForm();
    setEditingProducto(producto);
    setModalType('stock');
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
    resetStockForm();
    setModalType('create');
  };

  // Manejar cambios en formularios
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStockChange = (field: string, value: string | number) => {
    setStockData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulario
  const isFormValid = () => {
    return formData.nombre.trim() !== '' && 
           formData.precio > 0 &&
           formData.categoria.trim() !== '';
  };

  // Validar formulario de stock
  const isStockFormValid = () => {
    return stockData.cantidad > 0 && stockData.motivo.trim() !== '';
  };

  // Guardar producto
  const saveProducto = () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    let updatedInventario;

    if (editingProducto && modalType === 'edit') {
      // Actualizar producto existente (sin modificar stock desde aquí)
      updatedInventario = inventario.map(producto =>
        producto.id === editingProducto.id
          ? { 
              ...producto, 
              nombre: formData.nombre.trim(),
              precio: formData.precio,
              stockMinimo: formData.stockMinimo,
              categoria: formData.categoria.trim(),
              proveedor: formData.proveedor.trim()
            }
          : producto
      );
    } else {
      // Crear nuevo producto
      const newProducto: Producto = {
        id: generateId(),
        nombre: formData.nombre.trim(),
        cantidad: formData.cantidad,
        precio: formData.precio,
        stockMinimo: formData.stockMinimo,
        categoria: formData.categoria.trim(),
        proveedor: formData.proveedor.trim(),
        fechaUltimaCompra: new Date().toISOString().split('T')[0]
      };
      updatedInventario = [...inventario, newProducto];
    }

    setInventario(updatedInventario);
    localStorage.setItem('inventario', JSON.stringify(updatedInventario));
    closeModal();
    
    alert((modalType === 'edit' ? 'Producto actualizado' : 'Producto agregado') + ' exitosamente!');
  };

  // Actualizar stock
  const updateStock = () => {
    if (!editingProducto || !isStockFormValid()) {
      alert('Por favor completa todos los campos');
      return;
    }

    const nuevaCantidad = stockData.operacion === 'suma' 
      ? editingProducto.cantidad + stockData.cantidad
      : Math.max(0, editingProducto.cantidad - stockData.cantidad);

    const updatedInventario = inventario.map(producto =>
      producto.id === editingProducto.id
        ? { 
            ...producto, 
            cantidad: nuevaCantidad,
            fechaUltimaCompra: stockData.operacion === 'suma' ? new Date().toISOString().split('T')[0] : producto.fechaUltimaCompra
          }
        : producto
    );

    // Registrar movimiento de stock (opcional para futuras funcionalidades)
    const movimiento = {
      id: generateId(),
      productoId: editingProducto.id,
      productoNombre: editingProducto.nombre,
      cantidad: stockData.cantidad,
      operacion: stockData.operacion,
      motivo: stockData.motivo,
      cantidadAnterior: editingProducto.cantidad,
      cantidadNueva: nuevaCantidad,
      fecha: new Date().toISOString()
    };

    const movimientos = JSON.parse(localStorage.getItem('movimientosStock') || '[]');
    movimientos.push(movimiento);
    localStorage.setItem('movimientosStock', JSON.stringify(movimientos));

    setInventario(updatedInventario);
    localStorage.setItem('inventario', JSON.stringify(updatedInventario));
    closeModal();
    
    alert(`Stock ${stockData.operacion === 'suma' ? 'aumentado' : 'reducido'} exitosamente`);
  };

  // Eliminar producto
  const deleteProducto = (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) return;
    
    const updatedInventario = inventario.filter(producto => producto.id !== id);
    setInventario(updatedInventario);
    localStorage.setItem('inventario', JSON.stringify(updatedInventario));
    
    alert('Producto eliminado exitosamente');
  };

  // Obtener color según el stock
  const getStockColor = (producto: Producto) => {
    if (producto.cantidad === 0) return 'text-red-600 bg-red-50';
    if (producto.cantidad <= producto.stockMinimo) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Inventario
          </h1>
          <button 
            onClick={openNewProductoModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 justify-center"
          >
            <Plus size={20} />
            <span>Agregar Producto</span>
          </button>
        </div>

        {/* Estadísticas */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
              </div>
              <Package size={24} className="text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">{productosStockBajo}</p>
              </div>
              <TrendingDown size={24} className="text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  ${valorTotalInventario.toLocaleString()}
                </p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categorías</p>
                <p className="text-2xl font-bold text-purple-600">{categorias}</p>
              </div>
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        {/* Alertas de stock bajo */}
        {productosStockBajo > 0 && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={20} className="text-orange-600" />
              <h3 className="text-sm font-semibold text-orange-800">
                Productos con stock bajo
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {inventario
                .filter(p => p.cantidad <= p.stockMinimo)
                .map(producto => (
                  <span
                    key={producto.id}
                    className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                  >
                    {producto.nombre} ({producto.cantidad} unidades)
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de productos */}
      {inventario.length > 0 ? (
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
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventario.map(producto => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{producto.nombre}</div>
                        {producto.proveedor && (
                          <div className="text-sm text-gray-500">Proveedor: {producto.proveedor}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {producto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStockColor(producto)}`}>
                          {producto.cantidad} unidades
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Mínimo: {producto.stockMinimo}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          ${producto.precio.toLocaleString()}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Protegido
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-green-600">
                      ${(producto.cantidad * producto.precio).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openStockModal(producto)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                          title="Editar stock"
                        >
                          <Package size={16} />
                        </button>
                        <button
                          onClick={() => openEditProductoModal(producto)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Editar producto"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteProducto(producto.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Eliminar producto"
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
            <Package size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos en el inventario</h3>
          <p className="text-gray-600 mb-4">Comienza agregando tu primer producto.</p>
          <button 
            onClick={openNewProductoModal}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Agregar Primer Producto
          </button>
        </div>
      )}

      {/* Modal para crear/editar producto */}
      {isModalOpen && (modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {modalType === 'edit' ? 'Editar Producto' : 'Nuevo Producto'}
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
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Ej: Shampoo, Tinte, Esmalte..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => handleInputChange('categoria', e.target.value)}
                    placeholder="Ej: Cuidado capilar, Coloración, Manicure..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {modalType === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Initial
                    </label>
                    <input
                      type="number"
                      value={formData.cantidad}
                      onChange={(e) => handleInputChange('cantidad', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para productos existentes, usa "Editar Stock" después
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unitario *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.precio}
                      onChange={(e) => handleInputChange('precio', Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => handleInputChange('stockMinimo', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se mostrará alerta cuando el stock esté por debajo de este número
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => handleInputChange('proveedor', e.target.value)}
                    placeholder="Nombre del proveedor (opcional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                  onClick={saveProducto}
                  disabled={!isFormValid()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isFormValid()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {modalType === 'edit' ? 'Actualizar' : 'Agregar'} Producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar stock */}
      {isModalOpen && modalType === 'stock' && editingProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Editar Stock
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Información del producto */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-medium text-gray-900">{editingProducto.nombre}</h3>
                  <p className="text-sm text-gray-600">Stock actual: {editingProducto.cantidad} unidades</p>
                  <p className="text-sm text-gray-600">Stock mínimo: {editingProducto.stockMinimo} unidades</p>
                </div>

                {/* Tipo de operación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Movimiento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStockChange('operacion', 'suma')}
                      className={`p-3 rounded-lg text-center transition-colors ${
                        stockData.operacion === 'suma'
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-lg">➕</div>
                      <div className="text-sm">Entrada</div>
                    </button>
                    <button
                      onClick={() => handleStockChange('operacion', 'resta')}
                      className={`p-3 rounded-lg text-center transition-colors ${
                        stockData.operacion === 'resta'
                          ? 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-lg">➖</div>
                      <div className="text-sm">Salida</div>
                    </button>
                  </div>
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={stockData.cantidad}
                    onChange={(e) => handleStockChange('cantidad', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max={stockData.operacion === 'resta' ? editingProducto.cantidad : undefined}
                  />
                  {stockData.operacion === 'resta' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo disponible: {editingProducto.cantidad} unidades
                    </p>
                  )}
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo *
                  </label>
                  <select
                    value={stockData.motivo}
                    onChange={(e) => handleStockChange('motivo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar motivo</option>
                    {stockData.operacion === 'suma' ? (
                      <>
                        <option value="Compra">Compra</option>
                        <option value="Devolución">Devolución</option>
                        <option value="Ajuste inventario">Ajuste de inventario</option>
                        <option value="Otro">Otro</option>
                      </>
                    ) : (
                      <>
                        <option value="Venta">Venta</option>
                        <option value="Uso interno">Uso interno</option>
                        <option value="Pérdida">Pérdida</option>
                        <option value="Vencimiento">Vencimiento</option>
                        <option value="Ajuste inventario">Ajuste de inventario</option>
                        <option value="Otro">Otro</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Previsualización del resultado */}
                {stockData.cantidad > 0 && (
                  <div className={`p-3 rounded-lg ${
                    stockData.operacion === 'suma' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="text-sm font-medium text-gray-900">Resultado del movimiento:</p>
                    <p className="text-lg font-bold">
                      {editingProducto.cantidad} 
                      <span className={stockData.operacion === 'suma' ? 'text-green-600' : 'text-red-600'}>
                        {' '}{stockData.operacion === 'suma' ? '+' : '-'}{stockData.cantidad}
                      </span>
                      {' '}= {stockData.operacion === 'suma' 
                        ? editingProducto.cantidad + stockData.cantidad 
                        : Math.max(0, editingProducto.cantidad - stockData.cantidad)} unidades
                    </p>
                    
                    {/* Alerta si queda por debajo del mínimo */}
                    {stockData.operacion === 'resta' && 
                     (editingProducto.cantidad - stockData.cantidad) < editingProducto.stockMinimo && (
                      <div className="mt-2 flex items-center gap-2 text-orange-600">
                        <AlertTriangle size={16} />
                        <span className="text-xs">El stock quedará por debajo del mínimo</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateStock}
                  disabled={!isStockFormValid()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isStockFormValid()
                      ? `${stockData.operacion === 'suma' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {stockData.operacion === 'suma' ? 'Agregar' : 'Reducir'} Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}