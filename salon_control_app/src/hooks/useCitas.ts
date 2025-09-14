// src/hooks/useCitas.ts
import { useState, useEffect } from "react";
import { Cita, Cliente, Servicio } from "../types";

export default function useCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [modalState, setModalState] = useState<{ type: string; data?: Cita | null }>({
    type: "",
    data: null,
  });

  // --- Lógica de inicialización ---
  useEffect(() => {
    const citasData = JSON.parse(localStorage.getItem("citas") || "[]");
    const clientesData = JSON.parse(localStorage.getItem("clientes") || "[]");
    const serviciosData = JSON.parse(localStorage.getItem("servicios") || "[]");

    setCitas(citasData);
    setClientes(clientesData.filter((c: Cliente) => c.activo));
    setServicios(serviciosData);
  }, []);

  // --- CRUD ---
  const saveCita = (formData: any) => {
    if (formData.id) {
      // Modo edición: actualizar cita existente
      const updatedCitas = citas.map((c) =>
        c.id === formData.id ? { ...c, ...formData } : c
      );
      setCitas(updatedCitas);
      localStorage.setItem("citas", JSON.stringify(updatedCitas));
    } else {
      // Modo creación: nueva cita
      const newCita: Cita = {
        id: `cita_${Date.now()}`,
        ...formData,
        estado: "pendiente",
      };
      const updatedCitas = [...citas, newCita];
      setCitas(updatedCitas);
      localStorage.setItem("citas", JSON.stringify(updatedCitas));
    }
  };

  const deleteCita = (id: string) => {
    const updatedCitas = citas.filter((c) => c.id !== id);
    setCitas(updatedCitas);
    localStorage.setItem("citas", JSON.stringify(updatedCitas));
  };

  const changeEstadoCita = (id: string, newEstado: Cita["estado"]) => {
    const updatedCitas = citas.map((c) =>
      c.id === id ? { ...c, estado: newEstado } : c
    );
    setCitas(updatedCitas);
    localStorage.setItem("citas", JSON.stringify(updatedCitas));
  };

  const updateAnticipo = (id: string, anticipoConfirmado: boolean, monto?: number) => {
    const updatedCitas = citas.map((c) =>
      c.id === id ? { ...c, anticipoConfirmado, montoAnticipo: monto || 0 } : c
    );
    setCitas(updatedCitas);
    localStorage.setItem("citas", JSON.stringify(updatedCitas));
  };

  // ✅ NUEVA FUNCIÓN: completarCita
  const completarCita = (citaId: string, precioFinal: number, metodoPago: string, notas: string) => {
    const updatedCitas = citas.map((c) => {
      if (c.id === citaId) {
        const saldoPendiente = Math.max(0, precioFinal - (c.montoAnticipo || 0));
        return {
          ...c,
          estado: "completada" as const,
          precioFinal,
          metodoPago,
          notas: notas || c.notas,
          saldoPendiente,
          fechaCompletada: new Date().toISOString(),
        };
      }
      return c;
    });
    
    setCitas(updatedCitas);
    localStorage.setItem("citas", JSON.stringify(updatedCitas));
  };

  const openModal = (type: string, data: Cita | null = null) =>
    setModalState({ type, data });

  const closeModal = () => setModalState({ type: "", data: null });

  // 🔹 Return con la nueva función
  return {
    citas,
    clientes,
    servicios,
    saveCita,
    completarCita, // ✅ Agregada la función que faltaba
    deleteCita,
    changeEstadoCita,
    updateAnticipo,
    openModal,
    closeModal,
    modalState,
  };
}