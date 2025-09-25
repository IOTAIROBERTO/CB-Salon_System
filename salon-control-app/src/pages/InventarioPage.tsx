import { useInventario } from '../hooks/useInventario';
import { useProductoModal } from '../hooks/useProductoModal';
import { calculateStats, getProductosStockBajo } from '../utils/inventarioUtils';
import AddProductoButton from '../components/inventario/AddProductoButton';
import InventarioStats from '../components/inventario/InventarioStats';
import StockBajoAlert from '../components/inventario/StockBajoAlert';
import ProductosTable from '../components/inventario/ProductosTable';
import ProductoModal from '../components/inventario/ProductoModal';
import StockModal from '../components/inventario/StockModal';
import EmptyInventario from '../components/inventario/EmptyInventario';

export default function InventarioPage() {
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

  // Handlers
  const handleDeleteProducto = (id: string) => {
    return deleteProducto(id);
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Inventario
          </h1>
          <AddProductoButton onAdd={openCreateModal} />
        </div>

        {/* Estadísticas */}
        <div className="mt-4">
          <InventarioStats stats={stats} />
        </div>

        {/* Alertas de stock bajo */}
        <div className="mt-4">
          <StockBajoAlert productosStockBajo={productosStockBajo} />
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