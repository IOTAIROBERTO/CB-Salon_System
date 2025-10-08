// src/components/email/CampaignScheduler.tsx
import { useState } from 'react';
import { Calendar, Clock, Send, X, AlertCircle, CheckCircle } from 'lucide-react';

interface SchedulerProps {
  campaignName: string;
  onSchedule: (scheduledDate: string, scheduledTime: string) => void;
  onSendNow: () => void;
  onClose: () => void;
}

const BEST_TIMES = [
  { time: '09:00', label: 'MaÃ±ana (9 AM)', score: 85, reason: 'Alto engagement' },
  { time: '10:00', label: 'Media MaÃ±ana (10 AM)', score: 95, reason: 'Mejor momento' },
  { time: '14:00', label: 'DespuÃ©s de comer (2 PM)', score: 75, reason: 'Buen engagement' },
  { time: '18:00', label: 'Tarde (6 PM)', score: 70, reason: 'Horario de salida' }
];

const BEST_DAYS = [
  { day: 2, label: 'Martes', score: 95 },
  { day: 3, label: 'MiÃ©rcoles', score: 90 },
  { day: 4, label: 'Jueves', score: 92 },
  { day: 5, label: 'Viernes', score: 75 }
];

export default function CampaignScheduler({
  campaignName,
  onSchedule,
  onSendNow,
  onClose
}: SchedulerProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [showCustomTime, setShowCustomTime] = useState(false);

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  
  const selectedDateTime = selectedDate && selectedTime 
    ? new Date(`${selectedDate}T${selectedTime}`)
    : null;

  const getDayOfWeek = (dateString: string) => {
    return new Date(dateString).getDay();
  };

  const getDayRecommendation = (dateString: string) => {
    const dayOfWeek = getDayOfWeek(dateString);
    const recommendation = BEST_DAYS.find(d => d.day === dayOfWeek);
    return recommendation;
  };

  const getTimeRecommendation = (time: string) => {
    return BEST_TIMES.find(t => t.time === time);
  };

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      alert('Por favor selecciona fecha y hora');
      return;
    }

    if (selectedDateTime && selectedDateTime <= new Date()) {
      alert('La fecha debe ser futura');
      return;
    }

    onSchedule(selectedDate, selectedTime);
  };

  const dayRecommendation = selectedDate ? getDayRecommendation(selectedDate) : null;
  const timeRecommendation = getTimeRecommendation(selectedTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Programar CampaÃ±a</h2>
              <p className="text-sm text-purple-100 mt-1">{campaignName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Action: Send Now */}
          <div className="mb-6">
            <button
              onClick={onSendNow}
              className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl"
            >
              <Send size={20} />
              Enviar Ahora
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">O programa para despuÃ©s</span>
            </div>
          </div>

          {/* Schedule Options */}
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Fecha de EnvÃ­o
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
              
              {/* Day Recommendation */}
              {selectedDate && dayRecommendation && (
                <div className={`mt-2 p-3 rounded-lg flex items-center gap-2 ${
                  dayRecommendation.score >= 90 
                    ? 'bg-green-50 border border-green-200' 
                    : dayRecommendation.score >= 75
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {dayRecommendation.score >= 90 ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-600" />
                  )}
                  <span className="text-sm">
                    <strong>{dayRecommendation.label}</strong> - Score: {dayRecommendation.score}/100
                  </span>
                </div>
              )}
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={16} />
                Hora de EnvÃ­o
              </label>

              {/* Recommended Times */}
              {!showCustomTime ? (
                <div className="space-y-2 mb-3">
                  {BEST_TIMES.map((option) => (
                    <button
                      key={option.time}
                      onClick={() => setSelectedTime(option.time)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedTime === option.time
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{option.reason}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            option.score >= 90 ? 'bg-green-100 text-green-700' :
                            option.score >= 80 ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {option.score}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all mb-3"
                />
              )}

              <button
                onClick={() => setShowCustomTime(!showCustomTime)}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                {showCustomTime ? 'â† Ver horarios recomendados' : 'Usar hora personalizada â†’'}
              </button>
            </div>

            {/* Summary */}
            {selectedDate && selectedTime && selectedDateTime && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
                <h4 className="font-semibold text-purple-900 mb-2">ðŸ“… Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Se enviarÃ¡ el:</span>
                    <span className="font-semibold text-purple-900">
                      {new Date(selectedDateTime).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">A las:</span>
                    <span className="font-semibold text-purple-900">{selectedTime}</span>
                  </div>
                  {timeRecommendation && (
                    <div className="pt-2 mt-2 border-t border-purple-200">
                      <div className="flex items-center gap-2 text-purple-700">
                        <CheckCircle size={14} />
                        <span className="text-xs">{timeRecommendation.reason}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Best Practices Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                ðŸ’¡ Mejores PrÃ¡cticas
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>â€¢ <strong>Martes a Jueves</strong> tienen mejor tasa de apertura</li>
                <li>â€¢ <strong>9-11 AM</strong> es el horario ideal para emails</li>
                <li>â€¢ Evita <strong>fines de semana</strong> y dÃ­as festivos</li>
                <li>â€¢ Considera la <strong>zona horaria</strong> de tus clientes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Calendar size={16} />
            Programar EnvÃ­o
          </button>
        </div>
      </div>
    </div>
  );
}