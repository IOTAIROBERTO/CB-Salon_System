# CB Control · Cristina Borquez Beauty Salon

Sistema de gestión del salón: citas y agenda, ventas, inventario y proveedores, clientes, Club Cristina Borquez,
catálogo y listas de precios por año, campañas, equipo y pago por hora, gastos, documentos, galería, reportes y
configuración.

Publicado en **https://cb-control.pages.dev** (Cloudflare Pages, se construye solo con cada push a `main`).
La galería pública vive en `/galeria/` y la página de reseñas en `/resenas/`.

## Cómo funciona

- **Sin servidor propio.** Los datos viven en IndexedDB (Dexie) y se sincronizan con **Dexie Cloud**:
  inicio de sesión por código al correo, un solo salón compartido y roles dueña / empleada (`src/db/`).
- La tabla `documentos` (archivos) es solo local.
- Consentimientos: firmados en la app de clientas con enlace personal (`src/db/firma.ts`) o en papel con foto.
- Integraciones (EmailJS, WhatsApp) se llaman desde el navegador (`src/services/`). Google Calendar va por el servidor
  (`app-clientas/api/google.ts`: espejo de citas cada minuto y horarios ocupados en tiempo real para la app de clientas).
- Los datos del negocio (ventas, finanzas) **nunca** van al repositorio: el sitio es público.
- `dexie-cloud.key` es secreto y está en `.gitignore`.

## Celular e instalación

- Es una PWA (`public/manifest.webmanifest`, `public/sw.js`): se instala desde Chrome (Android o computadora: aviso
  «Instalar» arriba de cada pantalla) o desde Safari en iPhone (Compartir → Agregar a pantalla de inicio). Abre en
  pantalla completa en Citas. El service worker es «red primero» y nunca toca Dexie Cloud ni `/api`.
- Avisos con la app cerrada: campana → «Activar avisos» (en iPhone, iOS 16.4+ y con la app instalada). La suscripción
  queda en la tabla `suscripciones` y el Worker `cb-avisos` (`../app-clientas/avisos`) manda cada aviso nuevo de la campana
  y el recordatorio de citas sin confirmar. «Probar» crea un aviso de prueba que llega en menos de un minuto.
- En pantallas táctiles, `src/index.css` agranda botones a 40 px y las tablas con la clase `tabla-tarjetas` se vuelven
  tarjetas en celular (las demás se desplazan de lado).
- Tabla nueva en `src/db/db.ts` = registrarla en Dexie Cloud antes de publicar (`npx dexie-cloud export --schema`,
  agregarla, `npx dexie-cloud import`); si no, la sincronización se traba en silencio.

## Diseño

Paleta y letras del brand book: negro `#111111`, dorado `#C29B57`, marfil `#F6F1E9`; Cormorant Garamond para
títulos y cifras, Jost para el texto. `tailwind.config.js` redefine las escalas de Tailwind (purple → dorado,
gray → neutros cálidos, green → salvia, red → borgoña, orange/yellow → ocre), así cualquier clase cae en la
paleta de la marca. Botones principales en negro; sin emojis ni degradados en la interfaz.

## Desarrollo

```bash
npm install
npm run dev
```

Abre en el puerto 3000. Para revisar la interfaz sin iniciar sesión se usa una copia aislada sin Dexie Cloud
(rol de dueña fijo y base local propia).

Pruebas de la lógica pura (agenda, Club, pagos, proveedores, saldo):

```bash
npx esbuild scripts/agenda.check.ts --bundle --platform=node --log-level=warning | node
```

(Cambia `agenda` por `lealtad`, `pagos`, `proveedores` o `saldo`.)

Tipos: `npx tsc -p tsconfig.app.json --noEmit` debe dar 0 errores (el despliegue corre `npx vite build`, que no
los revisa). ESLint está pendiente: `eslint.config.js` es para ESLint 9 y el proyecto tiene instalado ESLint 8.

## La app de clientas

Está en `../app-clientas/` y reutiliza de aquí los datos del salón, el catálogo y las reglas del Club
(alias `@salon`).
