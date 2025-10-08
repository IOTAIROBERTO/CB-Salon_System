// src/components/email/campaigns/EmailCampaignWizard.tsx
import { useState } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Check, 
  Users, Mail, Eye, Sparkles 
} from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
}

interface WizardProps {
  clientes: Cliente[];
  onComplete: (campaignData: any) => void;
  onClose: () => void;
}

const STEPS = [
  { id: 1, name: 'Tipo', icon: Sparkles },
  { id: 2, name: 'Destinatarios', icon: Users },
  { id: 3, name: 'Contenido', icon: Mail },
  { id: 4, name: 'Revisión', icon: Eye }
];

const CAMPAIGN_TYPES = [
  {
    id: 'promocion',
    name: 'Promoción',
    description: 'Ofertas especiales y descuentos',
    icon: '🎁',
    color: 'yellow'
  },
  {
    id: 'cumpleanos',
    name: 'Cumpleaños',
    description: 'Felicitaciones personalizadas',
    icon: '🎂',
    color: 'pink'
  },
  {
    id: 'recordatorio',
    name: 'Recordatorio',
    description: 'Recuerda tu próxima cita',
    icon: '⏰',
    color: 'blue'
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Novedades y actualizaciones',
    icon: '📰',
    color: 'purple'
  }
];

export default function EmailCampaignWizard({ clientes, onComplete, onClose }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    type: '',
    name: '',
    subject: '',
    message: '',
    selectedClients: [] as string[],
    segmentation: 'all' as 'all' | 'custom'
  });

  const updateData = (field: string, value: any) => {
    setCampaignData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return campaignData.type !== '';
      case 2: return campaignData.selectedClients.length > 0;
      case 3: return campaignData.name && campaignData.subject && campaignData.message;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(campaignData);
  };

  // STEP 1: Tipo de campaña
  const renderTypeStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Selecciona el tipo de campaña</h3>
      <p className="text-sm text-gray-600">Elige el tipo que mejor se adapte a tu objetivo</p>
      
      <div className="grid grid-cols-2 gap-4">
        {CAMPAIGN_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => updateData('type', type.id)}
            className={`p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
              campaignData.type === type.id
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-4xl mb-3">{type.icon}</div>
            <h4 className="font-semibold text-gray-900 mb-1">{type.name}</h4>
            <p className="text-sm text-gray-600">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // STEP 2: Destinatarios
  const renderRecipientsStep = () => {
    const applySegmentation = (seg: string) => {
      updateData('segmentation', seg);
      
      if (seg === 'all') {
        updateData('selectedClients', clientes.map(c => c.id));
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona los destinatarios</h3>
          <p className="text-sm text-gray-600">
            {campaignData.selectedClients.length} de {clientes.length} clientes seleccionados
          </p>
        </div>

        {/* Segmentación rápida */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => applySegmentation('all')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              campaignData.segmentation === 'all'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">Todos los clientes</div>
            <div className="text-sm text-gray-600 mt-1">{clientes.length} clientes</div>
          </button>

          <button
            onClick={() => updateData('segmentation', 'custom')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              campaignData.segmentation === 'custom'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">Selección personalizada</div>
            <div className="text-sm text-gray-600 mt-1">{campaignData.selectedClients.length} clientes</div>
          </button>
        </div>

        {/* Lista de clientes si es personalizada */}
        {campaignData.segmentation === 'custom' && (
          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {clientes.map((cliente) => (
                <label key={cliente.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={campaignData.selectedClients.includes(cliente.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateData('selectedClients', [...campaignData.selectedClients, cliente.id]);
                      } else {
                        updateData('selectedClients', campaignData.selectedClients.filter(id => id !== cliente.id));
                      }
                    }}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{cliente.nombre}</div>
                    <div className="text-xs text-gray-500">{cliente.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // STEP 3: Contenido
  const renderContentStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Crea el contenido</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la campaña *
        </label>
        <input
          type="text"
          value={campaignData.name}
          onChange={(e) => updateData('name', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Ej: Promoción San Valentín 2024"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Asunto del email *
        </label>
        <input
          type="text"
          value={campaignData.subject}
          onChange={(e) => updateData('subject', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Ej: ¡Oferta especial solo para ti!"
        />
        <p className="text-xs text-gray-500 mt-1">
          Mantén el asunto breve y atractivo (máx. 50 caracteres)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mensaje *
        </label>
        <textarea
          value={campaignData.message}
          onChange={(e) => updateData('message', e.target.value)}
          rows={10}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Escribe tu mensaje aquí. Puedes usar variables como {{nombre}} para personalizar."
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">
            Usa {`{{nombre}}`} para personalizar
          </p>
          <span className="text-xs text-gray-500">
            {campaignData.message.length} caracteres
          </span>
        </div>
      </div>
    </div>
  );

  // STEP 4: Revisión
  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Revisa tu campaña</h3>
        <p className="text-sm text-gray-600">Verifica que todo esté correcto antes de crear</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 mb-1">Tipo</div>
          <div className="font-semibold text-gray-900">
            {CAMPAIGN_TYPES.find(t => t.id === campaignData.type)?.name}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">Destinatarios</div>
          <div className="font-semibold text-gray-900">
            {campaignData.selectedClients.length} clientes
          </div>
        </div>
      </div>

      {/* Preview del email */}
      <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
        <div className="mb-4 pb-4 border-b">
          <div className="text-xs text-gray-500 mb-1">De: Beauty Salon</div>
          <div className="text-xs text-gray-500 mb-2">Para: {campaignData.selectedClients.length} destinatarios</div>
          <div className="font-semibold text-lg text-gray-900">{campaignData.subject}</div>
        </div>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700">
            {campaignData.message}
          </div>
        </div>
      </div>

      {/* Advertencia */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 text-lg">⚠️</div>
          <div className="flex-1 text-sm text-yellow-800">
            <p className="font-medium">Antes de crear:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verifica que el asunto sea claro y atractivo</li>
              <li>Revisa que no haya errores ortográficos</li>
              <li>Asegúrate de que los destinatarios sean correctos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Crear Nueva Campaña</h2>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-purple-600 text-white ring-4 ring-purple-100' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </div>
                    <div className={`text-sm mt-2 font-medium ${
                      isActive ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      {step.name}
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && renderTypeStep()}
          {currentStep === 2 && renderRecipientsStep()}
          {currentStep === 3 && renderContentStep()}
          {currentStep === 4 && renderReviewStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Paso {currentStep} de {STEPS.length}
          </div>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
            )}
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check size={16} />
                Crear Campaña
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
