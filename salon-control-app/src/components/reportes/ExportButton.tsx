import { Download } from 'lucide-react';
import { ReportData, ReportPeriod } from '../../types/reportes';
import { exportReportToCSV } from '../../utils/exportUtils';

interface ExportButtonProps {
  reportData: ReportData[];
  period: ReportPeriod;
}

export default function ExportButton({ reportData, period }: ExportButtonProps) {
  const handleExport = () => {
    exportReportToCSV(reportData, period);
  };

  return (
    <button
      onClick={handleExport}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 justify-center"
    >
      <Download size={20} />
      <span>Exportar CSV</span>
    </button>
  );
}