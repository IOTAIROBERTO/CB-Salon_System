// Fórmula de traslado para servicios fuera de Hermosillo (Análisis y plan 2027).
// Traslado = gasolina + viáticos (comida y café por persona al día), sin casetas ni,
// para Arizona, visa y seguro del carro. Hospedaje aparte (v5): si hay que dormir
// allá, la novia paga un mínimo por noche; si el hotel cuesta más, lo pone el salón.

export interface ParametrosTraslado {
  kmPorLitro: number;
  precioGasolina: number;
  comidaDia: number;
  cafeDia: number;
  personas: number;
  hospedajeNoche: number;
}

export const PARAMETROS_TRASLADO: ParametrosTraslado = {
  kmPorLitro: 12,
  precioGasolina: 25.5,
  comidaDia: 350,
  cafeDia: 130,
  personas: 2,
  hospedajeNoche: 1000
};

// Los destinos ya no viven aquí: son las zonas editables de utils/zonas.ts.

export const calcularTraslado = (km: number, dias: number, p: ParametrosTraslado = PARAMETROS_TRASLADO, noches = 0) => {
  const gasolina = (km / p.kmPorLitro) * p.precioGasolina;
  const viaticos = dias * (p.comidaDia + p.cafeDia) * p.personas;
  // Redondeado a la cincuentena, como la tabla del análisis
  const traslado = Math.round((gasolina + viaticos) / 50) * 50;
  const hospedaje = noches * p.hospedajeNoche;
  return { gasolina, viaticos, traslado, hospedaje };
};
