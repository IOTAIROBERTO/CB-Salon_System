// Menú de antojos del salón (el mismo del impreso «Menú de antojos», octubre 2026). Solo precios de venta:
// los costos viven en Drive (CB_CONTROL/Editables/Menu de antojos - costos y precios.xlsx), nunca en el repo.
// Para vender un antojo con el descuento del Club, regístralo en Inventario con la categoría «Antojos» y el mismo nombre.
import { normalizar } from '../utils/texto';
import { BENEFICIOS_NIVEL, type Nivel } from '../utils/lealtad';

export interface Antojo { id: string; nombre: string; detalle?: string; precio: number; grupo: 'Antojos' | 'Bebidas' | 'Snacks y galletas'; foto?: string; seleccion?: boolean }

/** «seleccion»: los de mejor margen, con el descuento del Club desde Ámbar */
export const MENU_ANTOJOS: Antojo[] = [
  { id: 'dumplings', nombre: 'Dumplings', detalle: '6 piezas', precio: 100, grupo: 'Antojos', foto: 'dumplings' },
  { id: 'waffles', nombre: 'Waffles con miel', detalle: '2 piezas', precio: 40, grupo: 'Antojos', foto: 'waffle', seleccion: true },
  { id: 'maruchan', nombre: 'Maruchan', detalle: '64 g', precio: 35, grupo: 'Antojos', foto: 'maruchan' },
  { id: 'frappuccino', nombre: 'Frappuccino Starbucks', detalle: '280 ml', precio: 70, grupo: 'Bebidas', foto: 'frappuccino' },
  { id: 'cocacola', nombre: 'Coca-Cola', detalle: '355 ml', precio: 25, grupo: 'Bebidas', foto: 'cocacola' },
  { id: 'lipton', nombre: 'Té helado Lipton', detalle: '600 ml', precio: 30, grupo: 'Bebidas', foto: 'te' },
  { id: 'papas', nombre: 'Papas Sabritas', precio: 30, grupo: 'Snacks y galletas', foto: 'papas', seleccion: true },
  { id: 'emperador', nombre: 'Galletas Emperador', detalle: '91 g', precio: 30, grupo: 'Snacks y galletas', seleccion: true },
  { id: 'nature', nombre: 'Barra Nature Valley', precio: 25, grupo: 'Snacks y galletas', seleccion: true },
  { id: 'cacahuates', nombre: 'Cacahuates', precio: 25, grupo: 'Snacks y galletas', seleccion: true },
  { id: 'oreo', nombre: 'Oreo', detalle: '42 g', precio: 20, grupo: 'Snacks y galletas', foto: 'oreo', seleccion: true }
];

/** Siempre de cortesía, en cualquier nivel y aunque no seas del Club */
export const CORTESIAS_SIEMPRE = [
  { nombre: 'Café caliente', foto: 'cafe_negro' },
  { nombre: 'Té caliente' },
  { nombre: 'Agua embotellada chica', foto: 'agua' }
];

export const CATEGORIA_ANTOJOS = 'Antojos';

/** Descuento del Club en un antojo: la selección desde Ámbar; en Ónix, además, el resto del menú */
export const descuentoAntojo = (nivel: Nivel, nombre: string) => {
  const b = BENEFICIOS_NIVEL[nivel];
  if (!normalizar(nombre)) return b.antojosResto;
  const a = MENU_ANTOJOS.find(x => normalizar(nombre).startsWith(normalizar(x.nombre)) || normalizar(x.nombre).startsWith(normalizar(nombre)));
  return a?.seleccion ? b.antojosSeleccion : b.antojosResto;
};
