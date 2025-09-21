// src/hooks/useModalConfiguracion.ts
import { useState } from 'react';

export type ModalConfiguracionType = 'empresa' | 'colores' | 'logo' | 'email' | null;

export const useModalConfiguracion = () => {
  const [modalAbierto, setModalAbierto] = useState<ModalConfiguracionType>(null);

  const abrirModal = (tipo: ModalConfiguracionType) => {
    setModalAbierto(tipo);
  };

  const cerrarModal = () => {
    setModalAbierto(null);
  };

  return {
    modalAbierto,
    abrirModal,
    cerrarModal
  };
};