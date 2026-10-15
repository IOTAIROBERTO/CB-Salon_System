import Dexie, { Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

// URL pública de la base (dexie-cloud.json). La clave secreta vive en dexie-cloud.key, fuera de git.
export const DEXIE_CLOUD_URL = 'https://zt3tyd7cy.dexie.cloud';
import { CampaignType } from '../types/email';
import type { Canje } from '../utils/lealtad';

// Interfaces for new tables
export interface Expense {
    id?: string;
    concepto: string; // "Renta", "Luz", etc.
    monto: number;
    fecha: string;
    categoria: 'fijo' | 'variable';
    pagado: boolean;
    notas?: string;
}

export interface Empleado {
    id: string;
    nombre: string;
    especialidad?: string;
    telefono?: string;
    email?: string;
    porcentajeComision: number; // 0-100
    activo: boolean;
    fechaContratacion: string;
    cumple?: string; // YYYY-MM-DD
    googleCalendarId?: string; // Specific calendar ID for this employee
}

export interface EmpleadoEvent {
    id?: string;
    empleadoId: string;
    tipo: 'vacaciones' | 'dia_inhabit' | 'horario_especial' | 'apoyo';
    fechaInicio: string;
    fechaFin: string;
    descripcion?: string;
    googleEventId?: string;
}

export interface SalonDocument {
    id?: string;
    titulo: string;
    tipo: 'contrato' | 'imagen' | 'otro';
    fechaCreacion: string;
    contenido?: Blob; // For file storage
    texto?: string;   // For text notes
}

export interface AppSettings {
    id?: string; // singleton 'settings'
    nombreSalon: string;
    direccion: string;
    telefono: string;
    email: string;
    tipoCambioUSD: number; // For Currency Feature
    emailConfig?: {
        serviceId: string;
        templateId: string;
        publicKey: string;
    };
    googleCredentials?: {
        clientId: string;
        apiKey: string;
    };
    // Respaldo automático: carpeta elegida por el usuario (el handle se guarda
    // tal cual, IndexedDB lo clona) y fecha ISO del último respaldo escrito.
    respaldoCarpeta?: FileSystemDirectoryHandle;
    respaldoUltimo?: string;
    // Qué lista de precios está activa: la de 2026 o la de enero de 2027.
    listaPrecios?: '2026' | '2027';
}

export interface Cliente {
    id: string;
    nombre: string;
    email?: string;
    telefono: string;
    cumple?: string; // YYYY-MM-DD
    comentarios?: string;
    posibleBaja?: boolean;
    activo?: boolean;
    fechaRegistro?: string;
    // Círculo CB (programa de lealtad)
    referidaPor?: string; // id de la clienta que la recomendó
    canjes?: Canje[];
}

export interface Cita {
    id: string;
    clienteId: string;
    servicioId: string;
    fecha: string;
    hora: string;
    estado: 'confirmada' | 'pendiente' | 'iniciada' | 'cancelada' | 'completada';
    notas?: string;
    montoAnticipo?: number;
    anticipoConfirmado?: boolean;
    precioFinal?: number;
    metodoPago?: string;
    serviciosAdicionales?: Array<{
        servicioId: string;
        nombre: string;
        precio: number;
    }>;
    empleadoIds?: string[];
    descuentoAplicado?: number;
    subtotalOriginal?: number;
    montoDescuento?: number;
    subtotalConDescuento?: number;
    montoRedondeo?: number;
    propina?: number;
    saldoPendiente?: number;
    fechaCompletada?: string;
    googleEventId?: string;
}

export interface Venta {
    id: string;
    fecha: string;
    clienteId: string;
    servicioId?: string;
    productos?: { productoId: string; cantidad: number; precio: number }[];
    total: number;
    // Legacy fields support
    precioCobrado?: number;
    anticipoPagado?: number;
    saldoPendiente?: number;
    metodoPago: string;
    empleadoId?: string; // Employee who made the sale/service
}

export interface Servicio {
    id: string;
    nombre: string;
    precioSugerido: number;
    anticipoSugerido: number;
    duracion: number;
    descripcion?: string;
    comision?: number;
    categoria?: string;
    // Precios de las dos listas, para cambiar de una a otra sin reimportar.
    precio2026?: number;
    anticipo2026?: number;
    precio2027?: number;
    anticipo2027?: number;
}

export interface Producto {
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    costo?: number; // Costo al salón (para el margen de venta)
    proveedor?: string;
    categoria?: string;
    stockMinimo?: number;
    fechaUltimaCompra?: string;
}

// Marketing Interfaces
export interface EmailCampaign {
    id: string;
    nombre: string;
    tipo: CampaignType;
    estado: 'borrador' | 'programada' | 'enviada' | 'cancelada' | 'enviando';
    plantillaId: string;
    asunto: string;
    contenido: string;
    fechaCreacion: string;
    fechaEnvio?: string;
    destinatarios: any[];
    configuracion: any;
    estadisticas: any;
}

export interface EmailTemplate {
    id: string;
    nombre: string;
    tipo: CampaignType;
    asunto: string;
    contenidoHtml: string;
    contenidoTexto: string;
    variables: string[];
    fechaCreacion: string;
    activa: boolean;
    esPersonalizable: boolean;
}

export interface AutomationRule {
    id: string;
    nombre: string;
    activa: boolean;
    trigger: string;
    plantillaId: string;
    condiciones: any;
    filtroClientes: string;
}

export class SalonDatabase extends Dexie {
    clientes!: Table<Cliente>;
    citas!: Table<Cita>;
    ventas!: Table<Venta>;
    servicios!: Table<Servicio>;
    inventario!: Table<Producto>;

    // New Tables
    documentos!: Table<SalonDocument>;
    configuracion!: Table<AppSettings>;
    empleados!: Table<Empleado>;

    // Marketing Tables
    campanas!: Table<EmailCampaign>;
    plantillas!: Table<EmailTemplate>;
    automatizaciones!: Table<AutomationRule>;
    gastos!: Table<Expense>;
    empleadoEvents!: Table<EmpleadoEvent>;

    constructor() {
        // Base nueva sincronizada con Dexie Cloud. La base local anterior
        // ('BeautySalonDB') se conserva intacta y se copia una vez a la nube
        // (ver utils/migrarANube.ts).
        super('BeautySalonCloud', { addons: [dexieCloud] });

        // Dexie Cloud no admite claves autoincrementales (++id) en tablas
        // sincronizadas: '@id' genera ids de texto únicos.
        this.version(1).stores({
            clientes: 'id, nombre, email, telefono, activo, fechaRegistro',
            citas: 'id, clienteId, fecha, estado, empleadoId, googleEventId',
            ventas: 'id, fecha, clienteId, empleadoId',
            servicios: 'id, nombre, categoria',
            inventario: 'id, nombre, categoria, proveedor',
            gastos: '@id, fecha, categoria',
            documentos: '++id, titulo, tipo, fechaCreacion',
            configuracion: 'id', // Singleton
            empleados: 'id, nombre, activo, googleCalendarId',
            campanas: 'id, tipo, estado, fechaCreacion',
            plantillas: 'id, tipo, nombre',
            automatizaciones: 'id, trigger, activa',
            empleadoEvents: '@id, empleadoId, tipo, fechaInicio, googleEventId'
        });

        this.cloud.configure({
            databaseUrl: DEXIE_CLOUD_URL,
            requireAuth: true, // Pide iniciar sesión por email antes de abrir la base
            // Documentos guarda archivos (Blob); se quedan solo en este dispositivo
            unsyncedTables: ['documentos']
        });
    }
}

export const db = new SalonDatabase();
