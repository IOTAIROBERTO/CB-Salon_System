import { useState } from 'react';
import { Producto, ProductoFormData, StockMovimiento, ModalType } from '../types/inventario';

const INITIAL_FORM_DATA: ProductoFormData = {
  nombre: '',
  cantidad: 0,
  precio: 0,
  stockMinimo: 5,
  categoria: '',
  proveedor: ''
};

const INITIAL_STOCK_DATA: StockMovimiento = {
  cantidad: 0,
  operacion: 'suma',
  motivo: ''
};

export const useProductoModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [modalType, setModalType] = useState<ModalType>('create');
  const [formData, setFormData] = useState<ProductoFormData>(INITIAL_FORM_DATA);
  const [stockData, setStockData] = useState<StockMovimiento>(INITIAL_STOCK_DATA);

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingProducto(null);
    setModalType('create');
    setIsModalOpen(true);
  };

  const openEditModal = (producto: Producto) => {
    setFormData({
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      precio: producto.precio,
      stockMinimo: producto.stockMinimo,
      categoria: producto.categoria,
      proveedor: producto.proveedor || ''
    });
    setEditingProducto(producto);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const openStockModal = (producto: Producto) => {
    setStockData(INITIAL_STOCK_DATA);
    setEditingProducto(producto);
    setModalType('stock');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(INITIAL_FORM_DATA);
    setStockData(INITIAL_STOCK_DATA);
    setEditingProducto(null);
    setModalType('create');
  };

  const updateFormData = (field: keyof ProductoFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateStockData = (field: keyof StockMovimiento, value: string | number) => {
    setStockData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    isModalOpen,
    editingProducto,
    modalType,
    formData,
    stockData,
    openCreateModal,
    openEditModal,
    openStockModal,
    closeModal,
    updateFormData,
    updateStockData
  };
};