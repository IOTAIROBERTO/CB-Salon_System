import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, EmpleadoEvent } from '../../db/db';
import { Calendar, Plus, Trash2, Tag, CalendarDays, Clock, Briefcase, HelpCircle } from 'lucide-react';
import { googleCalendarService } from '../../services/googleCalendar';
import { formatDate } from '../../utils/clientesUtils';

interface CalendarSectionProps {
    empleadoId: string;
    onClose: () => void;
}

export default function CalendarSection({ empleadoId, onClose }: CalendarSectionProps) {
    const events = useLiveQuery(() =>
        db.empleadoEvents.where('empleadoId').equals(empleadoId).toArray()
    );

    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Omit<EmpleadoEvent, 'id'>>({
        empleadoId: empleadoId,
        tipo: 'vacaciones',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        descripcion: ''
    });

    const syncEventToGoogle = async (eventId: string) => {
        try {
            if (!googleCalendarService.getSignInStatus()) return;
            const event = await db.empleadoEvents.get(eventId);
            if (!event) return;

            const emp = await db.empleados.get(event.empleadoId);
            if (!emp) return;

            const calendarId = emp.googleCalendarId || 'primary';
            const gEvent = googleCalendarService.empleadoEventToCalendarEvent(event, emp);

            if (event.googleEventId) {
                await googleCalendarService.updateEvent(event.googleEventId, gEvent, calendarId);
            } else {
                const gId = await googleCalendarService.createEvent(gEvent, calendarId);
                if (gId) {
                    await db.empleadoEvents.update(eventId, { googleEventId: gId });
                }
            }
        } catch (e) {
            console.error('Error syncing employee event:', e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = await db.empleadoEvents.add({ ...formData });
        if (id) await syncEventToGoogle(id as string);
        setIsAdding(false);
        setFormData({
            empleadoId: empleadoId,
            tipo: 'vacaciones',
            fechaInicio: new Date().toISOString().split('T')[0],
            fechaFin: new Date().toISOString().split('T')[0],
            descripcion: ''
        });
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Eliminar este evento del calendario?')) {
            const event = await db.empleadoEvents.get(id);
            if (event?.googleEventId && googleCalendarService.getSignInStatus()) {
                const emp = await db.empleados.get(event.empleadoId);
                const calendarId = emp?.googleCalendarId || 'primary';
                await googleCalendarService.deleteEvent(event.googleEventId, calendarId);
            }
            await db.empleadoEvents.delete(id);
        }
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg text-white">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Calendario de Trabajo</h4>
                        <p className="text-xs text-gray-500">Gestión de días libres, vacaciones y horarios</p>
                    </div>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors"
                    >
                        <Plus size={16} /> Añadir Evento
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white border-2 border-purple-200 p-4 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Evento</label>
                            <select
                                className="w-full p-2 border rounded-lg text-sm"
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                            >
                                <option value="vacaciones">Vacaciones</option>
                                <option value="dia_inhabit">Día Inhábil / Descanso</option>
                                <option value="horario_especial">Horario Especial / Evento</option>
                                <option value="apoyo">Día de Apoyo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Inicia</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border rounded-lg text-sm"
                                value={formData.fechaInicio}
                                onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Termina</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border rounded-lg text-sm"
                                value={formData.fechaFin}
                                onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción / Notas</label>
                            <input
                                type="text"
                                placeholder="Ejem: Vacaciones anuales, Curso de capacitación..."
                                className="w-full p-2 border rounded-lg text-sm"
                                value={formData.descripcion}
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                        >
                            Guardar Evento
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {events && events.length > 0 ? (
                    events.sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)).map(event => (
                        <div key={event.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-gray-50 group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${event.tipo === 'vacaciones' ? 'bg-blue-100 text-blue-600' :
                                    event.tipo === 'dia_inhabit' ? 'bg-orange-100 text-orange-600' :
                                        'bg-purple-100 text-purple-600'
                                    }`}>
                                    {event.tipo === 'vacaciones' ? <Briefcase size={16} /> :
                                        event.tipo === 'dia_inhabit' ? <Clock size={16} /> :
                                            event.tipo === 'apoyo' ? <HelpCircle size={16} /> :
                                                <Tag size={16} />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-800 capitalize">
                                        {event.tipo.replace('_', ' ')}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatDate(event.fechaInicio)} {event.fechaInicio !== event.fechaFin && ` al ${formatDate(event.fechaFin)}`}
                                    </div>
                                    {event.descripcion && (
                                        <div className="text-xs text-gray-400 italic mt-0.5">{event.descripcion}</div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(event.id! as any)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <Calendar size={40} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No hay eventos registrados</p>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t">
                <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
