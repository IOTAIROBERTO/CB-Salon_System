// src/hooks/useCitas.ts
import { useState, useEffect } from "react";
import { Cita, Cliente, Servicio } from "../types/citas";

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

  // ✅ FUNCIÓN ACTUALIZADA: completarCita con servicios adicionales y servicio modificado
  const completarCita = (citaId: string, precioFinal: number, metodoPago: string, notas: string, datosCompletos?: any) => {
    const updatedCitas = citas.map((c) => {
      if (c.id === citaId) {
        return {
          ...c,
          // Si se cambió el servicio principal, actualizarlo
          servicioId: datosCompletos?.servicioSeleccionado || c.servicioId,
          estado: "completada" as const,
          precioFinal,
          metodoPago,
          notas: notas || c.notas,
          // Actualizar anticipo si fue modificado en el CobroModal
          montoAnticipo: datosCompletos?.anticipoRecibido || c.montoAnticipo,
          anticipoConfirmado: true, // Marcar como confirmado al completar
          serviciosAdicionales: datosCompletos?.serviciosAdicionales || [],
          descuentoAplicado: datosCompletos?.descuento || 0,
          subtotalOriginal: datosCompletos?.subtotalServicios || precioFinal,
          montoDescuento: datosCompletos?.montoDescuento || 0,
          saldoPendiente: 0, // Las citas completadas no tienen saldo pendiente
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