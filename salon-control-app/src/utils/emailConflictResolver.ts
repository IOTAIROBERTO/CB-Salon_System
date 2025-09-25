// src/utils/emailConflictResolver.ts

interface EmailConflict {
  id: string;
  type: 'duplicate_reminder' | 'cancelled_reminder' | 'timing_conflict';
  citaId: string;
  scheduledTime: Date;
  conflictReason: string;
  resolution?: 'skip' | 'reschedule' | 'send_anyway';
}

interface ConflictResolution {
  action: 'skip' | 'reschedule' | 'send_anyway';
  newTime?: Date;
  reason: string;
}

class EmailConflictResolver {
  private conflicts: EmailConflict[] = [];
  private resolutions: Map<string, ConflictResolution> = new Map();

  // Detectar conflictos antes de programar emails
  detectConflicts(
    citaId: string, 
    emailType: 'confirmacion' | 'recordatorio' | 'cambio',
    scheduledTime: Date,
    citaEstado: string
  ): EmailConflict[] {
    const conflicts: EmailConflict[] = [];
    const conflictId = `${citaId}_${emailType}_${scheduledTime.getTime()}`;

    // Conflicto 1: Cita cancelada pero email programado
    if (citaEstado === 'cancelada') {
      conflicts.push({
        id: conflictId + '_cancelled',
        type: 'cancelled_reminder',
        citaId,
        scheduledTime,
        conflictReason: 'La cita fue cancelada pero el email sigue programado'
      });
    }

    // Conflicto 2: Email duplicado (mismo tipo para la misma cita)
    const existingEmails = this.getScheduledEmails(citaId, emailType);
    if (existingEmails.length > 0) {
      conflicts.push({
        id: conflictId + '_duplicate',
        type: 'duplicate_reminder',
        citaId,
        scheduledTime,
        conflictReason: 'Ya existe un email programado del mismo tipo para esta cita'
      });
    }

    // Conflicto 3: Timing inadecuado (email programado para el pasado)
    if (scheduledTime < new Date()) {
      conflicts.push({
        id: conflictId + '_timing',
        type: 'timing_conflict',
        citaId,
        scheduledTime,
        conflictReason: 'El email está programado para una fecha/hora en el pasado'
      });
    }

    // Guardar conflictos detectados
    conflicts.forEach(conflict => {
      this.conflicts.push(conflict);
    });

    return conflicts;
  }

  // Resolver conflictos automáticamente
  resolveConflict(conflictId: string, resolution: ConflictResolution): boolean {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) return false;

    this.resolutions.set(conflictId, resolution);
    conflict.resolution = resolution.action;

    // Aplicar la resolución
    switch (resolution.action) {
      case 'skip':
        console.log(`Skipping email for conflict ${conflictId}: ${resolution.reason}`);
        break;
      
      case 'reschedule':
        if (resolution.newTime) {
          console.log(`Rescheduling email from ${conflict.scheduledTime} to ${resolution.newTime}`);
          conflict.scheduledTime = resolution.newTime;
        }
        break;
      
      case 'send_anyway':
        console.log(`Sending email anyway for conflict ${conflictId}: ${resolution.reason}`);
        break;
    }

