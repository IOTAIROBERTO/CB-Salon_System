// Pago del equipo por horas de apoyo (respuestas de octubre 2026): las chicas
// van por horas los días que se les llama. Lógica pura, sin base de datos.
//
// Reglas de la Ley Federal del Trabajo que se aplican solas:
// - Domingo: prima dominical de 25 % sobre lo de ese día (art. 71).
// - Día de descanso obligatorio trabajado: salario normal más el doble,
//   o sea pago triple (arts. 74 y 75).
// - Aviso si la tarifa por hora queda debajo del salario mínimo.

/** Pago sugerido a una colaboradora nueva (respuestas de la v2: unos $450 por 6 horas, «aumenta un poco») */
export const PAGO_SUGERIDO = { porHora: 75, bonos: { color: 100, maquillaje: 60, peinado: 60, tratamiento: 40, corte: 25 } as Record<string, number> };

/** Salario mínimo general 2026 por día (DOF 9 dic 2025); jornada de 8 horas */
export const SALARIO_MINIMO_DIA = 315.04;
export const MINIMO_POR_HORA = Math.round((SALARIO_MINIMO_DIA / 8) * 100) / 100;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lunesNumero = (anio: number, mes: number, n: number) => {
  const d = new Date(anio, mes, 1);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 7 * (n - 1));
  return iso(d);
};

/** Días de descanso obligatorio del año (art. 74 LFT) */
export const feriados = (anio: number): Record<string, string> => ({
  [`${anio}-01-01`]: 'Año Nuevo',
  [lunesNumero(anio, 1, 1)]: 'Día de la Constitución',
  [lunesNumero(anio, 2, 3)]: 'Natalicio de Benito Juárez',
  [`${anio}-05-01`]: 'Día del Trabajo',
  [`${anio}-09-16`]: 'Día de la Independencia',
  [lunesNumero(anio, 10, 3)]: 'Día de la Revolución',
  ...((anio - 2024) % 6 === 0 ? { [`${anio}-10-01`]: 'Transmisión del Poder Ejecutivo' } : {}),
  [`${anio}-12-25`]: 'Navidad'
});

export const nombreFeriado = (fecha: string) => feriados(Number(fecha.slice(0, 4)))[fecha];

interface EmpleadoP { id: string; nombre: string; pagoPorHora?: number; bonos?: Record<string, number> }
interface ApoyoP { empleadoId: string; tipo: string; fechaInicio: string; fechaFin: string; horas?: number }
interface CitaP { estado: string; fecha: string; servicioId: string; empleadoIds?: string[] }
interface ServicioP { id: string; nombre?: string; categoria?: string }

export interface DiaPagado { fecha: string; horas: number; importe: number; nota?: string }
export interface PagoPeriodo {
  dias: DiaPagado[];
  horas: number;
  pagoHoras: number;
  bonos: { categoria: string; citas: number; monto: number }[];
  totalBonos: number;
  total: number;
}

const diasEntre = (desde: string, hasta: string) => {
  const res: string[] = [];
  const d = new Date(`${desde}T12:00:00`);
  const fin = new Date(`${hasta}T12:00:00`);
  while (d <= fin) { res.push(iso(d)); d.setDate(d.getDate() + 1); }
  return res;
};

/** Lo que se le paga a una colaboradora entre dos fechas (inclusive) */
export const pagoPeriodo = (emp: EmpleadoP, apoyos: ApoyoP[], citas: CitaP[], servicios: ServicioP[], desde: string, hasta: string): PagoPeriodo => {
  const tarifa = emp.pagoPorHora || 0;
  const dias: DiaPagado[] = [];
  for (const a of apoyos.filter(a => a.empleadoId === emp.id && a.tipo === 'apoyo' && a.horas)) {
    for (const fecha of diasEntre(a.fechaInicio, a.fechaFin || a.fechaInicio)) {
      if (fecha < desde || fecha > hasta) continue;
      const base = a.horas! * tarifa;
      const feriado = nombreFeriado(fecha);
      const domingo = new Date(`${fecha}T12:00:00`).getDay() === 0;
      const importe = base * (feriado ? 3 : 1) + (domingo ? base * 0.25 : 0);
      const nota = [feriado && `${feriado}: pago triple`, domingo && 'domingo: +25 %'].filter(Boolean).join(' · ') || undefined;
      dias.push({ fecha, horas: a.horas!, importe, nota });
    }
  }
  dias.sort((a, b) => a.fecha.localeCompare(b.fecha));
  const porCategoria = new Map<string, number>();
  for (const c of citas) {
    if (c.estado !== 'completada' || c.fecha < desde || c.fecha > hasta || !c.empleadoIds?.includes(emp.id)) continue;
    const cat = servicios.find(s => s.id === c.servicioId)?.categoria || 'otros';
    porCategoria.set(cat, (porCategoria.get(cat) || 0) + 1);
  }
  const bonos = [...porCategoria].map(([categoria, n]) => ({ categoria, citas: n, monto: n * (emp.bonos?.[categoria] || 0) }))
    .filter(b => b.monto > 0);
  const horas = dias.reduce((t, d) => t + d.horas, 0);
  const pagoHoras = dias.reduce((t, d) => t + d.importe, 0);
  const totalBonos = bonos.reduce((t, b) => t + b.monto, 0);
  return { dias, horas, pagoHoras, bonos, totalBonos, total: pagoHoras + totalBonos };
};
