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

// Los destinos ya no viven aquí: son las zonas editables de utils/zonas.ts.

export const calcularTraslado = (km: number, dias: number, p: ParametrosTraslado = PARAMETROS_TRASLADO) => {
  const gasolina = (km / p.kmPorLitro) * p.precioGasolina;
  const viaticos = dias * (p.comidaDia + p.cafeDia) * p.personas;
  // Redondeado a la cincuentena, como la tabla del análisis
  const traslado = Math.round((gasolina + viaticos) / 50) * 50;
  return { gasolina, viaticos, traslado };
};
