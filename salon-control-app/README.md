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
- Integraciones (EmailJS, WhatsApp) se llaman desde el navegador (`src/services/`). Google Calendar va por el servidor
  (`app-clientas/api/google.ts`: espejo de citas cada minuto y horarios ocupados en tiempo real para la app de clientas).
- Los datos del negocio (ventas, finanzas) **nunca** van al repositorio: el sitio es público.
- `dexie-cloud.key` es secreto y está en `.gitignore`.

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

El despliegue corre `npx vite build` sin `tsc`: el proyecto arrastra errores de tipos viejos; revisa solo los
de los archivos que toques.

## La app de clientas

Está en `../app-clientas/` y reutiliza de aquí los datos del salón, el catálogo y las reglas del Club
(alias `@salon`).
