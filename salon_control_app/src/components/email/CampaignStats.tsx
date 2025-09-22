// src/components/email/CampaignStats.tsx - Fixed version
import React from 'react';
import { Mail, Send, Users, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

interface CampaignStatsProps {
  campaigns?: any[];
  clients?: any[];
}

interface StatsData {
  totalCampaigns: number;
  activeCampaigns: number;
  sentCampaigns: number;
  totalRecipients: number;
  successRate: number;
  scheduledCampaigns: number;
}

const CampaignStats: React.FC<CampaignStatsProps> = ({ 
  campaigns = [], 
  clients = [] 
}) => {
  // Safe calculation functions
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const safePercentage = (value: any, total: any): number => {
    const numValue = safeNumber(value);
    const numTotal = safeNumber(total);
    if (numTotal === 0) return 0;
    const percentage = (numValue / numTotal) * 100;
    return isNaN(percentage) ? 0 : Math.round(percentage * 100) / 100; // Round to 2 decimals
  };

  // Calculate statistics with safety checks
  const calculateStats = (): StatsData => {
    if (!Array.isArray(campaigns)) {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        sentCampaigns: 0,
        totalRecipients: 0,
        successRate: 0,
        scheduledCampaigns: 0
      };
    }

    const totalCampaigns = campaigns.length;
    
    const activeCampaigns = campaigns.filter(campaign => 
      campaign && campaign.estado === 'activa'
    ).length;
    
    const sentCampaigns = campaigns.filter(campaign => 
      campaign && campaign.estado === 'enviada'
    ).length;
    
    const scheduledCampaigns = campaigns.filter(campaign => 
      campaign && campaign.estado === 'programada'
    ).length;
    
    const totalRecipients = campaigns.reduce((total, campaign) => {
      if (!campaign || !Array.isArray(campaign.destinatarios)) return total;
      return total + campaign.destinatarios.length;
    }, 0);
    
    const totalSentEmails = campaigns.reduce((total, campaign) => {
      if (!campaign || !Array.isArray(campaign.destinatarios)) return total;
      return total + campaign.destinatarios.filter(recipient => 
        recipient && recipient.estado === 'enviado'
      ).length;
    }, 0);
    
    const successRate = safePercentage(totalSentEmails, totalRecipients);

    return {
      totalCampaigns,
      activeCampaigns,
      sentCampaigns,
      totalRecipients,
      successRate,
      scheduledCampaigns
    };
  };

  const stats = calculateStats();
  const clientsWithEmail = Array.isArray(clients) 
    ? clients.filter(client => client && client.email && client.email.trim() !== '').length 
    : 0;

  const statItems = [
    {
      title: 'Total Campañas',
      value: stats.totalCampaigns,
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Campañas Activas',
      value: stats.activeCampaigns,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Enviadas',
      value: stats.sentCampaigns,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Programadas',
      value: stats.scheduledCampaigns,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Total Destinatarios',
      value: stats.totalRecipients,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Clientes con Email',
      value: clientsWithEmail,
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    },
    {
      title: 'Tasa de Éxito',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {/* This is line 37 - ensuring we always pass a string */}
                  {String(item.value)}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <Icon size={24} className={item.color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CampaignStats;