import { useState } from 'react';
import { Cliente, ClienteFormData } from '../types/clientes';

const INITIAL_FORM_DATA: ClienteFormData = {
  nombre: '',
  cumple: '',
  comentarios: '',
  activo: true,
  email: '',
  telefono: ''
};

export const useClienteModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteFormData>(INITIAL_FORM_DATA);

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingCliente(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setFormData({
      nombre: cliente.nombre,
      cumple: cliente.cumple,
      comentarios: cliente.comentarios,
      activo: cliente.activo,
      email: cliente.email || '',
      telefono: cliente.telefono || ''
    });
    setEditingCliente(cliente);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const updateFormData = (field: keyof ClienteFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    return formData.nombre.trim() !== '' && formData.cumple !== '';
  };

  return {
    isModalOpen,
    editingCliente,
    formData,
    openCreateModal,
    openEditModal,
    closeModal,
    updateFormData,
    isFormValid
  };
};