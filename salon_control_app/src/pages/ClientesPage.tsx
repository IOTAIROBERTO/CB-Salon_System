import { useClientes } from '../hooks/useClientes';
import { useClienteModal } from '../hooks/useClienteModal';
import { useViewMode } from '../hooks/useViewMode';
import { calculateStats, getCumpleanerosMes } from '../utils/clientesUtils';
import AddClienteButton from '../components/clientes/AddClienteButton';
import ClientesStats from '../components/clientes/ClientesStats';
import CumpleanerosBanner from '../components/clientes/CumpleanerosBanner';
import ClientesControls from '../components/clientes/ClientesControls';
import ClientesTable from '../components/clientes/ClientesTable';
import ClientesCards from '../components/clientes/ClientesCards';
import ClienteModal from '../components/clientes/ClienteModal';
import EmptyState from '../components/clientes/EmptyState';

export default function ClientesPage() {
  // Custom hooks
  const {
    clientes,
    clientesFiltrados,
    showInactivos,
    setShowInactivos,
    addCliente,
    updateCliente,
    deleteCliente
  } = useClientes();

  const {
    isModalOpen,
    editingCliente,
    formData,
    openCreateModal,
    openEditModal,
    closeModal,
    updateFormData,
    isFormValid
  } = useClienteModal();

  const { viewMode, setViewMode } = useViewMode();

  // Calcular datos derivados
  const stats = calculateStats(clientes);
  const cumpleaneros = getCumpleanerosMes(clientes);

  // Handlers
  const handleDeleteCliente = (id: string) => {
    const success = deleteCliente(id);
    if (success) {
      alert('Cliente eliminado exitosamente');
    }
  };

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Clientes
          </h1>
          <AddClienteButton onAdd={openCreateModal} />
        </div>

        {/* Estadísticas */}
        <div className="mt-4">
          <ClientesStats stats={stats} />
        </div>

        {/* Banner de cumpleañeros */}
        <div className="mt-4">
          <CumpleanerosBanner cumpleaneros={cumpleaneros} />
        </div>

        {/* Controles */}
        <div className="mt-4">
          <ClientesControls
            showInactivos={showInactivos}
            setShowInactivos={setShowInactivos}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>
      </div>

      {/* Contenido */}
      {clientesFiltrados.length === 0 ? (
        <EmptyState
          hasClientes={clientes.length > 0}
          onAddCliente={openCreateModal}
          onShowInactivos={() => setShowInactivos(true)}
        />
      ) : viewMode === 'table' ? (
        <ClientesTable
          clientes={clientesFiltrados}
          onEdit={openEditModal}
          onDelete={handleDeleteCliente}
        />
      ) : (
        <ClientesCards
          clientes={clientesFiltrados}
          onEdit={openEditModal}
          onDelete={handleDeleteCliente}
        />
      )}

      {/* Modal */}
      <ClienteModal
        isOpen={isModalOpen}
        editingCliente={editingCliente}
        formData={formData}
        updateFormData={updateFormData}
        isFormValid={isFormValid}
        onSave={addCliente}
        onUpdate={updateCliente}
        onClose={closeModal}
      />
    </div>
  );
}