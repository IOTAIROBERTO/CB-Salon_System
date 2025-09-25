import { useState, useMemo } from 'react';
import { Venta, Cliente } from '../types/ventas';
import { filterVentasBySearch } from '../utils/ventasUtils';

export const useVentasSearch = (ventas: Venta[], clientes: Cliente[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVentas = useMemo(() => 
    filterVentasBySearch(ventas, clientes, searchTerm),
    [ventas, clientes, searchTerm]
  );

  return {
    searchTerm,
    setSearchTerm,
    filteredVentas
  };
};