// src/pages/CitasPage.tsx - ACTUALIZADO CON EMAIL
import { useState, useMemo } from "react";
import { Plus, Mail } from "lucide-react";
import useCitas from "../hooks/useCitas";
import CitasStats from "../components/citas/CitasStats";
import CitaCard from "../components/citas/CitaCard";
import CitaModal from "../components/citas/CitaModal";
import CobroModal from "../components/citas/CobroModal"; 
import EmailIntegration from "../components/email/EmailIntegration";

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
  const [showEmailConfig, setShowEmailConfig] = useState(false);

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Gestión de Citas</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmailConfig(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Mail size={16} />
            <span className="hidden sm:inline">Email</span>
          </button>
          <button
            onClick={() => openModal("create")}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <CitasStats citas={citas} servicios={servicios} />

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por cliente o servicio..."
          className="w-full border px-3 py-2 rounded-lg"
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
          <p className="text-center text-gray-600">
            No hay citas programadas
          </p>
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

      {/* Modal de configuración de email */}
      {showEmailConfig && (
        <EmailIntegration onClose={() => setShowEmailConfig(false)} />
      )}
    </div>
  );
}