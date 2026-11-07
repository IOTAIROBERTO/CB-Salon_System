import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { type Cliente } from '../types/clientes';
import { generateClienteId } from '../utils/clientesUtils';
import { fechaLocalISO } from '../utils/dateValidation';
import { confirmar } from '../components/Confirmar';

export const useClientes = () => {
  const [showInactivos, setShowInactivos] = useState(true);

  // Cargar clientes desde Dexie en tiempo real
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];

  const addCliente = async (clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
    const newCliente: Cliente = {
      id: generateClienteId(),
      ...clienteData,
      fechaRegistro: fechaLocalISO()
    };
    await db.clientes.add(newCliente as any);
    return newCliente;
  };

  const updateCliente = async (clienteId: string, updatedData: Partial<Cliente>) => {
    await db.clientes.update(clienteId, {
      ...updatedData,
      ultimaVisita: fechaLocalISO()
    } as any);
  };

  const deleteCliente = async (clienteId: string) => {
    // Con historial no se borra: dejaría citas, saldo, consentimientos y pedidos sin dueña. Se da de baja y se puede reactivar
    const conteos = await Promise.all([db.citas, db.ventas, db.movimientosSaldo, db.consentimientos, db.pedidos, db.fotos]
      .map(t => (t as any).where('clienteId').equals(clienteId).count() as Promise<number>));
    if (conteos.some(n => n > 0)) {
      if (!(await confirmar('Esta clienta tiene historial (citas, ventas, saldo o consentimientos), así que no se puede eliminar. ¿Darla de baja? Deja de aparecer en las búsquedas, se conserva su historial y puedes reactivarla desde su ficha.', { si: 'Dar de baja' }))) return false;
      await db.clientes.update(clienteId, { activo: false });
      return true;
    }
    if (!(await confirmar('¿Estás seguro de que quieres eliminar este cliente?'))) return false;
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