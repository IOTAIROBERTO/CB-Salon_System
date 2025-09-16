import { useState, useEffect } from 'react';
import { Venta, Cliente, Item } from '../types/ventas';
import { loadDataFromStorage } from '../utils/ventasUtils';

export const useVentas = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inventario, setInventario] = useState<Item[]>([]);

  // Cargar datos desde localStorage
  useEffect(() => {
    const { ventas: ventasData, clientes: clientesData, inventario: inventarioData } = loadDataFromStorage();
    setVentas(ventasData);
    setClientes(clientesData);
    setInventario(inventarioData);
  }, []);

  const addVenta = (nuevaVenta: Venta) => {
    const updatedVentas = [...ventas, nuevaVenta];
    setVentas(updatedVentas);
    localStorage.setItem('ventas', JSON.stringify(updatedVentas));
  };

  const deleteVenta = (ventaId: string): boolean => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      return false;
    }
    
    const updatedVentas = ventas.filter(v => v.id !== ventaId);
    setVentas(updatedVentas);
    localStorage.setItem('ventas', JSON.stringify(updatedVentas));
    return true;
  };

  return {
    ventas,
    clientes,
    inventario,
    addVenta,
    deleteVenta
  };
};