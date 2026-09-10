import { useEffect } from 'react';
import { pedirAlmacenamientoPersistente, respaldoAutomatico } from '../services/backupService';

/**
 * Al abrir la app: pide almacenamiento persistente y escribe el respaldo del
 * día si hay carpeta configurada. Un salón que abre a diario genera una copia
 * diaria sin tocar nada.
 */
export const useAutoBackup = () => {
    useEffect(() => {
        const correr = async () => {
            await pedirAlmacenamientoPersistente();

            try {
                const nombre = await respaldoAutomatico();
                if (nombre) console.log(`Respaldo automático guardado: ${nombre}`);
            } catch (e) {
                // Un respaldo fallido nunca debe tumbar la app.
                console.error('No se pudo escribir el respaldo automático:', e);
            }
        };

        // Después del arranque, para no competir con la carga inicial.
        const t = setTimeout(correr, 3000);
        return () => clearTimeout(t);
    }, []);
};
