import { useEffect } from 'react';
import serviciosData from '../data/servicios_dataset.json';

export const useInitializeData = () => {
  useEffect(() => {
    // Inicializar servicios si no existen
    if (!localStorage.getItem('servicios')) {
      localStorage.setItem('servicios', JSON.stringify(serviciosData));
    }

    // Inicializar clientes si no existen
    if (!localStorage.getItem('clientes')) {
      localStorage.setItem('clientes', JSON.stringify([
        { 
          id: 'c1', 
          nombre: 'Ana López', 
          email: "ana.lopez@email.com", 
          telefono: "+52 55 1234 5678", 
          cumple: '1990-06-15', 
          comentarios: 'Prefiere cortes clásicos', 
          posibleBaja: false 
        },
        { 
          id: 'c2', 
          nombre: 'María García', 
          email: "maria.garcia@email.com", 
          telefono: "+52 66 2146 2145", 
          cumple: '1985-11-23', 
          comentarios: 'Alérgica a ciertos tintes', 
          posibleBaja: false 
        },
        { 
          id: 'c3', 
          nombre: 'Carmen Rodriguez', 
          email: "carmen.r@email.com", 
          telefono: "+52 55 9876 5432", 
          cumple: '1992-03-08', 
          comentarios: 'Cliente VIP, siempre puntual', 
          posibleBaja: false 
        }
      ]));
    }

    // Inicializar ventas si no existen
    if (!localStorage.getItem('ventas')) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      localStorage.setItem('ventas', JSON.stringify([
        {
          id: 'v1',
          fecha: today.toISOString(),
          clienteId: 'c1',
          servicioId: 's1',
          precioCobrado: 450,
          anticipoPagado: 150,
          saldoPendiente: 300,
          metodoPago: 'efectivo'
        },
        {
          id: 'v2',
          fecha: yesterday.toISOString(),
          clienteId: 'c2',
          servicioId: 's4',
          precioCobrado: 500,
          anticipoPagado: 150,
          saldoPendiente: 350,
          metodoPago: 'tarjeta'
        },
        {
          id: 'v3',
          fecha: lastWeek.toISOString(),
          clienteId: 'c1',
          servicioId: 's5',
          precioCobrado: 550,
          anticipoPagado: 150,
          saldoPendiente: 400,
          metodoPago: 'transferencia'
        },
        {
          id: 'v4',
          fecha: lastMonth.toISOString(),
          clienteId: 'c3',
          servicioId: 's3',
          precioCobrado: 600,
          anticipoPagado: 150,
          saldoPendiente: 450,
          metodoPago: 'efectivo'
        }
      ]));
    }

    // Inicializar citas si no existen
    if (!localStorage.getItem('citas')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      localStorage.setItem('citas', JSON.stringify([
        {
          id: 'cita1',
          clienteId: 'c1',
          servicioId: 's1',
          fecha: tomorrow.toISOString().split('T')[0],
          hora: '10:00',
          estado: 'confirmada',
          notas: 'Primera cita del día'
        },
        {
          id: 'cita2',
          clienteId: 'c2',
          servicioId: 's4',
          fecha: tomorrow.toISOString().split('T')[0],
          hora: '14:30',
          estado: 'pendiente',
          notas: 'Tratamiento de hidratación'
        },
        {
          id: 'cita3',
          clienteId: 'c3',
          servicioId: 's5',
          fecha: nextWeek.toISOString().split('T')[0],
          hora: '11:00',
          estado: 'confirmada',
          notas: 'Cliente regular'
        }
      ]));
    }

    // Inicializar inventario si no existe
    if (!localStorage.getItem('inventario')) {
      localStorage.setItem('inventario', JSON.stringify([
        {
          id: 'p1',
          nombre: 'Shampoo Hidratante L\'Oreal',
          cantidad: 8,
          cantidadMinima: 3,
          precio: 250.00,
          proveedor: 'Distribuidora Belleza',
          categoria: 'shampoo',
          fechaVencimiento: '2025-12-31'
        },
        {
          id: 'p2',
          nombre: 'Tinte Rubio Cenizo',
          cantidad: 2,
          cantidadMinima: 5,
          precio: 180.00,
          proveedor: 'Cosméticos Pro',
          categoria: 'tinte',
          fechaVencimiento: '2025-08-15'
        },
        {
          id: 'p3',
          nombre: 'Mascarilla Reparadora',
          cantidad: 1,
          cantidadMinima: 3,
          precio: 320.00,
          proveedor: 'Beauty Supply',
          categoria: 'tratamiento',
          fechaVencimiento: '2025-10-20'
        },
        {
          id: 'p4',
          nombre: 'Tijeras Profesionales',
          cantidad: 5,
          cantidadMinima: 2,
          precio: 450.00,
          proveedor: 'Herramientas Pro',
          categoria: 'herramientas'
        }
      ]));
    }
  }, []);
};