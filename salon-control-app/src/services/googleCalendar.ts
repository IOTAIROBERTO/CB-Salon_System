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

class GoogleCalendarService {
  private gapi: any = null;
  private isSignedIn = false;
  private clientId = '';
  private apiKey = '';
  private discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  private scopes = 'https://www.googleapis.com/auth/calendar.events';

  constructor() {
    // Configuración temporal - puedes cambiar estas credenciales más tarde
    this.clientId = '';
    this.apiKey = '';
  }

  async initialize(): Promise<boolean> {
    try {
      if (!this.clientId || !this.apiKey) {
        console.log('Google Calendar credentials not configured - service disabled');
        return false;
      }

      // Cargar la API de Google
      await this.loadGoogleAPI();
      
      // Inicializar gapi
      await this.gapi.load('client:auth2', async () => {
        await this.gapi.client.init({
          apiKey: this.apiKey,
          clientId: this.clientId,
          discoveryDocs: [this.discoveryDoc],
          scope: this.scopes
        });

        // Verificar si ya está autenticado
        const authInstance = this.gapi.auth2.getAuthInstance();
        this.isSignedIn = authInstance.isSignedIn.get();
      });

      return true;
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
      if (!this.gapi) {
        throw new Error('Google API not loaded');
      }

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

  async createEvent(event: CalendarEvent): Promise<string | null> {
    try {
      if (!this.isSignedIn) {
        console.log('Not signed in to Google Calendar');
        return null;
      }

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return response.result.id || null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<boolean> {
    try {
      if (!this.isSignedIn) {
        console.log('Not signed in to Google Calendar');
        return false;
      }

      await this.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      if (!this.isSignedIn) {
        console.log('Not signed in to Google Calendar');
        return false;
      }

      await this.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  // Convertir cita a evento de Google Calendar
  citaToCalendarEvent(cita: any, cliente: any, servicio: any): CalendarEvent {
    const startDateTime = new Date(`${cita.fecha}T${cita.hora}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Asume 1 hora de duración

    return {
      summary: `${servicio.nombre} - ${cliente.nombre}`,
      description: `
Cliente: ${cliente.nombre}
Servicio: ${servicio.nombre}
Precio: $${servicio.precioSugerido}
Estado: ${cita.estado}
${cita.notas ? `Notas: ${cita.notas}` : ''}
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
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'email', minutes: 2 * 60 },  // 2 horas antes
          { method: 'popup', minutes: 30 }       // 30 minutos antes
        ]
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