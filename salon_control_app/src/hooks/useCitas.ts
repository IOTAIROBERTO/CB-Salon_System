// src/hooks/useCitas.ts - SIMPLIFICADO para debugging
import { useState, useEffect } from "react";
import { Cita, Cliente, Servicio } from "../types/citas";
import { emailService } from "../services/emailService";

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

  // Función simplificada para enviar email automático
  const sendAutomaticEmail = async (
    cita: Cita, 
    cliente: Cliente, 
    servicio: Servicio, 
    type: 'confirmacion' | 'recordatorio' | 'cambio'
  ) => {
    console.log('🔄 Intentando enviar email automático:', { type, cliente: cliente.nombre, email: cliente.email });

    // Verificar configuración de automatización
    const automationSettings = JSON.parse(
      localStorage.getItem('emailAutomationSettings') || 
      '{"confirmacionAutomatica": true, "notificacionCambios": true}'
    );

    console.log('⚙️ Configuración de automatización:', automationSettings);

    // Solo enviar si la automatización está habilitada para este tipo
    if (type === 'confirmacion' && !automationSettings.confirmacionAutomatica) {
      console.log('❌ Confirmación automática deshabilitada');
      return;
    }
    if (type === 'cambio' && !automationSettings.notificacionCambios) {
      console.log('❌ Notificaciones de cambio deshabilitadas');
      return;
    }

    // Verificar que el cliente tenga email
    if (!cliente.email || cliente.email.trim() === '') {
      console.log(`❌ Cliente ${cliente.nombre} no tiene email registrado`);
      return;
    }

    // Verificar configuración de email
    const emailStatus = emailService.getConfigurationStatus();
    console.log('📧 Estado de configuración de email:', emailStatus);

    if (!emailStatus.isConfigured) {
      console.log('❌ Email no está configurado');
      return;
    }

    try {
      console.log('📤 Enviando email...', {
        to: cliente.email,
        clienteName: cliente.nombre,
        servicioNombre: servicio.nombre,
        fecha: cita.fecha,
        hora: cita.hora,
        type: type
      });

      const success = await emailService.sendReminder({
        to: cliente.email,
        clienteName: cliente.nombre,
        servicioNombre: servicio.nombre,
        fecha: cita.fecha,
        hora: cita.hora,
        type: type,
        notas: cita.notas
      });

      if (success) {
        console.log(`✅ Email de ${type} enviado exitosamente a ${cliente.email}`);
      } else {
        console.log(`❌ Error al enviar email de ${type} a ${cliente.email}`);
      }
    } catch (error) {
      console.error(`💥 Error enviando email de ${type}:`, error);
    }
  };

  // --- CRUD ---
  const saveCita = async (formData: any) => {
    console.log('💾 Guardando cita:', formData);

    const cliente = clientes.find(c => c.id === formData.clienteId);
    const servicio = servicios.find(s => s.id === formData.servicioId);

    console.log('👤 Cliente encontrado:', cliente);
    console.log('✂️ Servicio encontrado:', servicio);

    if (formData.id) {
      // Modo edición: actualizar cita existente
      const citaOriginal = citas.find(c => c.id === formData.id);
      const updatedCitas = citas.map((c) =>
        c.id === formData.id ? { ...c, ...formData } : c
      );
      setCitas(updatedCitas);
      localStorage.setItem("citas", JSON.stringify(updatedCitas));

      console.log('📝 Cita actualizada');

      // Enviar notificación de cambio si hay diferencias significativas
      if (citaOriginal && cliente && servicio) {
        const cambiosImportantes = 
          citaOriginal.fecha !== formData.fecha || 
          citaOriginal.hora !== formData.hora ||
          citaOriginal.servicioId !== formData.servicioId;

        console.log('🔄 Cambios importantes detectados:', cambiosImportantes);

        if (cambiosImportantes) {
          await sendAutomaticEmail({ ...citaOriginal, ...formData }, cliente, servicio, 'cambio');
        }
      }
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

      console.log('🆕 Nueva cita creada:', newCita);

      // Enviar confirmación automática
      if (cliente && servicio) {
        console.log('📧 Intentando enviar confirmación automática...');
        await sendAutomaticEmail(newCita, cliente, servicio, 'confirmacion');
      } else {
        console.log('❌ No se puede enviar confirmación: cliente o servicio no encontrado');
      }
    }
  };

  const deleteCita = (id: string) => {
    const updatedCitas = citas.filter((c) => c.id !== id);
    setCitas(updatedCitas);
    localStorage.setItem("citas", JSON.stringify(updatedCitas));
  };

  const changeEstadoCita = async (id: string, newEstado: Cita["estado"]) => {
    const cita = citas.find(c => c.id === id);
    const cliente = clientes.find(c => c.id === cita?.clienteId);
    const servicio = servicios.find(s => s.id === cita?.servicioId);

    const updatedCitas = citas.map((c) =>
      c.id === id ? { ...c, estado: newEstado } : c
    );
    setCitas(updatedCitas);
    localStorage.setItem("citas", JSON.stringify(updatedCitas));

    console.log(`🔄 Estado de cita cambiado a: ${newEstado}`);

    // Enviar notificación de cambio de estado si es relevante
    if (cita && cliente && servicio && newEstado === 'cancelada') {
      console.log('📧 Enviando notificación de cancelación...');
      await sendAutomaticEmail({ ...cita, estado: newEstado }, cliente, servicio, 'cambio');
    }
  };

  const updateAnticipo = (id: string, anticipoConfirmado: boolean, monto?: number) => {
    const updatedCitas = citas.map((c) =>
      c.id === id ? { ...c, anticipoConfirmado, montoAnticipo: monto || 0 } : c
    );
    setCitas(updatedCitas);
    localStorage.setItem("citas", JSON.stringify(updatedCitas));
  };

  const completarCita = (citaId: string, precioFinal: number, metodoPago: string, notas: string, datosCompletos?: any) => {
    const updatedCitas = citas.map((c) => {
      if (c.id === citaId) {
        return {
          ...c,
          servicioId: datosCompletos?.servicioSeleccionado || c.servicioId,
          estado: "completada" as const,
          precioFinal,
          metodoPago,
          notas: notas || c.notas,
          montoAnticipo: datosCompletos?.anticipoRecibido || c.montoAnticipo,
          anticipoConfirmado: true,
          serviciosAdicionales: datosCompletos?.serviciosAdicionales || [],
          descuentoAplicado: datosCompletos?.descuento || 0,
          subtotalOriginal: datosCompletos?.subtotalServicios || precioFinal,
          montoDescuento: datosCompletos?.montoDescuento || 0,
          subtotalConDescuento: datosCompletos?.subtotalConDescuento || precioFinal,
          montoRedondeo: datosCompletos?.montoRedondeo || 0,
          propina: datosCompletos?.propina || 0,
          saldoPendiente: 0,
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