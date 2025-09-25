import { useState, useEffect } from 'react';
import { Cliente, CLIENTES_INICIALES } from '../types/clientes';
import { generateClienteId, hasClienteRegistros } from '../utils/clientesUtils';

const STORAGE_KEY = 'clientes';

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showInactivos, setShowInactivos] = useState(true);

  // Cargar clientes desde localStorage
  useEffect(() => {
    const clientesData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (clientesData.length === 0) {
      initializeWithDefaultData();
    } else {
      // Migrar datos antiguos si es necesario
      const clientesMigrados = clientesData.map((cliente: any) => ({
        ...cliente,
        activo: cliente.posibleBaja !== undefined ? !cliente.posibleBaja : (cliente.activo ?? true),
        fechaRegistro: cliente.fechaRegistro || new Date().toISOString().split('T')[0]
      }));
      setClientes(clientesMigrados);
    }
  }, []);

  const initializeWithDefaultData = () => {
    setClientes(CLIENTES_INICIALES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CLIENTES_INICIALES));
  };

  const saveToStorage = (newClientes: Cliente[]) => {
    setClientes(newClientes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newClientes));
  };

  const addCliente = (clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
    const newCliente: Cliente = {
      id: generateClienteId(),
      ...clienteData,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };
    const updatedClientes = [...clientes, newCliente];
    saveToStorage(updatedClientes);
    return newCliente;
  };

  const updateCliente = (clienteId: string, updatedData: Partial<Cliente>) => {
    const updatedClientes = clientes.map(cliente =>
      cliente.id === clienteId
        ? { 
            ...cliente, 
            ...updatedData,
            ultimaVisita: new Date().toISOString().split('T')[0]
          }
        : cliente
    );
    saveToStorage(updatedClientes);
  };

  const deleteCliente = (clienteId: string): boolean => {
    // Verificar si el cliente tiene registros
    if (hasClienteRegistros(clienteId)) {
      const confirmarEliminacion = confirm(
        'Este cliente tiene citas o servicios registrados. ¿Estás seguro de eliminarlo? ' +
        'Se recomienda marcarlo como inactivo en su lugar.'
      );
      if (!confirmarEliminacion) return false;
    } else {
      if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return false;
    }
    
    const updatedClientes = clientes.filter(cliente => cliente.id !== clienteId);
    saveToStorage(updatedClientes);
    return true;
  };

  // Filtrar clientes según el estado
  const clientesFiltrados = showInactivos ? clientes : clientes.filter(c => c.activo);

  return {
    clientes,
    clientesFiltrados,
    showInactivos,
    setShowInactivos,
    addCliente,
    updateCliente,
    deleteCliente
  };
};