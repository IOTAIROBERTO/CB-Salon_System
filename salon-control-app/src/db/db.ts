import Dexie, { Table } from 'dexie';
import { CampaignType } from '../types/email';

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
    proveedor?: string;
    categoria?: string;
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
        super('BeautySalonDB');

        // Define Schema
        this.version(1).stores({
            clientes: 'id, nombre, email, telefono',
            citas: 'id, clienteId, fecha, estado',
            ventas: 'id, fecha, clienteId',
            servicios: 'id, nombre, categoria',
            inventario: 'id, nombre, categoria, proveedor',

            gastos: '++id, fecha, categoria',
            documentos: '++id, titulo, tipo, fechaCreacion',
            configuracion: 'id', // Singleton

            campanas: 'id, tipo, estado, fechaCreacion',
            plantillas: 'id, tipo, nombre',
            automatizaciones: 'id, trigger, activa'
        });

        this.version(2).stores({
            clientes: 'id, nombre, email, telefono, activo, fechaRegistro'
        });

        // Version 3: Add employees and relationships
        this.version(3).stores({
            empleados: 'id, nombre, activo',
            citas: 'id, clienteId, fecha, estado, empleadoId',
            ventas: 'id, fecha, clienteId, empleadoId'
        });

        // Version 4: Add employee events and birthday field
        this.version(4).stores({
            empleadoEvents: '++id, empleadoId, tipo, fechaInicio, fechaFin'
        });

        // Version 5: Google Calendar integration fields
        this.version(5).stores({
            empleados: 'id, nombre, activo, googleCalendarId',
            citas: 'id, clienteId, fecha, estado, googleEventId'
        });

        // Version 6: Add googleEventId index to empleadoEvents
        this.version(6).stores({
            empleadoEvents: '++id, empleadoId, tipo, fechaInicio, googleEventId',
            citas: 'id, clienteId, fecha, estado, googleEventId',
            empleados: 'id, nombre, activo, googleCalendarId'
        });
    }
}

export const db = new SalonDatabase();
