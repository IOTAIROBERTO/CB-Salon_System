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
  pantalla completa en «Hoy». El service worker es «red primero» y nunca toca Dexie Cloud ni `/api`.
- **Hoy** (`src/pages/HoyPage.tsx`, la pantalla de inicio): solicitudes por valorar, anticipos por recibir («Recibido» la
  confirma), citas del día con su siguiente paso (Iniciar → Cobrar, «No llegó»), recordatorio de mañana por WhatsApp con
  el enlace «Mi cita» y cumpleañeras; la dueña ve lo cobrado hoy.
- **Cobro exprés** (`components/hoy/CobroExpres.tsx`, `utils/cobro.ts`): precio acordado (o de catálogo) menos el
  anticipo recibido; tocar el método cobra y guarda lo mismo que el cobro completo sin cambios (prueba:
  `scripts/cobro.check.ts`). El cobro completo también parte del precio acordado al valorar.
- **Nueva cita exprés** (`components/hoy/CitaExpres.tsx`): clienta por nombre o teléfono (un teléfono ya registrado usa
  su ficha), sus últimos servicios, Hoy/Mañana y primer horario libre; al guardar, nota por WhatsApp con «Mi cita».
- **Búsqueda global** (`components/BuscarGlobal.tsx`): lupa en el celular, barra lateral en computadora, Ctrl+K o «/».
  Clientas (ficha, nueva cita, WhatsApp), citas y folios de tarjetas de regalo. `/clientes?ficha=<id>` abre una ficha y
  `/citas?q=…` filtra las citas.
- Avisos con la app cerrada: campana → «Activar avisos» (en iPhone, iOS 16.4+ y con la app instalada). La suscripción
  queda en la tabla `suscripciones` y el Worker `cb-avisos` (`../app-clientas/avisos`) manda cada aviso nuevo de la campana
  y el recordatorio de citas sin confirmar. «Probar» crea un aviso de prueba que llega en menos de un minuto.
- En pantallas táctiles, `src/index.css` agranda botones a 40 px y las tablas con la clase `tabla-tarjetas` se vuelven
  tarjetas en celular (las demás se desplazan de lado).
- «Mi cita» y «No llegó» (`src/db/miCita.ts`): la nota de reserva y Valorar llevan el enlace con el que la clienta ve,
  cambia o cancela su cita (política de 48 h: anticipo a saldo a favor o perdido). «No llegó» en la cita del día libera
  la agenda y deja el anticipo como perdido; la tarjeta y Valorar avisan cuántas veces faltó. En Reportes, el anticipo
  que se queda el salón cuenta como ingreso.
- Pedidos de la app («Mi carrito» de las clientas, `src/db/pedidos.ts`, reglas en `src/utils/pedidos.ts`): en Inventario,
  el botón del celular pone un producto «en la app» (con descripción y foto). Lo que una clienta aparta (por pagar o
  pagado) no se puede vender en el salón: Ventas e Inventario muestran solo lo disponible y `registrarVenta` lo vuelve a
  revisar. Ventas → Pedidos de la app: «Llegó el pago» (pago manual; Mercado Pago tiene ya su lugar en `Pedido`),
  «Entregado» (crea la venta) y cancelar. Los plazos (48 h para pagar, 10 días para recoger) los vence el Worker.
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

(Cambia `agenda` por `cobro`, `lealtad`, `pagos`, `pedidos`, `proveedores` o `saldo`.)

Tipos: `npx tsc -p tsconfig.app.json --noEmit` debe dar 0 errores (el despliegue corre `npx vite build`, que no
los revisa). ESLint está pendiente: `eslint.config.js` es para ESLint 9 y el proyecto tiene instalado ESLint 8.

## La app de clientas

Está en `../app-clientas/` y reutiliza de aquí los datos del salón, el catálogo y las reglas del Club
(alias `@salon`).
