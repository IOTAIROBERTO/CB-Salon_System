import { useState, useEffect, useMemo } from 'react';
import { Plus, ShoppingCart, Package, User, DollarSign, Calendar, Edit, Trash2, X, Search, UserPlus, AlertTriangle } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  categoria: string;
}

interface Venta {
  id: string;
  fecha: string;
  clienteId?: string;
  clienteNombre?: string;
  productos: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
  total: number;
  metodoPago: string;
  notas?: string;
  clienteNuevo?: boolean;
}

interface ClienteTemp {
  nombre: string;
  email?: string;
  telefono?: string;
  registrar: boolean;
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inventario, setInventario] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [ventaData, setVentaData] = useState({
    clienteId: '',
    metodoPago: '',
    notas: ''
  });

  const [clienteTemp, setClienteTemp] = useState<ClienteTemp>({
    nombre: '',
    email: '',
    telefono: '',
    registrar: false
  });

  const [productosSeleccionados, setProductosSeleccionados] = useState<Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    stock: number;
  }>>([]);

  const [tipoCliente, setTipoCliente] = useState<'existente' | 'nuevo' | 'anonimo'>('existente');

  useEffect(() => {
    const ventasData = JSON.parse(localStorage.getItem('ventas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const inventarioData = JSON.parse(localStorage.getItem('inventario') || '[]');

    setVentas(ventasData);
    setClientes(clientesData.filter((c: Cliente) => c.activo));
    setInventario(inventarioData);
  }, []);

  // Estadisticas
  const ventasHoy = ventas.filter(v => 
    new Date(v.fecha).toDateString() === new Date().toDateString()
  ).length;
  
  const ingresosMes = ventas
    .filter(v => new Date(v.fecha).getMonth() === new Date().getMonth())
    .reduce((sum, v) => sum + v.total, 0);

  const totalVentas = ventas.length;
  const promedioVenta = totalVentas > 0 ? ingresosMes / totalVentas : 0;

  const generateId = () => `venta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const resetForm = () => {
    setVentaData({
      clienteId: '',
      metodoPago: '',
      notas: ''
    });
    setClienteTemp({
      nombre: '',
      email: '',
      telefono: '',
      registrar: false
    });
    setProductosSeleccionados([]);
    setTipoCliente('existente');
  };

  const openNewVentaModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const agregarProducto = (productoId: string) => {
    const producto = inventario.find(p => p.id === productoId);
    if (!producto) return;

    const existe = productosSeleccionados.find(p => p.productoId === productoId);
    if (existe) {
      if (existe.cantidad < existe.stock) {
        setProductosSeleccionados(prev => 
          prev.map(p => 
            p.productoId === productoId 
              ? { ...p, cantidad: p.cantidad + 1 }
              : p
          )
        );
      } else {
        alert(`No hay suficiente stock. Disponible: ${existe.stock}`);
      }
    } else {
      if (producto.cantidad > 0) {
        setProductosSeleccionados(prev => [...prev, {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precio: producto.precio,
          stock: producto.cantidad
        }]);
      } else {
        alert('Producto sin stock disponible');
      }
    }
  };

  const actualizarCantidadProducto = (productoId: string, nuevaCantidad: number) => {
    const producto = productosSeleccionados.find(p => p.productoId === productoId);
    if (!producto) return;

    if (nuevaCantidad <= 0) {
      setProductosSeleccionados(prev => 
        prev.filter(p => p.productoId !== productoId)
      );
    } else if (nuevaCantidad <= producto.stock) {
      setProductosSeleccionados(prev => 
        prev.map(p => 
          p.productoId === productoId 
            ? { ...p, cantidad: nuevaCantidad }
            : p
        )
      );
    } else {
      alert(`Cantidad maxima disponible: ${producto.stock}`);
    }
  };

  const eliminarProducto = (productoId: string) => {
    setProductosSeleccionados(prev => 
      prev.filter(p => p.productoId !== productoId)
    );
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
  };

  const isFormValid = () => {
    const hasProducts = productosSeleccionados.length > 0;
    const hasPaymentMethod = ventaData.metodoPago !== '';
    
    if (tipoCliente === 'existente') {
      return hasProducts && hasPaymentMethod && ventaData.clienteId;
    } else if (tipoCliente === 'nuevo') {
      return hasProducts && hasPaymentMethod && clienteTemp.nombre.trim() !== '';
    } else {
      return hasProducts && hasPaymentMethod && clienteTemp.nombre.trim() !== '';
    }
  };

  const registrarClienteTemp = () => {
    if (!clienteTemp.registrar) return null;

    const nuevoCliente: Cliente = {
      id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: clienteTemp.nombre.trim(),
      email: clienteTemp.email?.trim(),
      telefono: clienteTemp.telefono?.trim(),
      activo: true
    };

    const clientesActuales = JSON.parse(localStorage.getItem('clientes') || '[]');
    const clientesActualizados = [...clientesActuales, nuevoCliente];
    
    localStorage.setItem('clientes', JSON.stringify(clientesActualizados));
    setClientes(prev => [...prev, nuevoCliente]);
    
    return nuevoCliente.id;
  };

  const actualizarInventario = () => {
    const inventarioActualizado = inventario.map(item => {
      const productoVendido = productosSeleccionados.find(p => p.productoId === item.id);
      if (productoVendido) {
        return {
          ...item,
          cantidad: item.cantidad - productoVendido.cantidad
        };
      }
      return item;
    });

    setInventario(inventarioActualizado);
    localStorage.setItem('inventario', JSON.stringify(inventarioActualizado));
  };

  const procesarVenta = () => {
    if (!isFormValid()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const stockInsuficiente = productosSeleccionados.find(p => {
      const producto = inventario.find(inv => inv.id === p.productoId);
      return !producto || producto.cantidad < p.cantidad;
    });

    if (stockInsuficiente) {
      alert(`Stock insuficiente para ${stockInsuficiente.nombre}`);
      return;
    }

    let clienteIdFinal: string | undefined;
    let nombreClienteFinal: string | undefined;

    if (tipoCliente === 'existente') {
      clienteIdFinal = ventaData.clienteId;
    } else if (tipoCliente === 'nuevo' && clienteTemp.registrar) {
      clienteIdFinal = registrarClienteTemp();
    } else {
      nombreClienteFinal = clienteTemp.nombre.trim();
    }

    const nuevaVenta: Venta = {
      id: generateId(),
      fecha: new Date().toISOString(),
      clienteId: clienteIdFinal,
      clienteNombre: nombreClienteFinal,
      productos: productosSeleccionados.map(p => ({
        productoId: p.productoId,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio,
        subtotal: p.cantidad * p.precio
      })),
      total: calcularTotal(),
      metodoPago: ventaData.metodoPago,
      notas: ventaData.notas,
      clienteNuevo: tipoCliente === 'nuevo' && clienteTemp.registrar
    };

    const ventasActuales = [...ventas, nuevaVenta];
    setVentas(ventasActuales);
    localStorage.setItem('ventas', JSON.stringify(ventasActuales));

    actualizarInventario();

    const movimientos = JSON.parse(localStorage.getItem('movimientosStock') || '[]');
    productosSeleccionados.forEach(p => {
      movimientos.push({
        id: generateId(),
        productoId: p.productoId,
        productoNombre: p.nombre,
        cantidad: p.cantidad,
        operacion: 'resta',
        motivo: 'Venta',
        cantidadAnterior: inventario.find(inv => inv.id === p.productoId)?.cantidad || 0,
        cantidadNueva: (inventario.find(inv => inv.id === p.productoId)?.cantidad || 0) - p.cantidad,
        fecha: new Date().toISOString()
      });
    });
    localStorage.setItem('movimientosStock', JSON.stringify(movimientos));

    closeModal();
    alert('Venta procesada exitosamente!');
  };

  const eliminarVenta = (id: string) => {
    if (window.confirm('Estas seguro de que deseas eliminar esta venta? Esta accion no se puede deshacer.')) {
      const ventasActualizadas = ventas.filter(v => v.id !== id);
      setVentas(ventasActualizadas);
      localStorage.setItem('ventas', JSON.stringify(ventasActualizadas));
    }
  };

  const inventarioDisponible = inventario.filter(p => 
    p.cantidad > 0 && 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ventasFiltradas = useMemo(() => {
    return ventas.filter(venta => {
      const nombreCliente = venta.clienteId 
        ? clientes.find(c => c.id === venta.clienteId)?.nombre || ''
        : venta.clienteNombre || '';
      
      return nombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
             venta.productos.some(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [ventas, clientes, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ventas de Productos</h1>
          <button
            onClick={openNewVentaModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 justify-center"
          >
            <Plus size={20} />
            <span>Nueva Venta</span>
          </button>
        </div>

        {/* Estadisticas */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Hoy</p>
                <p className="text-2xl font-bold text-blue-600">{ventasHoy}</p>
              </div>
              <ShoppingCart size={24} className="text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-purple-600">{totalVentas}</p>
              </div>
              <Package size={24} className="text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-green-600">
                  ${ingresosMes.toLocaleString()}
                </p>
              </div>
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio por Venta</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${promedioVenta.toLocaleString()}
                </p>
              </div>
              <Calendar size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar ventas por cliente o producto..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de ventas */}
      {ventasFiltradas.length > 0 ? (
        <div className="space-y-4">
          {ventasFiltradas.map(venta => (
            <div key={venta.id} className="bg-white rounded-lg shadow border p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {venta.clienteId 
                          ? clientes.find(c => c.id === venta.clienteId)?.nombre || 'Cliente no encontrado'
                          : venta.clienteNombre || 'Cliente sin registro'
                        }
                      </span>
                      {venta.clienteNuevo && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Cliente nuevo
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(venta.fecha)}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Productos:</h4>
                    <div className="space-y-1">
                      {venta.productos.map((producto, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {producto.nombre} x{producto.cantidad}
                          </span>
                          <span className="font-medium text-gray-900">
                            ${producto.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between text-base font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">${venta.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {venta.metodoPago}
                    </span>
                  </div>

                  {venta.notas && (
                    <p className="text-gray-600 text-sm italic bg-yellow-50 p-2 rounded">
                      "{venta.notas}"
                    </p>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col gap-2">
                  <button
                    onClick={() => eliminarVenta(venta.id)}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                    title="Eliminar venta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ShoppingCart size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay ventas registradas
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza realizando tu primera venta de producto.
          </p>
          <button 
            onClick={openNewVentaModal}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Realizar Primera Venta
          </button>
        </div>
      )}

      {/* Modal para nueva venta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nueva Venta de Productos</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Productos */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Productos</h3>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {inventarioDisponible.length > 0 ? (
                      inventarioDisponible.map(producto => (
                        <div key={producto.id} className="p-3 border-b hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{producto.nombre}</p>
                              <p className="text-sm text-gray-600">
                                Stock: {producto.cantidad} | ${producto.precio}
                              </p>
                            </div>
                            <button
                              onClick={() => agregarProducto(producto.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No hay productos disponibles
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Productos Seleccionados</h4>
                    {productosSeleccionados.length > 0 ? (
                      <div className="space-y-2">
                        {productosSeleccionados.map(producto => (
                          <div key={producto.productoId} className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{producto.nombre}</p>
                              <p className="text-sm text-gray-600">${producto.precio} c/u</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={producto.cantidad}
                                onChange={(e) => actualizarCantidadProducto(producto.productoId, Number(e.target.value))}
                                className="w-16 px-2 py-1 border rounded text-center text-sm"
                                min="1"
                                max={producto.stock}
                              />
                              <span className="text-sm font-medium">${(producto.cantidad * producto.precio).toLocaleString()}</span>
                              <button
                                onClick={() => eliminarProducto(producto.productoId)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="text-right pt-2 border-t">
                          <span className="text-lg font-bold text-green-600">
                            Total: ${calcularTotal().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No hay productos seleccionados
                      </p>
                    )}
                  </div>
                </div>

                {/* Cliente y pago */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informacion de la Venta</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Cliente
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoCliente"
                          checked={tipoCliente === 'existente'}
                          onChange={() => setTipoCliente('existente')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Cliente existente</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoCliente"
                          checked={tipoCliente === 'nuevo'}
                          onChange={() => setTipoCliente('nuevo')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Cliente nuevo</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoCliente"
                          checked={tipoCliente === 'anonimo'}
                          onChange={() => setTipoCliente('anonimo')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Venta sin registro</span>
                      </label>
                    </div>
                  </div>

                  {tipoCliente === 'existente' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Cliente *
                      </label>
                      <select
                        value={ventaData.clienteId}
                        onChange={e => setVentaData({ ...ventaData, clienteId: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Seleccionar cliente</option>
                        {clientes.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(tipoCliente === 'nuevo' || tipoCliente === 'anonimo') && (
                    <div className="mb-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre del Cliente *
                        </label>
                        <input
                          type="text"
                          value={clienteTemp.nombre}
                          onChange={e => setClienteTemp({ ...clienteTemp, nombre: e.target.value })}
                          placeholder="Nombre completo"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      {tipoCliente === 'nuevo' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email (opcional)
                            </label>
                            <input
                              type="email"
                              value={clienteTemp.email}
                              onChange={e => setClienteTemp({ ...clienteTemp, email: e.target.value })}
                              placeholder="cliente@email.com"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Telefono (opcional)
                            </label>
                            <input
                              type="tel"
                              value={clienteTemp.telefono}
                              onChange={e => setClienteTemp({ ...clienteTemp, telefono: e.target.value })}
                              placeholder="+52 55 1234 5678"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={clienteTemp.registrar}
                              onChange={e => setClienteTemp({ ...clienteTemp, registrar: e.target.checked })}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                              Registrar cliente para futuras promociones
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metodo de Pago *
                    </label>
                    <select
                      value={ventaData.metodoPago}
                      onChange={e => setVentaData({ ...ventaData, metodoPago: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccionar metodo</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="mixto">Pago mixto</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={ventaData.notas}
                      onChange={e => setVentaData({ ...ventaData, notas: e.target.value })}
                      placeholder="Observaciones de la venta..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>

                  {productosSeleccionados.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-green-800 mb-2">
                        Resumen de la Venta
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700">Productos:</span>
                          <span className="font-medium">{productosSeleccionados.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Cantidad total:</span>
                          <span className="font-medium">
                            {productosSeleccionados.reduce((sum, p) => sum + p.cantidad, 0)} unidades
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t pt-2">
                          <span className="text-green-800">Total a cobrar:</span>
                          <span className="text-green-800">${calcularTotal().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarVenta}
                  disabled={!isFormValid()}
                  className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                    isFormValid()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Procesar Venta (${calcularTotal().toLocaleString()})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
    