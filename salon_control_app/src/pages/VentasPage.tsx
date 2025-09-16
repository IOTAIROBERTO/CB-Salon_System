import { useVentas } from '../hooks/useVentas';
import { useVentaModal } from '../hooks/useVentaModal';
import { useVentasSearch } from '../hooks/useVentasSearch';
import AddVentaButton from '../components/ventas/AddVentaButton';
import VentasSearch from '../components/ventas/VentasSearch';
import VentasList from '../components/ventas/VentasList';
import VentaModal from '../components/ventas/VentaModal';

export default function VentasPage() {
  // Custom hooks
  const { ventas, clientes, inventario, addVenta, deleteVenta } = useVentas();
  
  const {
    isModalOpen,
    ventaData,
    openModal,
    closeModal,
    updateFormData,
    updateItemQuantity
  } = useVentaModal();
  
  const { searchTerm, setSearchTerm, filteredVentas } = useVentasSearch(ventas, clientes);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion de Ventas</h1>
        <AddVentaButton onAdd={openModal} />
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <VentasSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Lista de ventas */}
      <VentasList
        ventas={filteredVentas}
        clientes={clientes}
        onDelete={deleteVenta}
      />

      {/* Modal Nueva Venta */}
      <VentaModal
        isOpen={isModalOpen}
        ventaData={ventaData}
        clientes={clientes}
        inventario={inventario}
        updateFormData={updateFormData}
        updateItemQuantity={updateItemQuantity}
        onSave={addVenta}
        onClose={closeModal}
      />
    </div>
  );
}