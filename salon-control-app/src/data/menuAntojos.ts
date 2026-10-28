// Menú del break del salón (antes «Menú de antojos»; nombre cambiado el 28 de octubre de 2026). Solo precios de venta:
// los costos viven en Drive (CB_CONTROL/Editables/Menu de antojos - costos y precios.xlsx), nunca en el repo.
// Para venderlo con el descuento del Club, regístralo en Inventario con la categoría «Break» y el mismo nombre.
import { normalizar } from '../utils/texto';
import { BENEFICIOS_NIVEL, type Nivel } from '../utils/lealtad';

export interface Antojo { id: string; nombre: string; detalle?: string; precio: number; grupo: 'Break' | 'Bebidas' | 'Snacks y galletas'; foto?: string }

/** Lo de comer (Break, Snacks y galletas) lleva el descuento del Club desde Ámbar; las bebidas no */
export const MENU_ANTOJOS: Antojo[] = [
  { id: 'dumplings', nombre: 'Dumplings', detalle: '6 piezas', precio: 100, grupo: 'Break', foto: 'dumplings' },
  { id: 'waffles', nombre: 'Waffles con miel', detalle: '2 piezas', precio: 40, grupo: 'Break', foto: 'waffle' },
  { id: 'maruchan', nombre: 'Maruchan', detalle: '64 g', precio: 35, grupo: 'Break', foto: 'maruchan' },
  { id: 'frappuccino', nombre: 'Frappuccino Starbucks', detalle: '280 ml', precio: 70, grupo: 'Bebidas', foto: 'frappuccino' },
  { id: 'cocacola', nombre: 'Coca-Cola', detalle: '355 ml', precio: 25, grupo: 'Bebidas', foto: 'cocacola' },
  { id: 'lipton', nombre: 'Té helado Lipton', detalle: '600 ml', precio: 30, grupo: 'Bebidas', foto: 'te' },
  { id: 'papas', nombre: 'Papas Sabritas', precio: 30, grupo: 'Snacks y galletas', foto: 'papas' },
  { id: 'emperador', nombre: 'Galletas Emperador', detalle: '91 g', precio: 30, grupo: 'Snacks y galletas' },
  { id: 'nature', nombre: 'Barra Nature Valley', precio: 25, grupo: 'Snacks y galletas' },
  { id: 'cacahuates', nombre: 'Cacahuates', precio: 25, grupo: 'Snacks y galletas' },
  { id: 'oreo', nombre: 'Oreo', detalle: '42 g', precio: 20, grupo: 'Snacks y galletas', foto: 'oreo' }
];

/** Siempre de cortesía, en cualquier nivel y aunque no seas del Club */
export const CORTESIAS_SIEMPRE = [
  { nombre: 'Café caliente', foto: 'cafe_negro' },
  { nombre: 'Té caliente' },
  { nombre: 'Agua embotellada chica', foto: 'agua' }
];

export const CATEGORIA_ANTOJOS = 'Break';
/** Categoría del break en Inventario (también la vieja «Antojos», mientras CB Control la renombra al abrir) */
export const esCategoriaBreak = (c?: string) => c === CATEGORIA_ANTOJOS || c === 'Antojos';

export const esComida = (a: Antojo) => a.grupo !== 'Bebidas';

/** Descuento del Club en el break: solo lo de comer, desde Ámbar (las bebidas y lo que no está en el menú, sin descuento) */
export const descuentoAntojo = (nivel: Nivel, nombre: string) => {
  if (!normalizar(nombre)) return 0;
  const a = MENU_ANTOJOS.find(x => normalizar(nombre).startsWith(normalizar(x.nombre)) || normalizar(x.nombre).startsWith(normalizar(nombre)));
  return a && esComida(a) ? BENEFICIOS_NIVEL[nivel].antojosComida : 0;
};
