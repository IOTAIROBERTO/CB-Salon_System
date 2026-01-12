import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, SalonDocument } from '../db/db';
import { Plus, Trash2, FileText, Image as ImageIcon, File, Paperclip, Eye, Download } from 'lucide-react';

export default function DocumentosPage() {
    const documents = useLiveQuery(() => db.documentos.orderBy('fechaCreacion').reverse().toArray());
    const [showModal, setShowModal] = useState(false);
    const [tab, setTab] = useState<'upload' | 'note'>('upload');

    const [formData, setFormData] = useState<{
        titulo: string;
        texto: string;
        file: File | null;
    }>({
        titulo: '',
        texto: '',
        file: null
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (tab === 'upload' && formData.file && formData.titulo) {
            // Save file as Blob
            await db.documentos.add({
                titulo: formData.titulo,
                tipo: formData.file.type.startsWith('image/') ? 'imagen' : 'otro',
                fechaCreacion: new Date().toISOString(),
                contenido: formData.file // Dexie stores Blobs/Files natively
            });
        } else if (tab === 'note' && formData.titulo && formData.texto) {
            // Save text note
            await db.documentos.add({
                titulo: formData.titulo,
                tipo: 'contrato', // Using 'contrato' for text notes/contracts
                fechaCreacion: new Date().toISOString(),
                texto: formData.texto
            });
        }

        setShowModal(false);
        setFormData({ titulo: '', texto: '', file: null });
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este documento?')) {
            await db.documentos.delete(id);
        }
    };

    const downloadFile = (doc: SalonDocument) => {
        if (doc.contenido) {
            const url = URL.createObjectURL(doc.contenido);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.titulo;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Documentos y Contratos</h1>
                    <p className="text-gray-600">Archivos, imágenes y notas del salón</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nuevo Documento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents?.map((doc) => (
                    <div key={doc.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                {doc.tipo === 'imagen' ? <ImageIcon size={24} /> :
                                    doc.tipo === 'contrato' ? <FileText size={24} /> : <File size={24} />}
                            </div>
                            <button
                                onClick={() => handleDelete(doc.id!)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <h3 className="font-bold text-gray-800 mb-1">{doc.titulo}</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {new Date(doc.fechaCreacion).toLocaleDateString()}
                        </p>

                        {doc.texto && (
                            <p className="text-sm text-gray-600 line-clamp-3 mb-4 bg-gray-50 p-2 rounded">
                                {doc.texto}
                            </p>
                        )}

                        <div className="flex gap-2">
                            {doc.contenido && (
                                <button
                                    onClick={() => downloadFile(doc)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 py-2 rounded-lg hover:bg-purple-100"
                                >
                                    <Download size={16} /> Descargar
                                </button>
                            )}
                            {doc.texto && (
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 py-2 rounded-lg hover:bg-purple-100"
                                    onClick={() => alert(doc.texto)}
                                >
                                    <Eye size={16} /> Ver
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {documents?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                        <Paperclip className="mx-auto mb-2 opacity-50" size={48} />
                        <p>No hay documentos guardados</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Agregar Documento</h2>

                        <div className="flex gap-4 mb-4 border-b">
                            <button
                                className={`pb-2 text-sm font-medium ${tab === 'upload' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                                onClick={() => setTab('upload')}
                            >
                                Subir Archivo
                            </button>
                            <button
                                className={`pb-2 text-sm font-medium ${tab === 'note' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                                onClick={() => setTab('note')}
                            >
                                Nota / Contrato
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ej. Contrato de Renta 2024"
                                />
                            </div>

                            {tab === 'upload' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
                                    <input
                                        type="file"
                                        required
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                                    <textarea
                                        required
                                        value={formData.texto}
                                        onChange={e => setFormData({ ...formData, texto: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-32"
                                        placeholder="Escribe el contenido aquí..."
                                    ></textarea>
                                </div>
                            )}

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
