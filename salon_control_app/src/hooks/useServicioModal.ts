import { useState } from 'react';
import { Servicio, ServicioFormData } from '../types/catalogo';

const INITIAL_FORM_DATA: ServicioFormData = {
  nombre: '',
  precioSugerido: 0,
  anticipoSugerido: 0
};

export const useServicioModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [formData, setFormData] = useState<ServicioFormData>(INITIAL_FORM_DATA);

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingServicio(null);
    setIsModalOpen(true);
  };

  const openEditModal = (servicio: Servicio) => {
    setFormData({
      nombre: servicio.nombre,
      precioSugerido: servicio.precioSugerido,
      anticipoSugerido: servicio.anticipoSugerido
    });
    setEditingServicio(servicio);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServicio(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const updateFormData = (field: keyof ServicioFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    isModalOpen,
    editingServicio,
    formData,
    openCreateModal,
    openEditModal,
    closeModal,
    updateFormData
  };
};