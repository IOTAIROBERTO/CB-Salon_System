// src/hooks/useCitas.ts - Versión actualizada
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

  // ✅ FUNCIÓN ACTUALIZADA: completarCita con nuevo sistema de redondeo y propina
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
          anticipoConfirmado: true,
          serviciosAdicionales: datosCompletos?.serviciosAdicionales || [],
          
          // ✅ NUEVOS CAMPOS DEL SISTEMA ACTUALIZADO
          descuentoAplicado: datosCompletos?.descuento || 0,
          subtotalOriginal: datosCompletos?.subtotalServicios || precioFinal,
          montoDescuento: datosCompletos?.montoDescuento || 0,
          subtotalConDescuento: datosCompletos?.subtotalConDescuento || precioFinal,
          montoRedondeo: datosCompletos?.montoRedondeo || 0,
          propina: datosCompletos?.propina || 0,
          
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

  return {
    citas,
    clientes,
    servicios,
    saveCita,
    completarCita,
    deleteCita,
    changeEstadoCita,
    updateAnticipo,
    openModal,
    closeModal,
    modalState,
  };
}