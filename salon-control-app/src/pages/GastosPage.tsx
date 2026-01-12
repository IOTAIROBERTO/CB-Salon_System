import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Expense } from '../db/db';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/financialUtils';

export default function GastosPage() {
    const expenses = useLiveQuery(() => db.gastos.orderBy('fecha').reverse().toArray());
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<Partial<Expense>>({
        concepto: '',
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        categoria: 'variable',
        pagado: true,
        notas: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.concepto && formData.monto) {
            await db.gastos.add({
                concepto: formData.concepto,
                monto: Number(formData.monto),
                fecha: formData.fecha || new Date().toISOString(),
                categoria: formData.categoria as 'fijo' | 'variable',
                pagado: formData.pagado || false,
                notas: formData.notas
            });
            setShowModal(false);
            setFormData({
                concepto: '',
                monto: 0,
                fecha: new Date().toISOString().split('T')[0],
                categoria: 'variable',
                pagado: true,
                notas: ''
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este gasto?')) {
            await db.gastos.delete(id);
        }
    };

    const totalGastos = expenses?.reduce((sum, expense) => sum + expense.monto, 0) || 0;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Control de Gastos</h1>
                    <p className="text-gray-600">Administra los egresos del salón</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    Registrar Gasto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Gastos (Mes)</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(totalGastos)}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Concepto</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4">Notas</th>
                            <th className="p-4 text-right">Monto</th>
                            <th className="p-4 text-center">Pagado</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {expenses?.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="p-4 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        {new Date(expense.fecha).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-gray-800">{expense.concepto}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${expense.categoria === 'fijo' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {expense.categoria.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500 text-sm">{expense.notas || '-'}</td>
                                <td className="p-4 text-right font-bold text-red-600">
                                    - {formatCurrency(expense.monto)}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs ${expense.pagado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {expense.pagado ? 'PAGADO' : 'PENDIENTE'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => handleDelete(expense.id!)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {expenses?.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400">
                                    No hay gastos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Nuevo Gasto</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.concepto}
                                    onChange={e => setFormData({ ...formData, concepto: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ej. Renta Local"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.monto}
                                            onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })}
                                            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha}
                                        onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select
                                        value={formData.categoria}
                                        onChange={e => setFormData({ ...formData, categoria: e.target.value as any })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="variable">Variable</option>
                                        <option value="fijo">Fijo (Recurrente)</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.pagado}
                                            onChange={e => setFormData({ ...formData, pagado: e.target.checked })}
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Ya pagado</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea
                                    value={formData.notas}
                                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-20"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Guardar Gasto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
