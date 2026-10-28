import { useEffect, useState } from 'react';
import { Copy, ExternalLink, MessageCircle, X } from 'lucide-react';
import { mensajeFirma, pedirFirma } from '../../db/firma';
import { enlaceWhatsApp } from '../../utils/lealtad';
import { qrSvg } from '../../utils/tarjetaCirculo';

/** Enlace personal para que la clienta firme su consentimiento en la app: por WhatsApp, con el QR en el salón
 *  o abriéndolo en este dispositivo. Sin celular, se imprime el formato y se guarda la foto del firmado. */
export default function PedirFirma({ clienteId, citaId, nombre, telefono, onClose }: {
  clienteId: string; citaId?: string; nombre: string; telefono?: string; onClose: () => void;
}) {
  const [enlace, setEnlace] = useState('');
  const [copiado, setCopiado] = useState(false);
  useEffect(() => { pedirFirma(clienteId, citaId).then(setEnlace); }, [clienteId, citaId]);
  const whatsapp = enlace ? enlaceWhatsApp(telefono, mensajeFirma(nombre, enlace)) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Firma en la app</h3>
            <p className="text-xs text-gray-500">{nombre} · el enlace vence en 7 días y sirve una sola vez</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar"><X size={18} /></button>
        </div>
        {!enlace ? <p className="text-sm text-gray-500">Preparando enlace…</p> : <>
          <div className="mx-auto w-48" dangerouslySetInnerHTML={{ __html: qrSvg(enlace) }} />
          <p className="text-xs text-center text-gray-500">En el salón: que lo escanee con la cámara de su celular.</p>
          <div className="grid gap-2">
            {whatsapp
              ? <a href={whatsapp} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700"><MessageCircle size={16} /> Mandar por WhatsApp</a>
              : <p className="text-xs text-amber-700">Sin teléfono de 10 dígitos: usa el QR o cópialo.</p>}
            <button onClick={() => navigator.clipboard.writeText(enlace).then(() => setCopiado(true))} className="flex items-center justify-center gap-2 border rounded-lg py-2 text-sm hover:bg-gray-50">
              <Copy size={16} /> {copiado ? 'Copiado' : 'Copiar enlace'}
            </button>
            <a href={enlace} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 border rounded-lg py-2 text-sm hover:bg-gray-50">
              <ExternalLink size={16} /> Firmar en este dispositivo
            </a>
          </div>
          <p className="text-[11px] text-gray-400">Al firmar llega un aviso a la campana y el consentimiento queda en su ficha.</p>
        </>}
      </div>
    </div>
  );
}
