// src/components/email/CampaignAnalyticsDashboard.tsx
import { TrendingUp, Mail, CheckCircle, XCircle, Eye, MousePointer, Users, Calendar } from 'lucide-react';

interface CampaignStats {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
  recentCampaigns: Array<{
    id: string;
    name: string;
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
}

interface AnalyticsDashboardProps {
  stats: CampaignStats;
  onClose?: () => void;
}

export default function CampaignAnalyticsDashboard({ stats, onClose }: AnalyticsDashboardProps) {
  const metrics = [
    {
      label: 'Total Enviados',
      value: stats.totalSent.toLocaleString(),
      icon: Mail,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Entregados',
      value: stats.totalDelivered.toLocaleString(),
      percentage: ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) + '%',
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      label: 'Abiertos',
      value: stats.totalOpened.toLocaleString(),
      percentage: stats.openRate.toFixed(1) + '%',
      icon: Eye,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Clicks',
      value: stats.totalClicked.toLocaleString(),
      percentage: stats.clickRate.toFixed(1) + '%',
      icon: MousePointer,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    }
  ];

  const performanceIndicators = [
    {
      label: 'Tasa de Apertura',
      value: stats.openRate,
      benchmark: 25,
      description: 'Promedio de la industria: 25%'
    },
    {
      label: 'Tasa de Clicks',
      value: stats.clickRate,
      benchmark: 3,
      description: 'Promedio de la industria: 3%'
    },
    {
      label: 'Tasa de Entrega',
      value: (stats.totalDelivered / stats.totalSent) * 100,
      benchmark: 95,
      description: 'Promedio de la industria: 95%'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={24} className="text-purple-600" />
            Analytics de CampaÃ±as
          </h2>
          <p className="text-gray-600 mt-1">MÃ©tricas y rendimiento de tus campaÃ±as de email</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            Ã—
          </button>
        )}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className={`${metric.bgColor} border-2 ${metric.borderColor} rounded-xl p-5 transition-transform hover:scale-105`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${metric.bgColor} p-2 rounded-lg`}>
                  <Icon size={20} className={metric.textColor} />
                </div>
                {metric.percentage && (
                  <div className={`${metric.textColor} text-xs font-semibold px-2 py-1 rounded-full bg-white`}>
                    {metric.percentage}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
              <div className={`text-3xl font-bold ${metric.textColor}`}>{metric.value}</div>
            </div>
          );
        })}
      </div>

      {/* Performance Indicators */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento vs Industria</h3>
        <div className="space-y-4">
          {performanceIndicators.map((indicator, index) => {
            const percentage = (indicator.value / indicator.benchmark) * 100;
            const isGood = indicator.value >= indicator.benchmark;
            
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{indicator.label}</div>
                    <div className="text-xs text-gray-500">{indicator.description}</div>
                  </div>
                  <div className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-orange-600'}`}>
                    {indicator.value.toFixed(1)}%
                  </div>
                </div>
                
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                      isGood ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                  {/* Benchmark line */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-gray-400"
                    style={{ left: '100%' }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-gray-500">0%</span>
                  <span className="text-gray-600 font-medium">Benchmark: {indicator.benchmark}%</span>
                  <span className="text-gray-500">{Math.max(indicator.benchmark, indicator.value).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CampaÃ±as Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CampaÃ±a</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Enviados</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Abiertos</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Clicks</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Tasa Apertura</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentCampaigns.map((campaign, index) => {
                const openRate = (campaign.opened / campaign.sent) * 100;
                
                return (
                  <tr key={campaign.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(campaign.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                        <Mail size={14} />
                        {campaign.sent}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium">
                        <Eye size={14} />
                        {campaign.opened}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-orange-600 font-medium">
                        <MousePointer size={14} />
                        {campaign.clicked}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${openRate >= 25 ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: `${Math.min(openRate, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${openRate >= 25 ? 'text-green-600' : 'text-orange-600'}`}>
                          {openRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-blue-600" />
            <h4 className="font-semibold text-blue-900">Audiencia</h4>
          </div>
          <p className="text-sm text-blue-700">
            MantÃ©n tu lista actualizada para mejorar la entregabilidad
          </p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-purple-600" />
            <h4 className="font-semibold text-purple-900">Frecuencia</h4>
          </div>
          <p className="text-sm text-purple-700">
            Los mejores dÃ­as son martes y jueves a las 10 AM
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <h4 className="font-semibold text-green-900">OptimizaciÃ³n</h4>
          </div>
          <p className="text-sm text-green-700">
            Personaliza el contenido para aumentar el engagement
          </p>
        </div>
      </div>
    </div>
  );
}