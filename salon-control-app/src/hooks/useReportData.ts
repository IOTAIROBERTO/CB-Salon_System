import { useState, useEffect, useMemo } from 'react';
import { 
  Cita, 
  Venta, 
  Cliente, 
  ServicioCatalogo, 
  ReportData, 
  ReportStats, 
  ReportPeriod 
} from '../types/reportes';
import { calculateReportStats, generateReportData } from '../utils/reportUtils';

export const useReportData = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogoServicios, setCatalogoServicios] = useState<ServicioCatalogo[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');

  // Cargar datos desde localStorage
  useEffect(() => {
    const citasData = JSON.parse(localStorage.getItem('citas') || '[]');
    const ventasData = JSON.parse(localStorage.getItem('ventas') || '[]');
    const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]');
    const catalogoData = JSON.parse(localStorage.getItem('servicios') || '[]');

    setCitas(citasData);
    setVentas(ventasData);
    setClientes(clientesData);
    setCatalogoServicios(catalogoData);
  }, []);

  // Calcular estadísticas
  const stats: ReportStats = useMemo(() => 
    calculateReportStats(citas, ventas), 
    [citas, ventas]
  );

  // Generar datos del reporte
  const reportData: ReportData[] = useMemo(() => 
    generateReportData(citas, ventas, reportPeriod), 
    [citas, ventas, reportPeriod]
  );

  return {
    citas,
    ventas,
    clientes,
    catalogoServicios,
    reportPeriod,
    setReportPeriod,
    stats,
    reportData
  };
};