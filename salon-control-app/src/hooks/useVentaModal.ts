import { useState } from 'react';
import { VentaFormData, VentaItem } from '../types/ventas';

const INITIAL_FORM_DATA: VentaFormData = {
  clienteId: '',
  items: [],
  notas: '',
  empleadoId: ''
};

export const useVentaModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ventaData, setVentaData] = useState<VentaFormData>(INITIAL_FORM_DATA);

  const openModal = () => {
    setVentaData(INITIAL_FORM_DATA);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setVentaData(INITIAL_FORM_DATA);
  };

  const updateFormData = (field: keyof VentaFormData, value: any) => {
    setVentaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateItemQuantity = (itemId: string, cantidad: number) => {
    setVentaData(prev => {
      const existingItem = prev.items.find(i => i.itemId === itemId);
      let updatedItems: VentaItem[];

      if (existingItem) {
        if (cantidad === 0) {
          // Remover item si la cantidad es 0
          updatedItems = prev.items.filter(i => i.itemId !== itemId);
        } else {
          // Actualizar cantidad existente
          updatedItems = prev.items.map(i =>
            i.itemId === itemId ? { ...i, cantidad } : i
          );
        }
      } else if (cantidad > 0) {
        // Agregar nuevo item solo si la cantidad es mayor a 0
        updatedItems = [...prev.items, { itemId, cantidad }];
      } else {
        // No hacer nada si es un item nuevo con cantidad 0
        updatedItems = prev.items;
      }

      return { ...prev, items: updatedItems };
    });
  };

  return {
    isModalOpen,
    ventaData,
    openModal,
    closeModal,
    updateFormData,
    updateItemQuantity
  };
};