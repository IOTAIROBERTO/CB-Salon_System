/** @type {import('tailwindcss').Config} */
// Paleta de marca (Manual de marca, octubre 2026): negro, marfil y dorado.
// Las páginas usan clases purple/blue/pink/indigo/gray/green/red… desde antes del rebranding;
// en lugar de reescribir cientos de clases, esas escalas se redefinen aquí con tonos de la marca:
// purple y pink → dorado, blue e indigo → grafito, gray → neutros cálidos,
// green → salvia, red → borgoña, orange/yellow/amber → ocre. Así todo el sistema se ve de una sola casa.
const dorado = {
  50: '#FBF8F2',
  100: '#F6F1E9',
  200: '#E8D9BC',
  300: '#D9BF8C',
  400: '#C29B57',
  500: '#A9843F',
  600: '#8A6A2F',
  700: '#6F5525',
  800: '#54401C',
  900: '#3A2C13',
};
const grafito = {
  50: '#F7F5F2',
  100: '#EFEBE5',
  200: '#DED8CF',
  300: '#C4BCB0',
  400: '#9A9187',
  500: '#6B665F',
  600: '#2B2B2B',
  700: '#1A1A1A',
  800: '#2B2B2B',
  900: '#111111',
};
const neutro = {
  50: '#FAF8F5',
  100: '#F3F0EB',
  200: '#E6E1D8',
  300: '#D3CCBF',
  400: '#A8A095',
  500: '#7A746B',
  600: '#5C574F',
  700: '#423E38',
  800: '#2B2824',
  900: '#171513',
};
const salvia = {
  50: '#F2F6F2',
  100: '#E1EBE2',
  200: '#C3D6C5',
  300: '#9BBBA0',
  400: '#6F9A76',
  500: '#4F7D57',
  600: '#3D6645',
  700: '#2F5036',
  800: '#233C29',
  900: '#18291C',
};
const borgona = {
  50: '#FBF3F2',
  100: '#F5E2DF',
  200: '#EAC4BE',
  300: '#DB9C93',
  400: '#C46F64',
  500: '#A9483D',
  600: '#8F3A31',
  700: '#732E27',
  800: '#58231E',
  900: '#3E1915',
};
const ocre = {
  50: '#FBF6EC',
  100: '#F5EAD2',
  200: '#EBD3A5',
  300: '#DDB873',
  400: '#CC9A47',
  500: '#B37E2C',
  600: '#946523',
  700: '#744F1D',
  800: '#573B16',
  900: '#3B280F',
};
const sombra = 'rgba(23, 21, 19,';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: dorado,
        pink: dorado,
        violet: dorado,
        fuchsia: dorado,
        blue: grafito,
        indigo: grafito,
        sky: grafito,
        cyan: grafito,
        gray: neutro,
        slate: neutro,
        green: salvia,
        emerald: salvia,
        teal: salvia,
        lime: salvia,
        red: borgona,
        rose: borgona,
        orange: ocre,
        yellow: ocre,
        amber: ocre,
        marca: {
          negro: '#111111',
          dorado: '#C29B57',
          'dorado-prof': '#8A6A2F',
          marfil: '#F6F1E9',
          champan: '#E8D9BC',
        },
      },
      fontFamily: {
        sans: ['Jost', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      // Jost en negritas pesa demasiado: el lujo se nota en lo fino
      fontWeight: {
        semibold: '500',
        bold: '500',
        extrabold: '600',
      },
      boxShadow: {
        sm: `0 1px 2px ${sombra} 0.04)`,
        DEFAULT: `0 1px 2px ${sombra} 0.04), 0 6px 18px -10px ${sombra} 0.12)`,
        md: `0 1px 2px ${sombra} 0.04), 0 12px 28px -14px ${sombra} 0.16)`,
        lg: `0 2px 6px -2px ${sombra} 0.05), 0 22px 44px -22px ${sombra} 0.22)`,
        xl: `0 4px 10px -4px ${sombra} 0.06), 0 32px 64px -30px ${sombra} 0.30)`,
        '2xl': `0 40px 80px -36px ${sombra} 0.38)`,
      },
    },
  },
  plugins: [],
}