    return true;
  }

  // Resolver conflictos automáticamente con reglas predefinidas
  autoResolveConflicts(): void {
    this.conflicts.forEach(conflict => {
      if (conflict.resolution) return; // Ya resuelto

      let resolution: ConflictResolution;

      switch (conflict.type) {
        case 'cancelled_reminder':
          resolution = {
            action: 'skip',
            reason: 'Cita cancelada - no enviar recordatorio'
          };
          break;

        case 'duplicate_reminder':
          resolution = {
            action: 'skip',
            reason: 'Email duplicado - evitar spam'
          };
          break;

        case 'timing_conflict':
          // Reprogramar para dentro de 5 minutos
          const newTime = new Date();
          newTime.setMinutes(newTime.getMinutes() + 5);
          resolution = {
            action: 'reschedule',
            newTime,
            reason: 'Reprogramado para evitar envío en el pasado'
          };
          break;

        default:
          resolution = {
            action: 'send_anyway',
            reason: 'Tipo de conflicto desconocido'
          };
      }

      this.resolveConflict(conflict.id, resolution);
    });
  }

  // Obtener emails programados para una cita específica
  private getScheduledEmails(citaId: string, emailType: string): any[] {
    // En una implementación real, esto consultaría una base de datos
    // Por ahora, simulamos verificando localStorage
    try {
      const scheduledEmails = JSON.parse(localStorage.getItem('scheduledEmails') || '[]');
      return scheduledEmails.filter((email: any) => 
        email.citaId === citaId && email.type === emailType
      );
    } catch (error) {
      return [];
    }
  }

  // Obtener todos los conflictos activos
  getActiveConflicts(): EmailConflict[] {
    return this.conflicts.filter(c => !c.resolution);
  }

  // Obtener conflictos resueltos
  getResolvedConflicts(): EmailConflict[] {
    return this.conflicts.filter(c => c.resolution);
  }

  // Limpiar conflictos antiguos
  cleanupOldConflicts(daysOld: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.conflicts = this.conflicts.filter(conflict => 
      conflict.scheduledTime > cutoffDate
    );

    // Limpiar resoluciones correspondientes
    this.conflicts.forEach(conflict => {
      if (!this.conflicts.find(c => c.id === conflict.id)) {
        this.resolutions.delete(conflict.id);
      }
    });
  }

  // Obtener estadísticas de conflictos
  getConflictStats(): {
    total: number;
    byType: Record<string, number>;
    resolved: number;
    pending: number;
  } {
    const stats = {
      total: this.conflicts.length,
      byType: {} as Record<string, number>,
      resolved: 0,
      pending: 0
    };

    this.conflicts.forEach(conflict => {
      // Contar por tipo
      stats.byType[conflict.type] = (stats.byType[conflict.type] || 0) + 1;
      
      // Contar resueltos vs pendientes
      if (conflict.resolution) {
        stats.resolved++;
      } else {
        stats.pending++;
      }
    });

    return stats;
  }

  // Validar si se puede enviar un email sin conflictos
  canSendEmail(
    citaId: string, 
    emailType: string, 
    scheduledTime: Date,
    citaEstado: string
  ): { canSend: boolean; reason?: string } {
    const conflicts = this.detectConflicts(citaId, emailType as any, scheduledTime, citaEstado);
    
    if (conflicts.length === 0) {
      return { canSend: true };
    }

    // Auto-resolver conflictos
    this.autoResolveConflicts();

    // Verificar si algún conflicto bloquea el envío
    const blockingConflicts = conflicts.filter(c => c.resolution === 'skip');
    
    if (blockingConflicts.length > 0) {
      return {
        canSend: false,
        reason: blockingConflicts[0].conflictReason
      };
    }

    return { canSend: true };
  }

  // Exportar configuración de resoluciones para backup
  exportResolutions(): string {
    const data = {
      conflicts: this.conflicts,
      resolutions: Array.from(this.resolutions.entries()),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  // Importar configuración de resoluciones desde backup
  importResolutions(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.conflicts = data.conflicts || [];
      this.resolutions = new Map(data.resolutions || []);
      return true;
    } catch (error) {
      console.error('Error importing email conflict resolutions:', error);
      return false;
    }
  }

  // Reset completo del resolver
  reset(): void {
    this.conflicts = [];
    this.resolutions.clear();
  }
}

// Crear instancia singleton
export const emailConflictResolver = new EmailConflictResolver();

// Funciones helper para uso común
export const validateEmailScheduling = (
  citaId: string,
  emailType: 'confirmacion' | 'recordatorio' | 'cambio',
  scheduledTime: Date,
  citaEstado: string
) => {
  return emailConflictResolver.canSendEmail(citaId, emailType, scheduledTime, citaEstado);
};

export const resolveEmailConflicts = () => {
  emailConflictResolver.autoResolveConflicts();
};

export const getEmailConflictStats = () => {
  return emailConflictResolver.getConflictStats();
};