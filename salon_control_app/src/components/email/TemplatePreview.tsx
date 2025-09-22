// src/components/email/TemplatePreview.tsx
interface TemplatePreviewProps {
  templateId: string;
  templates: any[];
  customSubject?: string;
}

export default function TemplatePreview({ 
  templateId, 
  templates, 
  customSubject 
}: TemplatePreviewProps) {
  const template = templates.find(t => t.id === templateId);

  if (!template) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-500 text-center">Selecciona una plantilla para ver la vista previa</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-3">Vista previa de la plantilla:</h4>
      
      <div className="text-sm space-y-3">
        <div>
          <strong>Asunto:</strong> 
          <div className="bg-white p-2 rounded border text-gray-800 mt-1">
            {customSubject || template.asunto}
          </div>
        </div>
        
        <div>
          <strong>Contenido:</strong>
          <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-xs text-gray-700">
              {template.contenido.substring(0, 500)}
              {template.contenido.length > 500 && '...'}
            </pre>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          <strong>Variables disponibles:</strong> {template.variables?.join(', ') || 'Ninguna'}
        </div>
      </div>
    </div>
  );
}