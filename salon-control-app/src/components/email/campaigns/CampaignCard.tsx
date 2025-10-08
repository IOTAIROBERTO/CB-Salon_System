// src/components/email/campaigns/CampaignCard.tsx
import { 
  Mail, Calendar, Users, Eye, Send, Edit, Trash2, 
  MoreVertical, CheckCircle, Clock, TrendingUp, Copy
} from 'lucide-react';
import { useState } from 'react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  type: 'promocion' | 'cumpleanos' | 'recordatorio' | 'newsletter';
  recipients: any[];
  createdAt: string;
  sentAt?: string;
  status: 'draft' | 'sent' | 'sending' | 'scheduled';
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    failed: number;
  };
}

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSend: () => void;
  onViewDetails: () => void;
}

const TYPE_STYLES = {
  promocion: {
    icon: '🎁',
    gradient: 'from-yellow-400 to-orange-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200'
  },
  cumpleanos: {
    icon: '🎂',
    gradient: 'from-pink-400 to-purple-500',
    bg: 'bg-pink-50',
    border: 'border-pink-200'
  },
  recordatorio: {
    icon: '⏰',
    gradient: 'from-blue-400 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  newsletter: {
    icon: '📰',
    gradient: 'from-purple-400 to-indigo-500',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  }
};

const STATUS_STYLES = {
  draft: {
    label: 'Borrador',
    icon: Edit,
    color: 'text-gray-600',
    bg: 'bg-gray-100'
  },
  scheduled: {
    label: 'Programada',
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
  sending: {
    label: 'Enviando',
    icon: Send,
    color: 'text-orange-600',
    bg: 'bg-orange-100'
  },
  sent: {
    label: 'Enviada',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100'
  }
};

export default function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  onDuplicate,
  onSend,
  onViewDetails
}: CampaignCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const typeStyle = TYPE_STYLES[campaign.type];
  const statusStyle = STATUS_STYLES[campaign.status];
  const StatusIcon = statusStyle.icon;

  const openRate = campaign.stats 
    ? ((campaign.stats.opened / campaign.stats.sent) * 100) 
    : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header with gradient */}
      <div className={`h-2 bg-gradient-to-r ${typeStyle.gradient}`} />

      <div className="p-5">
        {/* Top Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className={`text-4xl flex-shrink-0 ${typeStyle.bg} p-3 rounded-xl border ${typeStyle.border}`}>
              {typeStyle.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                {campaign.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {campaign.subject}
              </p>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.color} text-xs font-semibold`}>
                  <StatusIcon size={12} />
                  {statusStyle.label}
                </div>
                
                {campaign.status === 'sent' && campaign.stats && (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <TrendingUp size={12} />
                    {openRate.toFixed(1)}% apertura
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical size={18} className="text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-10">
                <button
                  onClick={() => { onViewDetails(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye size={16} />
                  Ver Detalles
                </button>
                
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                )}

                <button
                  onClick={() => { onDuplicate(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy size={16} />
                  Duplicar
                </button>

                <button
                  onClick={() => { setShowStats(!showStats); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <TrendingUp size={16} />
                  Estadísticas
                </button>

                <hr className="my-2" />
                
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section - Collapsible */}
        {showStats && campaign.stats && campaign.status === 'sent' && (
          <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{campaign.stats.sent}</div>
                <div className="text-xs text-gray-600 mt-1">Enviados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{campaign.stats.opened}</div>
                <div className="text-xs text-gray-600 mt-1">Abiertos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{campaign.stats.clicked}</div>
                <div className="text-xs text-gray-600 mt-1">Clicks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{campaign.stats.failed}</div>
                <div className="text-xs text-gray-600 mt-1">Fallidos</div>
              </div>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{campaign.recipients.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{formatDate(campaign.sentAt || campaign.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            Ver
          </button>

          {campaign.status === 'draft' && (
            <button
              onClick={onSend}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Send size={16} />
              Enviar
            </button>
          )}

          {campaign.status === 'sent' && (
            <button
              onClick={onDuplicate}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Copy size={16} />
              Duplicar
            </button>
          )}
        </div>
      </div>

      {/* Bottom accent on hover */}
      <div className={`h-1 bg-gradient-to-r ${typeStyle.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}
