import { useCatalogo } from '../hooks/useCatalogo';
import { useServicioModal } from '../hooks/useServicioModal';
import AddServiceButton from '../components/catalogo/AddServiceButton';
import ServiciosTable from '../components/catalogo/ServiciosTable';
import ServicioModal from '../components/catalogo/ServicioModal';

export default function CatalogoPreciosPage() {
  // Custom hooks para separar la lógica
  const { servicios, addServicio, updateServicio, deleteServicio } = useCatalogo();
  
  const {
    isModalOpen,
    editingServicio,
    formData,
    openCreateModal,
    openEditModal,
    closeModal,
    updateFormData
  } = useServicioModal();

  return (
    <div className="w-full max-w-none space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Catálogo de Servicios
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona los servicios y sus precios sugeridos
          </p>
        </div>
        <AddServiceButton onAdd={openCreateModal} />
      </div>

      {/* Tabla de servicios */}
      <ServiciosTable
        servicios={servicios}
        onEdit={openEditModal}
        onDelete={deleteServicio}
      />

      {/* Modal de creación/edición */}
      <ServicioModal
        isOpen={isModalOpen}
        editingServicio={editingServicio}
        formData={formData}
        updateFormData={updateFormData}
        onSave={addServicio}
        onUpdate={updateServicio}
        onClose={closeModal}
      />
    </div>
  );
}