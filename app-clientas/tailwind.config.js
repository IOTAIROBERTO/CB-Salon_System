/** @type {import('tailwindcss').Config} */
// Paleta y letras del Manual de marca (octubre 2026), las mismas de CB Control.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          negro: '#111111',
          grafito: '#2B2B2B',
          gris: '#6B665F',
          dorado: '#C29B57',
          'dorado-prof': '#8A6A2F',
          marfil: '#F6F1E9',
          champan: '#E8D9BC',
          linea: '#D9D0C1'
        }
      },
      fontFamily: {
        sans: ['Jost', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif']
      }
    }
  },
  plugins: []
}
