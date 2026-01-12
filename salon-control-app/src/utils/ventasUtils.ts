import { Venta, VentaFormData, VentasStats, Item, Cliente } from '../types/ventas';
import { formatCurrency } from './financialUtils';

export const validateVentaForm = (formData: VentaFormData): string | null => {
  if (!formData.clienteId) {
    return 'Debes seleccionar un cliente';
  }

  if (formData.items.length === 0) {
    return 'Debes agregar al menos un producto';
  }

  const hasValidItems = formData.items.some(item => item.cantidad > 0);
  if (!hasValidItems) {
    return 'Debes especificar cantidades válidas para los productos';
  }

  return null;
};

export const calculateVentaTotal = (items: { itemId: string; cantidad: number }[], inventario: Item[]): number => {
  return items.reduce((acc, item) => {
    const producto = inventario.find(i => i.id === item.itemId);
    return acc + (producto ? producto.precio * item.cantidad : 0);
  }, 0);
};

export const generateVentaId = (): string => {
  return `venta_${Date.now()}`;
};

export const calculateVentasStats = (ventas: Venta[]): VentasStats => {
  const totalVentas = ventas.length;
  const ingresosTotales = ventas.reduce((sum, venta) => sum + venta.total, 0);

  // Ventas de hoy
  const hoy = new Date().toDateString();
  const ventasHoy = ventas.filter(venta =>
    new Date(venta.fecha).toDateString() === hoy
  ).length;

  const promedioVenta = totalVentas > 0 ? ingresosTotales / totalVentas : 0;

  return {
    totalVentas,
    ingresosTotales,
    ventasHoy,
    promedioVenta
  };
};

export const filterVentasBySearch = (ventas: Venta[], clientes: Cliente[], searchTerm: string): Venta[] => {
  if (!searchTerm) return ventas;

  return ventas.filter((venta) => {
    const cliente = clientes.find((c) => c.id === venta.clienteId);
    return (cliente?.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });
};

export const getClienteName = (clienteId: string, clientes: Cliente[]): string => {
  const cliente = clientes.find(c => c.id === clienteId);
  return cliente?.nombre || 'Cliente desconocido';
};

export const formatPrice = (price: number): string => {
  return formatCurrency(price);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES');
};

export const loadDataFromStorage = () => {
  try {
    const ventasData = JSON.parse(localStorage.getItem('ventas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const inventarioData = JSON.parse(localStorage.getItem('inventario') || '[]');

    return {
      ventas: Array.isArray(ventasData) ? ventasData : [],
      clientes: Array.isArray(clientesData)
        ? clientesData.filter((c: Cliente) => c.activo)
        : [],
      inventario: Array.isArray(inventarioData) ? inventarioData : []
    };
  } catch (error) {
    console.error('Error cargando datos desde localStorage:', error);
    return {
      ventas: [],
      clientes: [],
      inventario: []
    };
  }
};