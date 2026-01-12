// src/pages/VentasPage.tsx
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h1>
          <p className="text-gray-600 mt-1">
            Registro y seguimiento de ventas de productos
          </p>
        </div>
        <AddVentaButton onAdd={openModal} />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total de Ventas</div>
          <div className="text-2xl font-bold text-green-600">{ventas.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Ingresos Totales</div>
          <div className="text-2xl font-bold text-green-600">
            ${ventas.reduce((sum, v) => sum + (v.total || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Promedio por Venta</div>
          <div className="text-2xl font-bold text-green-600">
            ${ventas.length > 0 ? Math.round(ventas.reduce((sum, v) => sum + (v.total || 0), 0) / ventas.length).toLocaleString() : 0}
          </div>
        </div>
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
        inventario={inventario}
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