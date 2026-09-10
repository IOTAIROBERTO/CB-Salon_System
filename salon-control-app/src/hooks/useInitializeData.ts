import { useEffect } from 'react';
import { db } from '../db/db';
import { migrateLocalStorageToDexie } from '../utils/migrateData';
import serviciosData from '../data/servicios_dataset.json';

/**
 * Rellena los campos que el sistema sí lee a partir de los nombres viejos
 * (`precio`) o del dataset original. No pisa valores ya presentes.
 */
export const repararServicio = (s: any, origen?: any) => ({
  ...s,
  precioSugerido: s.precioSugerido ?? s.precio ?? origen?.precioActualizado ?? 0,
  anticipoSugerido: s.anticipoSugerido ?? origen?.anticipo ?? 0,
  duracion: s.duracion ?? origen?.duracion ?? 60
});

export const useInitializeData = () => {
  useEffect(() => {
    const initDB = async () => {
      // 1. Run Migration if needed
      await migrateLocalStorageToDexie();

      // 2. Seed Initial Data (only if DB is empty after migration)

      // Services
      const servicesCount = await db.servicios.count();
      if (servicesCount === 0) {
        const serviciosMapped = serviciosData.map((s: any) => ({
          id: s.id,
          nombre: s.nombre,
          // El resto del sistema lee precioSugerido/anticipoSugerido; el JSON
          // los trae como precioActualizado/anticipo.
          precioSugerido: s.precioActualizado,
          anticipoSugerido: s.anticipo ?? 0,
          // Las dos listas viajan con el servicio para poder cambiar de una a
          // otra desde Configuración sin volver a importar.
          precio2026: s.precioActualizado,
          anticipo2026: s.anticipo ?? 0,
          precio2027: s.precio2027,
          anticipo2027: s.anticipo2027,
          categoria: s.categoria,
          duracion: s.duracion,
          descripcion: s.descripcion
        }));
        await db.servicios.bulkPut(serviciosMapped);
      } else {
        // Reparación: versiones anteriores sembraron el precio en `precio`, un
        // campo que nadie lee, dejando el catálogo en $0. Se rellena una sola
        // vez y sin tocar los servicios que ya tengan precio.
        const sinPrecio = await db.servicios
          .filter((s: any) => s.precioSugerido === undefined)
          .toArray();

        if (sinPrecio.length > 0) {
          const dataset: any[] = serviciosData;
          await db.servicios.bulkPut(
            sinPrecio.map((s: any) => repararServicio(s, dataset.find(d => d.id === s.id)))
          );
          console.log(`Catálogo reparado: ${sinPrecio.length} servicios sin precioSugerido`);
        }
      }

      // Clients (Seed demo data if absolutely empty)
      const clientsCount = await db.clientes.count();
      if (clientsCount === 0) {
        await db.clientes.bulkAdd([
          {
            id: 'c1',
            nombre: 'Ana López',
            email: "ana.lopez@email.com",
            telefono: "+52 55 1234 5678",
            cumple: '1990-06-15',
            comentarios: 'Prefiere cortes clásicos',
            posibleBaja: false,
            activo: true,
            fechaRegistro: new Date().toISOString()
          },
          {
            id: 'c2',
            nombre: 'María García',
            email: "maria.garcia@email.com",
            telefono: "+52 66 2146 2145",
            cumple: '1985-11-23',
            comentarios: 'Alérgica a ciertos tintes',
            posibleBaja: false,
            activo: true,
            fechaRegistro: new Date().toISOString()
          },
          {
            id: 'c3',
            nombre: 'Carmen Rodriguez',
            email: "carmen.r@email.com",
            telefono: "+52 55 9876 5432",
            cumple: '1992-03-08',
            comentarios: 'Cliente VIP, siempre puntual',
            posibleBaja: false,
            activo: true,
            fechaRegistro: new Date().toISOString()
          }
        ]);
      }

      // Inventory
      const inventoryCount = await db.inventario.count();
      if (inventoryCount === 0) {
        await db.inventario.bulkAdd([
          {
            id: 'p1',
            nombre: 'Shampoo Hidratante L\'Oreal',
            cantidad: 8,
            precio: 250.00,
            proveedor: 'Distribuidora Belleza',
            categoria: 'shampoo'
          },
          {
            id: 'p2',
            nombre: 'Tinte Rubio Cenizo',
            cantidad: 2,
            precio: 180.00,
            proveedor: 'Cosméticos Pro',
            categoria: 'tinte'
          }
        ]);
      }
    };

    initDB();
  }, []);
};
