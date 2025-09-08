# Sistema de Control para Salón de Belleza

## Requisitos
- Node.js v18 o superior
- npm o yarn

## Instalación
1. Descomprimir el proyecto.
2. Abrir una terminal en la carpeta raíz.
3. Ejecutar:
   npm install

## Integrar TailwindCSS (para estilos)
1. Instalar Tailwind:
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p

2. Configurar `tailwind.config.js` con:
   content: [
     "./index.html",
     "./src/**/*.{js,ts,jsx,tsx}",
   ]

3. En `src/index.css` agregar:
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

## Ejecutar la aplicación
npm run dev

Esto levantará la app en:
http://localhost:5173/

## Reiniciar datos
1. Abre el navegador en la pestaña Application > localStorage.
2. Elimina las claves:
   - clientes
   - servicios
   - ventas
   - inventario
3. Recarga la página y se restaurarán los datos iniciales.

## Notas
- El proyecto **NO requiere backend ni base de datos**.
- Todos los datos se guardan en `localStorage`.
- Ideal para prototipo y pruebas.