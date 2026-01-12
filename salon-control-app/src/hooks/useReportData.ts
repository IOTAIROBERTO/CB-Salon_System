import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  ReportData,
  ReportStats,
  ReportPeriod
} from '../types/reportes';
import { calculateReportStats, generateReportData } from '../utils/reportUtils';

export const useReportData = () => {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');

  // Cargar datos desde Dexie en tiempo real
  const citas = useLiveQuery(() => db.citas.toArray()) || [];
  const ventas = useLiveQuery(() => db.ventas.toArray()) || [];
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];
  const catalogoServicios = useLiveQuery(() => db.servicios.toArray()) || [];
  const gastos = useLiveQuery(() => db.gastos.toArray()) || [];

  // Calcular estadísticas
  const stats: ReportStats = useMemo(() =>
    calculateReportStats(citas as any, ventas as any, gastos),
    [citas, ventas, gastos]
  );

  // Generar datos del reporte para gráficas
  const reportData: ReportData[] = useMemo(() =>
    generateReportData(citas as any, ventas as any, reportPeriod),
    [citas, ventas, reportPeriod]
  );

  return {
    citas,
    ventas,
    clientes,
    catalogoServicios,
    gastos,
    reportPeriod,
    setReportPeriod,
    stats,
    reportData
  };
};