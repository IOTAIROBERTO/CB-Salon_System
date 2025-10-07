// src/components/citas/TimeSelector.tsx - Selector visual de hora mejorado
import { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  minTime?: string;
  label?: string;
}

export default function TimeSelector({ value, onChange, minTime, label }: TimeSelectorProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Horarios predefinidos comunes para salón de belleza (8 AM - 8 PM)
  const quickTimes = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00'
  ];

  // Generar bloques de tiempo por período del día
  const timeBlocks = {
    mañana: quickTimes.filter(t => {
      const hour = parseInt(t.split(':')[0]);
      return hour >= 8 && hour < 12;
    }),
    tarde: quickTimes.filter(t => {
      const hour = parseInt(t.split(':')[0]);
      return hour >= 12 && hour < 17;
    }),
    noche: quickTimes.filter(t => {
      const hour = parseInt(t.split(':')[0]);
      return hour >= 17 && hour <= 20;
    })
  };

  const [selectedBlock, setSelectedBlock] = useState<'mañana' | 'tarde' | 'noche'>('mañana');

  const formatTimeDisplay = (time: string) => {
    if (!time) return 'Seleccionar hora';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${period}`;
    } catch {
      return time;
    }
  };

  const isTimeDisabled = (time: string) => {
    if (!minTime) return false;
    return time < minTime;
  };

  const handleQuickTimeSelect = (time: string) => {
    if (!isTimeDisabled(time)) {
      onChange(time);
      setShowTimePicker(false);
    }
  };

  const getBlockColor = (block: 'mañana' | 'tarde' | 'noche') => {
    const colors = {
      mañana: 'from-yellow-400 to-orange-400',
      tarde: 'from-orange-400 to-red-400',
      noche: 'from-purple-400 to-indigo-500'
    };
    return colors[block];
  };

  const getBlockIcon = (block: 'mañana' | 'tarde' | 'noche') => {
    const icons = {
      mañana: '🌅',
      tarde: '☀️',
      noche: '🌙'
    };
    return icons[block];
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {/* Botón principal de selección */}
      <button
        type="button"
        onClick={() => setShowTimePicker(!showTimePicker)}
        className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-lg transition-all ${
          value 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 bg-white hover:border-purple-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock size={20} className={value ? 'text-purple-600' : 'text-gray-400'} />
          <span className={`font-medium ${value ? 'text-purple-900' : 'text-gray-500'}`}>
            {formatTimeDisplay(value)}
          </span>
        </div>
        <ChevronRight 
          size={20} 
          className={`transition-transform ${showTimePicker ? 'rotate-90' : ''} ${
            value ? 'text-purple-600' : 'text-gray-400'
          }`}
        />
      </button>

      {/* Panel de selección de hora */}
      {showTimePicker && (
        <div className="border-2 border-purple-200 rounded-lg bg-white shadow-lg p-4 animate-in slide-in-from-top-2">
          {/* Selector de período del día */}
          <div className="flex gap-2 mb-4">
            {(['mañana', 'tarde', 'noche'] as const).map((block) => (
              <button
                key={block}
                type="button"
                onClick={() => setSelectedBlock(block)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedBlock === block
                    ? `bg-gradient-to-r ${getBlockColor(block)} text-white shadow-md`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{getBlockIcon(block)}</span>
                {block.charAt(0).toUpperCase() + block.slice(1)}
              </button>
            ))}
          </div>

          {/* Rejilla de horarios */}
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {timeBlocks[selectedBlock].map((time) => {
              const disabled = isTimeDisabled(time);
              const selected = value === time;
              
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleQuickTimeSelect(time)}
                  disabled={disabled}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selected
                      ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                      : disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                  }`}
                >
                  {formatTimeDisplay(time)}
                </button>
              );
            })}
          </div>

          {/* Input manual como alternativa */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-xs text-gray-600 font-medium">O ingresa manualmente:</span>
            </div>
            <input
              type="time"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              min={minTime}
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Botón para cerrar */}
          <button
            type="button"
            onClick={() => setShowTimePicker(false)}
            className="mt-3 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Texto de ayuda */}
      {minTime && value && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Clock size={12} />
          <span>
            {new Date().toDateString() === new Date().toDateString()
              ? 'Para hoy, la hora debe ser futura'
              : 'Hora de inicio del servicio'
            }
          </span>
        </p>
      )}
    </div>
  );
}