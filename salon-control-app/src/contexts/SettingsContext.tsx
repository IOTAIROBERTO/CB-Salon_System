import React, { createContext, useContext } from 'react';
import { db, AppSettings } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface SettingsContextType {
    settings: AppSettings | null;
    updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // `?? null` distingue "todavía consultando" (undefined) de "no hay fila
    // guardada" (null). Sin eso, una instalación nueva nunca tiene la fila y
    // Configuración se quedaba para siempre en "Cargando configuración...".
    const dbSettings = useLiveQuery(() => db.configuracion.get('settings').then(s => s ?? null));

    // Default settings if not found in DB
    const defaultSettings: AppSettings = {
        id: 'settings',
        nombreSalon: 'Beauty Salon Total Control',
        direccion: '',
        telefono: '',
        email: '',
        tipoCambioUSD: 20.0
    };

    const currentSettings = dbSettings || defaultSettings;
    const cargando = dbSettings === undefined;

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        await db.configuracion.put({
            ...currentSettings,
            ...newSettings,
            id: 'settings'
        });
    };

    return (
        <SettingsContext.Provider value={{
            settings: currentSettings,
            updateSettings,
            loading: cargando
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
