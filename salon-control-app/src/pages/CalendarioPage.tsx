import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Scissors } from 'lucide-react';
import { fechaLocalISO } from '../utils/dateValidation';
import AgendaDia from '../components/citas/AgendaDia';
import { useOcupadoGoogle } from '../hooks/useAgenda';

export default function CalendarioPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'dia'>('month');
    const [dia, setDia] = useState(fechaLocalISO());
    const moverDia = (n: number) => { const d = new Date(`${dia}T12:00:00`); d.setDate(d.getDate() + n); setDia(fechaLocalISO(d)); };

    const citas = useLiveQuery(() => db.citas.toArray());
    const events = useLiveQuery(() => db.empleadoEvents.toArray());
    const empleados = useLiveQuery(() => db.empleados.toArray());
    const clientes = useLiveQuery(() => db.clientes.toArray());
    const ocupadoGoogle = useOcupadoGoogle();

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        const grid = [];
        // Lead-in days from prev month
        for (let i = 0; i < startDay; i++) {
            grid.push({ day: null, fullDate: null });
        }
        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            grid.push({ day: i, fullDate: dateStr });
        }
        return grid;
    }, [currentDate]);

    const getItemsForDate = (dateStr: string) => {
        if (!dateStr) return [];

        const dayCitas = citas?.filter(c => c.fecha === dateStr) || [];
        const dayEvents = events?.filter(e => {
            const start = e.fechaInicio;
            const end = e.fechaFin;
            return dateStr >= start && dateStr <= end;
        }) || [];
        // Lo ocupado en Google ese día, recortado al día (un bloqueo que acaba a las 00:00 ya no cuenta)
        const dayGoogle = ocupadoGoogle.flatMap(b => {
            const [dd, hd] = b.desde.split('T'), [dh, hh] = b.hasta.split('T');
            if (dateStr < dd || dateStr > dh || (dateStr === dh && hh === '00:00')) return [];
            return [{ ...b, de: dateStr === dd ? hd : '00:00', a: dateStr === dh ? hh : '24:00' }];
        });

        return [
            ...dayCitas.map(c => ({ type: 'cita', data: c })),
            ...dayEvents.map(e => ({ type: 'event', data: e })),
            ...dayGoogle.map(g => ({ type: 'google', data: g }))
        ];
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg text-white">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800">Calendario</h1>
                        <p className="text-xs text-gray-500">Citas y apoyo de auxiliares</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 rounded-md text-sm transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-purple-600 font-bold' : 'text-gray-500'}`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setViewMode('dia')}
                            className={`px-3 py-1 rounded-md text-sm transition-all ${viewMode === 'dia' ? 'bg-white shadow-sm text-purple-600 font-bold' : 'text-gray-500'}`}
                        >
                            Día
                        </button>
                    </div>

                    <div className="flex items-center gap-2 border-l pl-4">
                        <button onClick={() => viewMode === 'dia' ? moverDia(-1) : handlePrevMonth()} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Anterior"><ChevronLeft size={20} /></button>
                        <h2 className="text-lg font-bold text-gray-800 min-w-[150px] text-center">
                            {viewMode === 'dia'
                                ? new Date(`${dia}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
                                : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                        </h2>
                        <button onClick={() => viewMode === 'dia' ? moverDia(1) : handleNextMonth()} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Siguiente"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            {viewMode === 'dia' && <AgendaDia fecha={dia} />}

            {viewMode === 'month' && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 border-b">
                    {dayNames.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-[120px]">
                    {calendarGrid.map((item, idx) => {
                        const items = getItemsForDate(item.fullDate || '');
                        const isToday = item.fullDate === fechaLocalISO();

                        return (
                            <div
                                key={idx}
                                onClick={() => { if (item.fullDate) { setDia(item.fullDate); setViewMode('dia'); } }}
                                title={item.fullDate ? 'Ver la agenda del día' : undefined}
                                className={`border-r border-b p-2 transition-colors hover:bg-gray-50/50 relative ${item.fullDate ? 'cursor-pointer' : ''} ${!item.day ? 'bg-gray-50/30' : ''} ${isToday ? 'bg-purple-50/30' : ''}`}
                            >
                                {item.day && (
                                    <span className={`text-sm font-bold ${isToday ? 'bg-purple-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-400'}`}>
                                        {item.day}
                                    </span>
                                )}

                                <div className="mt-1 space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                                    {items.map((entry, i) => {
                                        if (entry.type === 'google') {
                                            const g = entry.data as any;
                                            const emp = empleados?.find(x => x.id === g.personaId);
                                            const horas = g.de === '00:00' && g.a === '24:00' ? 'todo el día' : `${g.de}–${g.a}`;
                                            return (
                                                <div key={i} className="text-[10px] p-1 rounded border truncate bg-white border-gray-300 text-gray-600" title="Ocupado en Google Calendar">
                                                    <span className="font-bold text-purple-700">G</span> {emp ? `${emp.nombre.split(' ')[0]}: ` : ''}Ocupado {horas}
                                                </div>
                                            );
                                        }
                                        if (entry.type === 'cita') {
                                            const c = entry.data as any;
                                            const cliente = clientes?.find(cl => cl.id === c.clienteId);
                                            return (
                                                <div key={i} className={`text-[10px] p-1 rounded border truncate flex items-center gap-1 ${c.estado === 'completada' ? 'bg-green-50 border-green-200 text-green-700' :
                                                    c.estado === 'confirmada' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                        'bg-purple-50 border-purple-200 text-purple-700'
                                                    }`}>
                                                    <Scissors size={8} /> {cliente?.nombre || 'S/C'}
                                                </div>
                                            );
                                        } else {
                                            const e = entry.data as any;
                                            const emp = empleados?.find(emp => emp.id === e.empleadoId);
                                            return (
                                                <div key={i} className={`text-[10px] p-1 rounded border truncate flex items-center gap-1 ${e.tipo === 'vacaciones' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                                    e.tipo === 'dia_inhabit' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                                                        'bg-yellow-50 border-yellow-200 text-yellow-700'
                                                    }`}>
                                                    <Users size={8} /> {emp?.nombre.split(' ')[0]}: {e.tipo.replace('_', ' ')}
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>}

            <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-purple-50 border border-purple-200"></div> Cita Pendiente
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200"></div> Cita Confirmada
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div> Cita Completada
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 border-l pl-4">
                    <div className="w-3 h-3 rounded bg-orange-50 border border-orange-100"></div> Apoyo / Día Inhábil
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-blue-50 border border-blue-100"></div> Vacaciones
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 border-l pl-4">
                    <div className="w-3 h-3 rounded bg-white border border-gray-300"></div> Ocupado en Google
                </div>
            </div>
        </div>
    );
}
