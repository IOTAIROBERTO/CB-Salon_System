import { useState } from 'react';
import { ExternalLink, Link as LinkIcon, MessageCircle } from 'lucide-react';

// La galería es una página pública aparte (public/galeria/), sin inicio de sesión,
// para que Google la indexe y se pueda compartir con clientas. Va con index.html
// porque el servidor de desarrollo no sirve el índice de carpetas de public/.
const urlGaleria = () => new URL('./galeria/index.html', document.baseURI).href;

export default function GaleriaPage() {
  const [copiado, setCopiado] = useState(false);
  const url = urlGaleria();

  const copiar = async () => {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-gray-900">Galería</h1>
          <p className="text-sm text-gray-600">Página pública con los trabajos del salón. Compártela con clientas o en tu perfil de Google e Instagram.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <ExternalLink size={16} /> Abrir
          </a>
          <button onClick={copiar} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100">
            <LinkIcon size={16} /> {copiado ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent('Mira algunos de mis trabajos: ' + url)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100">
            <MessageCircle size={16} /> Enviar por WhatsApp
          </a>
        </div>
      </div>
      <iframe src={url} title="Galería de trabajos" className="w-full h-[78vh] rounded-lg border border-gray-200 bg-white" />
    </div>
  );
}
