import { useInventario } from '../hooks/useInventario';
import { useProductoModal } from '../hooks/useProductoModal';
import { calculateStats, getProductosStockBajo, getProductosPrecioBajo } from '../utils/inventarioUtils';
import AddProductoButton from '../components/inventario/AddProductoButton';
import InventarioStats from '../components/inventario/InventarioStats';
import StockBajoAlert from '../components/inventario/StockBajoAlert';
import PrecioBajoAlert from '../components/inventario/PrecioBajoAlert';
import ProductosTable from '../components/inventario/ProductosTable';
import ProductoModal from '../components/inventario/ProductoModal';
import StockModal from '../components/inventario/StockModal';
import EmptyInventario from '../components/inventario/EmptyInventario';
import ProveedoresTab from '../components/inventario/ProveedoresTab';
import ComprasTab from '../components/inventario/ComprasTab';
import CompraModal from '../components/inventario/CompraModal';
import { useState } from 'react';

const PESTANAS = [
  { id: 'productos', label: 'Productos' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'compras', label: 'Compras' }
] as const;

export default function InventarioPage() {
  const [pestana, setPestana] = useState<(typeof PESTANAS)[number]['id']>('productos');
  const [compra, setCompra] = useState<{ proveedorId?: string } | null>(null);

  // Custom hooks
  const {
    inventario,
    addProducto,
    updateProducto,
    updateStock,
    deleteProducto
  } = useInventario();

  const {
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
  } = useProductoModal();

  // Calcular datos derivados
  const stats = calculateStats(inventario);
  const productosStockBajo = getProductosStockBajo(inventario);
  const productosPrecioBajo = getProductosPrecioBajo(inventario);

  // Handlers
  const handleDeleteProducto = (id: string) => {
    return deleteProducto(id);
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-bold text-gray-900">
            Inventario
          </h1>
          {pestana === 'productos' && <AddProductoButton onAdd={openCreateModal} />}
        </div>

        <div className="flex gap-6 border-b border-gray-200 mt-4" role="tablist">
          {PESTANAS.map(t => (
            <button key={t.id} role="tab" aria-selected={pestana === t.id} onClick={() => setPestana(t.id)}
              className={`pb-2 -mb-px border-b-2 text-sm font-medium ${pestana === t.id ? 'border-purple-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {pestana === 'proveedores' && <ProveedoresTab onRegistrarCompra={proveedorId => setCompra({ proveedorId })} />}
      {pestana === 'compras' && <ComprasTab onRegistrarCompra={() => setCompra({})} />}
      {compra && <CompraModal proveedorId={compra.proveedorId} onClose={() => setCompra(null)} />}

      {pestana === 'productos' && (<>
      <div className="mb-6">

        {/* Estadísticas */}
        <div className="mt-4">
          <InventarioStats stats={stats} />
        </div>

        {/* Alertas de stock bajo */}
        <div className="mt-4">
          <StockBajoAlert productosStockBajo={productosStockBajo} />
        </div>

        {/* Precios de venta por debajo del margen mínimo */}
        <div className="mt-4">
          <PrecioBajoAlert productos={productosPrecioBajo} />
        </div>
      </div>

      {/* Contenido */}
      {inventario.length > 0 ? (
        <ProductosTable
          productos={inventario}
          onEdit={openEditModal}
          onEditStock={openStockModal}
          onDelete={handleDeleteProducto}
        />
      ) : (
        <EmptyInventario onAddProducto={openCreateModal} />
      )}
      </>)}

      {/* Modal de producto */}
      <ProductoModal
        isOpen={isModalOpen}
        modalType={modalType}
        editingProducto={editingProducto}
        formData={formData}
        updateFormData={updateFormData}
        onSave={addProducto}
        onUpdate={updateProducto}
        onClose={closeModal}
      />

      {/* Modal de stock */}
      <StockModal
        isOpen={isModalOpen}
        modalType={modalType}
        editingProducto={editingProducto}
        stockData={stockData}
        updateStockData={updateStockData}
        onUpdateStock={updateStock}
        onClose={closeModal}
      />
    </div>
  );
}