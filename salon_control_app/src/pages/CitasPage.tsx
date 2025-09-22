// src/pages/CitasPage.tsx - Sin funcionalidad de Email
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import useCitas from "../hooks/useCitas";
import CitasStats from "../components/citas/CitasStats";
import CitaCard from "../components/citas/CitaCard";
import CitaModal from "../components/citas/CitaModal";
import CobroModal from "../components/citas/CobroModal";
import ReagendarModal from "../components/citas/ReagendarModal";

export default function CitasPage() {
  const {
    citas,
    clientes,
    servicios,
    saveCita,
    completarCita,
    deleteCita,
    updateAnticipo,
    changeEstadoCita,
    openModal,
    closeModal,
    modalState,
  } = useCitas();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredCitas = useMemo(() => {
    return citas.filter((cita) => {
      return (
        !searchTerm ||
        clientes.find((c) => c.id === cita.clienteId)?.nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        servicios.find((s) => s.id === cita.servicioId)?.nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    });
  }, [citas, searchTerm, clientes, servicios]);

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Citas</h1>
          <p className="text-gray-600 mt-1">
            Administra las citas y servicios de tu salón
          </p>
        </div>
        <button
          onClick={() => openModal("create")}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Cita
        </button>
      </div>

      {/* Estadísticas */}
      <CitasStats citas={citas} servicios={servicios} />

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por cliente o servicio..."
          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de citas */}
      <div className="space-y-4">
        {filteredCitas.length > 0 ? (
          filteredCitas.map((cita) => (
            <CitaCard
              key={cita.id}
              cita={cita}
              clientes={clientes}
              servicios={servicios}
              onDelete={deleteCita}
              onEstadoChange={changeEstadoCita}
              onUpdateAnticipo={updateAnticipo}
              onOpenCobro={() => openModal("cobro", cita)}
              onOpenEdit={() => openModal("edit", cita)}
              onOpenReagendar={() => openModal("reagendar", cita)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay citas programadas
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'No se encontraron citas que coincidan con tu búsqueda' 
                : 'Comienza creando tu primera cita'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal("create")}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Crear Primera Cita
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {modalState.type === "create" && (
        <CitaModal
          clientes={clientes}
          servicios={servicios}
          onClose={closeModal}
          onSave={saveCita}
        />
      )}

      {modalState.type === "edit" && modalState.data && (
        <CitaModal
          clientes={clientes}
          servicios={servicios}
          onClose={closeModal}
          onSave={saveCita}
          citaEdit={modalState.data}
        />
      )}

      {modalState.type === "cobro" && modalState.data && (
        <CobroModal
          cita={modalState.data}
          servicios={servicios}
          onClose={closeModal}
          onCompletar={completarCita}
        />
      )}

      {modalState.type === "reagendar" && modalState.data && (
        <ReagendarModal
          cita={modalState.data}
          onClose={closeModal}
          onSave={saveCita}
        />
      )}
    </div>
  );
}