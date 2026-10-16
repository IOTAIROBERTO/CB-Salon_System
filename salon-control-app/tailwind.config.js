/** @type {import('tailwindcss').Config} */
// Paleta de marca (Manual de marca, octubre 2026): negro, blanco y dorado.
// Las páginas usan clases purple/blue/pink/indigo desde antes del rebranding;
// en lugar de reescribir cientos de clases, esas escalas se redefinen aquí:
// purple y pink → dorado, blue e indigo → grafito.
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
        blue: grafito,
        indigo: grafito,
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
    },
  },
  plugins: [],
}
