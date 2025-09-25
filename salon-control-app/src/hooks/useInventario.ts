import { useState, useEffect } from 'react';
import { Producto, StockMovimiento, INVENTARIO_INICIAL } from '../types/inventario';
import { 
  generateProductoId, 
  calculateNewStock, 
  createMovimientoHistorial, 
  saveMovimientoHistorial 
} from '../utils/inventarioUtils';

const STORAGE_KEY = 'inventario';

export const useInventario = () => {
  const [inventario, setInventario] = useState<Producto[]>([]);

  // Cargar inventario desde localStorage
  useEffect(() => {
    const inventarioData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (inventarioData.length === 0) {
      initializeWithDefaultData();
    } else {
      setInventario(inventarioData);
    }
  }, []);

  const initializeWithDefaultData = () => {
    setInventario(INVENTARIO_INICIAL);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INVENTARIO_INICIAL));
  };

  const saveToStorage = (newInventario: Producto[]) => {
    setInventario(newInventario);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newInventario));
  };

  const addProducto = (productoData: Omit<Producto, 'id' | 'fechaUltimaCompra'>) => {
    const newProducto: Producto = {
      id: generateProductoId(),
      ...productoData,
      fechaUltimaCompra: new Date().toISOString().split('T')[0]
    };
    const updatedInventario = [...inventario, newProducto];
    saveToStorage(updatedInventario);
    return newProducto;
  };

  const updateProducto = (productoId: string, updatedData: Partial<Producto>) => {
    const updatedInventario = inventario.map(producto =>
      producto.id === productoId
        ? { ...producto, ...updatedData }
        : producto
    );
    saveToStorage(updatedInventario);
  };

  const updateStock = (productoId: string, stockData: StockMovimiento): boolean => {
    const producto = inventario.find(p => p.id === productoId);
    if (!producto) return false;

    const nuevaCantidad = calculateNewStock(producto.cantidad, stockData);
    
    // Crear historial del movimiento
    const movimiento = createMovimientoHistorial(producto, stockData, nuevaCantidad);
    saveMovimientoHistorial(movimiento);

    // Actualizar producto
    const updatedData: Partial<Producto> = {
      cantidad: nuevaCantidad,
      fechaUltimaCompra: stockData.operacion === 'suma' 
        ? new Date().toISOString().split('T')[0] 
        : producto.fechaUltimaCompra
    };

    updateProducto(productoId, updatedData);
    return true;
  };

  const deleteProducto = (productoId: string): boolean => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      return false;
    }
    
    const updatedInventario = inventario.filter(producto => producto.id !== productoId);
    saveToStorage(updatedInventario);
    return true;
  };

  return {
    inventario,
    addProducto,
    updateProducto,
    updateStock,
    deleteProducto
  };
};