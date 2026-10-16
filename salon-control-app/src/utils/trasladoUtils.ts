// Fórmula de traslado para servicios fuera de Hermosillo (Análisis y plan 2027).
// Traslado = gasolina + viáticos (comida y café por persona al día), sin
// hospedaje, casetas ni, para Arizona, visa y seguro del carro.

export interface ParametrosTraslado {
  kmPorLitro: number;
  precioGasolina: number;
  comidaDia: number;
  cafeDia: number;
  personas: number;
}

export const PARAMETROS_TRASLADO: ParametrosTraslado = {
  kmPorLitro: 12,
  precioGasolina: 25.5,
  comidaDia: 350,
  cafeDia: 130,
  personas: 2
};

export interface Destino {
  nombre: string;
  km: number;   // ida y vuelta
  dias: number;
}

export const DESTINOS: Destino[] = [
  { nombre: 'Guaymas / San Carlos', km: 260, dias: 1 },
  { nombre: 'Ciudad Obregón', km: 520, dias: 2 },
  { nombre: 'Nogales', km: 560, dias: 2 },
  { nombre: 'Navojoa', km: 680, dias: 2 },
  { nombre: 'Tucson, Arizona', km: 730, dias: 2 },
  { nombre: 'Puerto Peñasco', km: 760, dias: 2 },
  { nombre: 'Los Mochis', km: 1000, dias: 3 },
  { nombre: 'Phoenix, Arizona', km: 1150, dias: 3 }
];

export const calcularTraslado = (km: number, dias: number, p: ParametrosTraslado = PARAMETROS_TRASLADO) => {
  const gasolina = (km / p.kmPorLitro) * p.precioGasolina;
  const viaticos = dias * (p.comidaDia + p.cafeDia) * p.personas;
  // Redondeado a la cincuentena, como la tabla del análisis
  const traslado = Math.round((gasolina + viaticos) / 50) * 50;
  return { gasolina, viaticos, traslado };
};
