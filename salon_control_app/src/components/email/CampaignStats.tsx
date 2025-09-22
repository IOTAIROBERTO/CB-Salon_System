// src/components/email/CampaignStats.tsx
import { Mail, Play, Send, Users } from 'lucide-react';
import { Campaign } from '../../types/campaigns';

interface CampaignStatsProps {
  campaigns: Campaign[];
  clients: any[];
}

export default function CampaignStats({ campaigns, clients }: CampaignStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Campañas</p>
            <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
          </div>
          <Mail size={24} className="text-purple-600" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Activas</p>
            <p className="text-2xl font-bold text-green-600">
              {campaigns.filter(c => c.estado === 'activa').length}
            </p>
          </div>
          <Play size={24} className="text-green-600" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Emails Enviados</p>
            <p className="text-2xl font-bold text-blue-600">
              {campaigns.reduce((sum, c) => sum + c.enviadoA, 0)}
            </p>
          </div>
          <Send size={24} className="text-blue-600" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Clientes</p>
            <p className="text-2xl font-bold text-purple-600">{clients.length}</p>
          </div>
          <Users size={24} className="text-purple-600" />
        </div>
      </div>
    </div>
  );
}