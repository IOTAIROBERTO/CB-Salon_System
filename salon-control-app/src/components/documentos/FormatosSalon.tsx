import { FileText, Printer } from 'lucide-react';
import { FORMATOS, urlFormato, type GrupoFormato } from '../../data/formatos';

const GRUPOS: GrupoFormato[] = ['Clientas y legal', 'Operación', 'Equipo', 'Precios'];

/** Formatos imprimibles con la marca (PDF en public/formatos) */
export default function FormatosSalon() {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Formatos del salón</h2>
        <p className="text-sm text-gray-600">Listos para imprimir en tamaño carta. Ábrelos y usa «Imprimir» del navegador.</p>
      </div>
      <div className="space-y-6">
        {GRUPOS.map(grupo => (
          <div key={grupo}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-600 mb-2">{grupo}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {FORMATOS.filter(f => f.grupo === grupo).map(f => (
                <a
                  key={f.archivo}
                  href={urlFormato(f.archivo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-400 hover:shadow-sm transition"
                >
                  <div className="p-2 h-fit rounded-md bg-purple-50 text-purple-600">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 flex items-center justify-between gap-2">
                      {f.titulo}
                      <Printer size={15} className="text-gray-400 group-hover:text-purple-600 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{f.descripcion}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
