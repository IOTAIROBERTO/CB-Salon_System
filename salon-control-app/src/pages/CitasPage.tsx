// src/pages/CitasPage.tsx - Sin funcionalidad de Email
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import useCitas from "../hooks/useCitas";
import CitasStats from "../components/citas/CitasStats";
import CitaCard from "../components/citas/CitaCard";
import CitaModal from "../components/citas/CitaModal";
import CobroModal from "../components/citas/CobroModal";
import ReagendarModal from "../components/citas/ReagendarModal";
import CalendarioGoogle from "../components/citas/CalendarioGoogle";
import EventosGoogle, { registrarAdopcion, type EventoGoogle } from "../components/citas/EventosGoogle";

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

  const [params, setParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => params.get("q") || "");
  // Desde la búsqueda global llega ?q=…; desde la cita exprés, ?nueva=1 (abre «Nueva cita» completa)
  useEffect(() => {
    if (params.get("q")) setSearchTerm(params.get("q") || "");
    if (params.get("nueva")) { openModal("create"); setParams({}, { replace: true }); }
  }, [params]);
  const [vista, setVista] = useState<"lista" | "google">("lista");
  const [desdeGoogle, setDesdeGoogle] = useState<EventoGoogle | null>(null);   // evento de Google que se registra como cita

  const filteredCitas = useMemo(() => {
    const cerrada = (c: { estado: string }) => ['completada', 'cancelada', 'no_llego'].includes(c.estado);
    const clave = (c: { fecha: string; hora: string }) => `${c.fecha} ${c.hora}`;
    const ordenadas = [...citas].sort((a, b) =>
      Number(cerrada(a)) - Number(cerrada(b)) ||
      (cerrada(a) ? clave(b).localeCompare(clave(a)) : clave(a).localeCompare(clave(b))));
    return ordenadas.filter((cita) => {
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
      <div className="flex justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold">Citas</h1>
          <p className="text-gray-600 mt-1">
            Administra las citas y servicios de tu salón
          </p>
        </div>
        <button
          onClick={() => openModal("create")}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex shrink-0 items-center gap-2 self-start whitespace-nowrap transition-colors"
        >
          <Plus size={20} />
          Nueva cita
        </button>
      </div>

      {/* Estadísticas */}
      <CitasStats citas={citas} servicios={servicios} />

      {/* Lista de citas o el Google Calendar de Cristina */}
      <div className="mb-4 flex rounded-lg bg-gray-100 p-1 w-fit">
        <button onClick={() => setVista("lista")} className={`rounded-md px-4 py-1.5 text-sm ${vista === "lista" ? "bg-white font-medium shadow-sm" : "text-gray-500"}`}>Lista</button>
        <button onClick={() => setVista("google")} className={`rounded-md px-4 py-1.5 text-sm ${vista === "google" ? "bg-white font-medium shadow-sm" : "text-gray-500"}`}>Calendario de Google</button>
      </div>
      {vista === "google" && <CalendarioGoogle />}

      {vista === "lista" && <>
      <EventosGoogle onRegistrar={setDesdeGoogle} />

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
      </>}

      {/* Modales */}
      {desdeGoogle && (
        <CitaModal
          clientes={clientes}
          servicios={servicios}
          onClose={() => setDesdeGoogle(null)}
          onSave={async (datos) => { const ev = desdeGoogle; const id = await saveCita(datos); await registrarAdopcion(id, ev.id); }}
          inicial={{ fecha: desdeGoogle.desde.slice(0, 10), hora: desdeGoogle.desde.slice(11, 16), notas: desdeGoogle.titulo, estado: "confirmada", googleAdoptar: desdeGoogle.id }}
        />
      )}

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