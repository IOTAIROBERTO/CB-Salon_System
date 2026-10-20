// services/googleCalendar.ts
// Google Calendar con Google Identity Services (GIS). La librería anterior
// (gapi.auth2) quedó dada de baja por Google y no funciona con clientes OAuth
// nuevos. Aquí gapi solo se usa como cliente REST; el permiso lo da GIS con un
// token de acceso de 1 hora que se guarda en este navegador.
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

/** Evento leído de Google para mostrarlo en el calendario del sistema */
export interface EventoGoogle {
  id: string;
  titulo: string;
  inicio: string; // ISO o YYYY-MM-DD si es de día completo
  fin: string;
  diaCompleto: boolean;
}

import { db } from '../db/db';
import { nombreUbicacion, ZONAS_INICIALES } from '../utils/zonas';

const ALCANCE = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const CLAVE_TOKEN = 'cbGoogleToken';

const cargarScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });

class GoogleCalendarService {
  private gapi: any = null;
  private tokenClient: any = null;
  private clientId = '';
  private token: { access_token: string; expira: number } | null = null;
  private cuenta = '';

  constructor() { }

  /** Carga las librerías con las credenciales de Configuración. No abre ventanas. */
  async initialize(): Promise<boolean> {
    try {
      const config = await db.configuracion.get('settings');
      const creds = config?.googleCredentials;

      if (!creds?.clientId || !creds?.apiKey) {
        console.log('Google Calendar credentials not configured');
        return false;
      }

      await Promise.all([
        cargarScript('https://apis.google.com/js/api.js'),
        cargarScript('https://accounts.google.com/gsi/client')
      ]);
      this.gapi = window.gapi;
      await new Promise<void>(resolve => this.gapi.load('client', () => resolve()));
      await this.gapi.client.init({ apiKey: creds.apiKey, discoveryDocs: [DISCOVERY] });

      if (!this.tokenClient || this.clientId !== creds.clientId) {
        this.clientId = creds.clientId;
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: creds.clientId,
          scope: ALCANCE,
          callback: () => { } // se reemplaza en cada pedido
        });
      }

      // Recuperar el token vigente de una visita anterior
      try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_TOKEN) || 'null');
        if (guardado?.access_token && guardado.expira > Date.now() + 60_000) {
          this.token = guardado;
          this.cuenta = guardado.cuenta || '';
          this.gapi.client.setToken({ access_token: guardado.access_token });
        }
      } catch {
        localStorage.removeItem(CLAVE_TOKEN);
      }
      return true;
    } catch (error) {
      console.error('Error initializing Google Calendar API:', error);
      return false;
    }
  }

  /** Abre la ventana de Google para dar permiso (debe llamarse desde un clic) */
  async signIn(): Promise<boolean> {
    try {
      if (!this.tokenClient && !(await this.initialize())) return false;
      const respuesta: any = await new Promise((resolve, reject) => {
        this.tokenClient.callback = (r: any) => (r.error ? reject(r) : resolve(r));
        this.tokenClient.error_callback = (e: any) => reject(e);
        this.tokenClient.requestAccessToken({ prompt: this.token ? '' : 'consent' });
      });
      this.token = {
        access_token: respuesta.access_token,
        expira: Date.now() + Number(respuesta.expires_in || 3600) * 1000
      };
      this.gapi.client.setToken({ access_token: this.token.access_token });
      // El calendario principal se llama como el correo de la cuenta
      try {
        const r = await this.gapi.client.calendar.events.list({ calendarId: 'primary', maxResults: 1 });
        this.cuenta = r.result.summary || '';
      } catch { /* sin nombre de cuenta no pasa nada */ }
      localStorage.setItem(CLAVE_TOKEN, JSON.stringify({ ...this.token, cuenta: this.cuenta }));
      return true;
    } catch (error) {
      console.error('Error signing in to Google:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.token && window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke(this.token.access_token, () => { });
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
    this.token = null;
    this.cuenta = '';
    this.gapi?.client?.setToken(null);
    localStorage.removeItem(CLAVE_TOKEN);
  }

  /** Conectado = hay un token sin vencer */
  getSignInStatus(): boolean {
    return !!this.token && this.token.expira > Date.now();
  }

  /** Correo de la cuenta conectada (si Google lo informó) */
  getCuenta(): string {
    return this.cuenta;
  }

  async createEvent(event: CalendarEvent, calendarId: string = 'primary'): Promise<string | null> {
    try {
      if (!this.getSignInStatus()) return null;

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event
      });

      return response.result.id || null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent, calendarId: string = 'primary'): Promise<boolean> {
    try {
      if (!this.getSignInStatus()) return false;

      await this.gapi.client.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: event
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    try {
      if (!this.getSignInStatus()) return false;

      await this.gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
      });

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  /** Eventos del calendario entre dos fechas (YYYY-MM-DD, fin exclusivo) */
  async listEvents(desde: string, hasta: string, calendarId: string = 'primary'): Promise<EventoGoogle[]> {
    if (!this.getSignInStatus()) return [];
    const eventos: EventoGoogle[] = [];
    let pageToken: string | undefined;
    do {
      const r = await this.gapi.client.calendar.events.list({
        calendarId,
        timeMin: new Date(`${desde}T00:00:00`).toISOString(),
        timeMax: new Date(`${hasta}T00:00:00`).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
        pageToken
      });
      for (const e of r.result.items || []) {
        if (e.status === 'cancelled') continue;
        eventos.push({
          id: e.id,
          titulo: e.summary || '(Sin título)',
          inicio: e.start?.dateTime || e.start?.date,
          fin: e.end?.dateTime || e.end?.date,
          diaCompleto: !e.start?.dateTime
        });
      }
      pageToken = r.result.nextPageToken;
    } while (pageToken);
    return eventos;
  }

  citaToCalendarEvent(cita: any, cliente: any, servicio: any): CalendarEvent {
    const startDateTime = new Date(`${cita.fecha}T${cita.hora}`);
    const endDateTime = new Date(startDateTime.getTime() + (servicio.duracion || 60) * 60 * 1000);

    return {
      summary: `${servicio.nombre} - ${cliente.nombre}`,
      description: `
Cliente: ${cliente.nombre}
Tel: ${cliente.telefono}
Servicio: ${servicio.nombre}
Precio: $${cita.precioFinal || servicio.precioSugerido}
Estado: ${cita.estado}
${cita.ubicacion && cita.ubicacion !== 'salon' ? `Lugar: ${nombreUbicacion(cita.ubicacion, ZONAS_INICIALES)}` : ''}
${cita.descripcionTrabajo ? `Trabajo: ${cita.descripcionTrabajo}` : ''}
${cita.notas ? `Notas: ${cita.notas}` : ''}
Enviado desde CB Control
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 120 }
        ]
      }
    };
  }

  empleadoEventToCalendarEvent(event: any, empleado: any): CalendarEvent {
    // Treat as all-day event or use T00:00:00Z
    return {
      summary: `${event.tipo.toUpperCase()}: ${empleado.nombre}`,
      description: `
Tipo: ${event.tipo}
Empleado: ${empleado.nombre}
${event.descripcion ? `Notas: ${event.descripcion}` : ''}
Enviado desde CB Control
      `.trim(),
      start: {
        dateTime: new Date(event.fechaInicio + 'T00:00:00').toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(event.fechaFin + 'T23:59:59').toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }
}

// Crear instancia singleton
export const googleCalendarService = new GoogleCalendarService();

// Declarar tipos para window
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
