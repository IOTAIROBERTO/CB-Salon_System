import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Empleado } from '../db/db';
import { Users, UserPlus, DollarSign, Trash2, Edit2, Search, X } from 'lucide-react';
import { calculateCommission, formatCurrency } from '../utils/financialUtils';

export default function EmpleadosPage() {
    const empleados = useLiveQuery(() => db.empleados.toArray());
    const citas = useLiveQuery(() => db.citas.toArray());
    const ventas = useLiveQuery(() => db.ventas.toArray());
    const servicios = useLiveQuery(() => db.servicios.toArray());

    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });

    const [formData, setFormData] = useState<Omit<Empleado, 'id'>>({
        nombre: '',
        especialidad: '',
        telefono: '',
        email: '',
        porcentajeComision: 30,
        activo: true,
        fechaContratacion: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = selectedEmpleadoId || `emp_${Date.now()}`;
        await db.empleados.put({ ...formData, id });
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            especialidad: '',
            telefono: '',
            email: '',
            porcentajeComision: 30,
            activo: true,
            fechaContratacion: new Date().toISOString().split('T')[0]
        });
        setSelectedEmpleadoId(null);
    };

    const handleEdit = (emp: Empleado) => {
        const { id, ...data } = emp;
        setFormData(data);
        setSelectedEmpleadoId(id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar empleado? Los datos de sus trabajos se mantendrán pero no se podrán asignar nuevos.')) {
            await db.empleados.update(id, { activo: false });
        }
    };

    const calculateStats = (empId: string) => {
        const periodStart = new Date(dateRange.inicio);
        const periodEnd = new Date(dateRange.fin);
        periodEnd.setHours(23, 59, 59);

        const filterDate = (dateStr: string) => {
            const d = new Date(dateStr);
            return d >= periodStart && d <= periodEnd;
        };

        const emp = empleados?.find(e => e.id === empId);
        if (!emp) return { jobs: 0, sales: 0, total: 0, comision: 0 };

        // 1. Citas (Servicios) - Support for multiple employees and service overrides
        const empJobs = citas?.filter(c =>
            c.estado === 'completada' &&
            filterDate(c.fecha) &&
            c.empleadoIds?.includes(empId)
        ) || [];

        let totalServiciosGenerado = 0;
        let comisionServicios = 0;

        empJobs.forEach((j: any) => {
            const s = servicios?.find(s => s.id === j.servicioId);
            if (!s) return;

            // Precio base del servicio + adicionales
            const precioTotalServicio = (s as any).precioSugerido + (j.serviciosAdicionales?.reduce((sum: number, sa: any) => sum + sa.precio, 0) || 0);

            // Determinar % de comisión (prioridad al servicio)
            const comisionResult = calculateCommission(
                precioTotalServicio,
                j.empleadoIds?.length || 1,
                (s as any).comision,
                emp.porcentajeComision
            );

            totalServiciosGenerado += precioTotalServicio / (j.empleadoIds?.length || 1);
            comisionServicios += comisionResult.perEmployeeCommission;
        });

        // 2. Ventas (Productos)
        const empSales = ventas?.filter(v => v.empleadoId === empId && filterDate(v.fecha)) || [];
        let totalVentasGenerado = 0;
        let comisionVentas = 0;

        empSales.forEach(s => {
            const comisionVenta = calculateCommission(s.total, 1, undefined, emp.porcentajeComision);
            totalVentasGenerado += s.total;
            comisionVentas += comisionVenta.totalCommission;
        });

        return {
            jobs: empJobs.length,
            sales: empSales.length,
            total: totalServiciosGenerado + totalVentasGenerado,
            comision: comisionServicios + comisionVentas
        };
    };

    const filteredEmpleados = empleados?.filter(e =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.especialidad?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-purple-600" /> Gestión de Personal
                    </h1>
                    <p className="text-gray-500">Control de empleados, comisiones y rendimiento</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
                >
                    <UserPlus size={20} /> Nuevo Empleado
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                        <Search className="text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o especialidad..."
                            className="w-full border-none focus:ring-0 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                <tr>
                                    <th className="px-6 py-4">Empleado</th>
                                    <th className="px-6 py-4">Especialidad</th>
                                    <th className="px-6 py-4">Comisión</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredEmpleados?.map(emp => (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 border-b">
                                            <div className="font-medium text-gray-900">{emp.nombre}</div>
                                            <div className="text-xs text-gray-500">{emp.telefono}</div>
                                        </td>
                                        <td className="px-6 py-4 border-b text-gray-600">{emp.especialidad || '-'}</td>
                                        <td className="px-6 py-4 border-b text-purple-600 font-semibold">{emp.porcentajeComision}%</td>
                                        <td className="px-6 py-4 border-b">
                                            <span className={`px-2 py-1 rounded-full text-xs ${emp.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {emp.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-b text-right space-x-2">
                                            <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign className="text-green-500" /> Resumen de Comisiones
                        </h2>

                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Desde</label>
                                <input
                                    type="date"
                                    className="w-full text-sm p-2 border rounded-lg"
                                    value={dateRange.inicio}
                                    onChange={e => setDateRange({ ...dateRange, inicio: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Hasta</label>
                                <input
                                    type="date"
                                    className="w-full text-sm p-2 border rounded-lg"
                                    value={dateRange.fin}
                                    onChange={e => setDateRange({ ...dateRange, fin: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {empleados?.filter(e => e.activo).map(emp => {
                                const stats = calculateStats(emp.id);
                                return (
                                    <div key={emp.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-default transition-all">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-800">{emp.nombre}</span>
                                            <span className="text-purple-600 font-bold">{formatCurrency(stats.comision)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{stats.jobs} servicios / {stats.sales} ventas</span>
                                            <span>Base: {formatCurrency(stats.total)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">{selectedEmpleadoId ? 'Editar Empleado' : 'Registro de Empleado'}</h3>
                            <button onClick={() => setShowModal(false)} className="hover:bg-purple-700 p-1 rounded-lg"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-2.5 border rounded-xl"
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                                    <input
                                        type="text"
                                        placeholder="Peluquería, Uñas..."
                                        className="w-full p-2.5 border rounded-xl"
                                        value={formData.especialidad}
                                        onChange={e => setFormData({ ...formData, especialidad: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="w-full p-2.5 border rounded-xl"
                                        value={formData.telefono}
                                        onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Comisión (%)</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full p-2.5 border rounded-xl"
                                        value={formData.porcentajeComision}
                                        onChange={e => setFormData({ ...formData, porcentajeComision: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Contratación</label>
                                    <input
                                        type="date"
                                        className="w-full p-2.5 border rounded-xl"
                                        value={formData.fechaContratacion}
                                        onChange={e => setFormData({ ...formData, fechaContratacion: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-md"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
