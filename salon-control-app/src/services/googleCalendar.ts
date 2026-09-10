// services/googleCalendar.ts
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

import { db } from '../db/db';

class GoogleCalendarService {
  private gapi: any = null;
  private isSignedIn = false;
  private discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  private scopes = 'https://www.googleapis.com/auth/calendar.events';

  constructor() { }

  async initialize(): Promise<boolean> {
    try {
      const config = await db.configuracion.get('settings');
      const creds = config?.googleCredentials;

      if (!creds?.clientId || !creds?.apiKey) {
        console.log('Google Calendar credentials not configured');
        return false;
      }

      await this.loadGoogleAPI();

      return new Promise((resolve) => {
        this.gapi.load('client:auth2', async () => {
          try {
            await this.gapi.client.init({
              apiKey: creds.apiKey,
              clientId: creds.clientId,
              discoveryDocs: [this.discoveryDoc],
              scope: this.scopes
            });

            const authInstance = this.gapi.auth2.getAuthInstance();
            this.isSignedIn = authInstance.isSignedIn.get();

            authInstance.isSignedIn.listen((status: boolean) => {
              this.isSignedIn = status;
            });

            resolve(true);
          } catch (e) {
            console.error('Error init gapi client', e);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Error initializing Google Calendar API:', error);
      return false;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        this.gapi = window.gapi;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.gapi = window.gapi;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.gapi) await this.initialize();
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      this.isSignedIn = authInstance.isSignedIn.get();
      return this.isSignedIn;
    } catch (error) {
      console.error('Error signing in to Google:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.gapi) {
        const authInstance = this.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
        this.isSignedIn = false;
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  getSignInStatus(): boolean {
    return this.isSignedIn;
  }

  async createEvent(event: CalendarEvent, calendarId: string = 'primary'): Promise<string | null> {
    try {
      if (!this.isSignedIn) return null;

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
      if (!this.isSignedIn) return false;

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
      if (!this.isSignedIn) return false;

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
${cita.notas ? `Notas: ${cita.notas}` : ''}
Sent from Salon Control App
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
Sent from Salon Control App
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
  }
}