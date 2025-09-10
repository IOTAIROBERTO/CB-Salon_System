import { useEffect } from 'react';
import serviciosData from '../data/servicios_dataset.json';

export const useInitializeData = () => {
  useEffect(() => {
    if (!localStorage.getItem('servicios')) {
      localStorage.setItem('servicios', JSON.stringify(serviciosData));
    }
    if (!localStorage.getItem('clientes')) {
      localStorage.setItem('clientes', JSON.stringify([
        { id: 'c1', nombre: 'Ana López', "email": "ana@email.com", "telefono": "+5215512345678", cumple: '1990-06-15', comentarios: '', posibleBaja: false },
        { id: 'c2', nombre: 'María García', "email": "ana@email.com", "telefono": "+526621462145", cumple: '1985-11-23', comentarios: '', posibleBaja: false }
      ]));
    }
    if (!localStorage.getItem('ventas')) {
      localStorage.setItem('ventas', JSON.stringify([
        {
          id: 'v1',
          fecha: new Date().toISOString(),
          clienteId: 'c1',
          servicioId: 's1',
          precioCobrado: 450,
          anticipoPagado: 150,
          saldoPendiente: 300
        },
        {
          id: 'v2',
          fecha: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
          clienteId: 'c2',
          servicioId: 's4',
          precioCobrado: 500,
          anticipoPagado: 150,
          saldoPendiente: 350
        },
        {
          id: 'v3',
          fecha: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          clienteId: 'c1',
          servicioId: 's5',
          precioCobrado: 550,
          anticipoPagado: 150,
          saldoPendiente: 400
        }
      ]));
    }
  }, []);
};