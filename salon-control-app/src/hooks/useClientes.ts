import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Cliente } from '../types/clientes';
import { generateClienteId, hasClienteRegistros } from '../utils/clientesUtils';

export const useClientes = () => {
  const [showInactivos, setShowInactivos] = useState(true);

  // Cargar clientes desde Dexie en tiempo real
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];

  const addCliente = async (clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
    const newCliente: Cliente = {
      id: generateClienteId(),
      ...clienteData,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };
    await db.clientes.add(newCliente as any);
    return newCliente;
  };

  const updateCliente = async (clienteId: string, updatedData: Partial<Cliente>) => {
    await db.clientes.update(clienteId, {
      ...updatedData,
      ultimaVisita: new Date().toISOString().split('T')[0]
    } as any);
  };

  const deleteCliente = async (clienteId: string) => {
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

    await db.clientes.delete(clienteId);
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