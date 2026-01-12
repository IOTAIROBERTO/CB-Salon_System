import { db } from '../db/db';

export const migrateLocalStorageToDexie = async () => {
    try {
        // Check if migration is already done
        const migrationDone = localStorage.getItem('dexie_migration_done');
        if (migrationDone) return;

        console.log('Starting migration from localStorage to Dexie...');

        // 1. Clients
        const clientesRaw = localStorage.getItem('clientes');
        if (clientesRaw) {
            try {
                const clientes = JSON.parse(clientesRaw);
                const normalized = clientes.map((c: any) => ({
                    ...c,
                    activo: c.activo !== undefined ? !!c.activo : (c.posibleBaja !== undefined ? !c.posibleBaja : true),
                    fechaRegistro: c.fechaRegistro || new Date().toISOString()
                }));
                await db.clientes.bulkPut(normalized);
                console.log(`Migrated ${normalized.length} clients`);
            } catch (e) {
                console.error('Error parsing clients during migration', e);
            }
        }

        // 2. Services
        const serviciosRaw = localStorage.getItem('servicios');
        if (serviciosRaw) {
            const servicios = JSON.parse(serviciosRaw);
            await db.servicios.bulkPut(servicios);
        }

        // 3. Inventory
        const inventarioRaw = localStorage.getItem('inventario');
        if (inventarioRaw) {
            const inventario = JSON.parse(inventarioRaw);
            await db.inventario.bulkPut(inventario);
        }

        // 4. Appointments
        const citasRaw = localStorage.getItem('citas');
        if (citasRaw) {
            try {
                const citas = JSON.parse(citasRaw);
                // Ensure all appointments have necessary fields for real-time Dexie logic
                const normalized = citas.map((c: any) => ({
                    ...c,
                    estado: c.estado || 'pendiente',
                    precioFinal: c.precioFinal || 0,
                    montoAnticipo: c.montoAnticipo || 0
                }));
                await db.citas.bulkPut(normalized);
                console.log(`Migrated ${normalized.length} appointments`);
            } catch (e) {
                console.error('Error parsing appointments during migration', e);
            }
        }

        // 5. Sales
        const ventasRaw = localStorage.getItem('ventas');
        if (ventasRaw) {
            const ventas = JSON.parse(ventasRaw);
            // Map legacy fields if needed, or just store as is since we updated interface
            const ventasNormalized = ventas.map((v: any) => ({
                ...v,
                total: v.precioCobrado || v.total || 0 // Ensure total exists
            }));
            await db.ventas.bulkPut(ventasNormalized);
        }

        // 6. Marketing (Campaigns)
        const campaignsRaw = localStorage.getItem('emailCampaigns');
        if (campaignsRaw) {
            const campaigns = JSON.parse(campaignsRaw);
            await db.campanas.bulkPut(campaigns);
        }

        // 7. Marketing (Templates)
        const templatesRaw = localStorage.getItem('emailTemplates');
        if (templatesRaw) {
            const templates = JSON.parse(templatesRaw);
            await db.plantillas.bulkPut(templates);
        }

        // 8. Marketing (Automations)
        const automationsRaw = localStorage.getItem('emailAutomations');
        if (automationsRaw) {
            const automations = JSON.parse(automationsRaw);
            await db.automatizaciones.bulkPut(automations);
        }

        // 9. Settings / Salon Info
        const salonInfoRaw = localStorage.getItem('salonInfo');
        const emailJSConfigRaw = localStorage.getItem('emailJSConfig');
        const emailProviderConfigRaw = localStorage.getItem('emailProviderConfig');
        const appSettingsRaw = localStorage.getItem('appSettings');

        if (salonInfoRaw || emailJSConfigRaw || emailProviderConfigRaw || appSettingsRaw) {
            const salonInfo = salonInfoRaw ? JSON.parse(salonInfoRaw) : {};
            const emailConfig = emailJSConfigRaw
                ? JSON.parse(emailJSConfigRaw)
                : (emailProviderConfigRaw ? JSON.parse(emailProviderConfigRaw) : {});
            const appSettings = appSettingsRaw ? JSON.parse(appSettingsRaw) : {};

            await db.configuracion.put({
                id: 'settings',
                nombreSalon: salonInfo.nombre || appSettings.nombreSalon || 'Beauty Salon Total Control',
                direccion: salonInfo.direccion || appSettings.direccion || '',
                telefono: salonInfo.telefono || appSettings.telefono || '',
                email: salonInfo.email || appSettings.email || '',
                tipoCambioUSD: appSettings.tipoCambioUSD || 20.0,
                emailConfig: Object.keys(emailConfig).length > 0 ? emailConfig : appSettings.emailConfig
            });
        }

        // Mark migration as done
        localStorage.setItem('dexie_migration_done', 'true');
        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Error migrating data to Dexie:', error);
    }
};
