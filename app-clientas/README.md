# App de clientas · Cristina Borquez Beauty Salon

La app que se publica en Google Play. Es una **app web instalable (PWA)** hecha con el mismo stack que CB Control
(Vite, React, TypeScript y Tailwind con la paleta de marca). Para Android se empaqueta como
**Trusted Web Activity (TWA)** con Bubblewrap, como dice la propuesta: abre a pantalla completa con su ícono, recibe
notificaciones y se actualiza sola cada vez que se publica la web (sin subir otra versión a Play).

## Qué hay hoy

| Pantalla | Qué hace |
|---|---|
| Inicio | Logo, botón para agendar, Club, cómo llegar, horario, WhatsApp, Instagram y Facebook. Aviso para instalarla sin tienda: botón «Instalar» en Android, pasos de «Agregar a pantalla de inicio» en iPhone y «ábrela en tu navegador» si viene de Instagram o Facebook. No sale si ya está instalada o si la clienta lo cerró. |
| Agendar | Catálogo vivo de CB Control («desde $…») y horarios libres en tiempo real (agenda + lo ocupado en el Google Calendar de Cristina). La cita llega «pendiente» a CB Control; el salón confirma y manda el anticipo. WhatsApp queda de respaldo. |
| Antojos | Menú con fotos; catálogo de productos aún no (se pregunta por WhatsApp). |
| Mi Club | Reglas del Club Cristina Borquez y tarjeta personal (puntos, nivel, regalos, citas y consentimientos por firmar) al entrar con teléfono y código por WhatsApp: se activa cuando el WhatsApp oficial tenga token y número. |
| Firmar (`#/firmar/<id>`) | Consentimiento informado con el enlace personal que manda el salón: marca salud y permisos y firma con el dedo. Sin cuenta. |

Los datos del salón, las políticas, el catálogo y las reglas del Club **no se copian**: se leen de CB Control
(`../salon-control-app/src`, alias `@salon` en `vite.config.ts`). Si se cambia una regla allá, la app la toma al compilar.

## Cómo correrla

```bash
cd app-clientas
npm install
npm run dev        # http://localhost:3002
npm run build      # revisa tipos y deja la app en dist/
```

## Publicarla en la web

Ya está en Cloudflare Pages (cuenta de iotai.roberto@gmail.com), proyecto **cristinaborquez-app**:
<https://cristinaborquez-app.pages.dev>. Se publica sola con cada cambio en `main` (carpeta raíz `app-clientas`,
comando `npx vite build`, salida `dist`, `NODE_VERSION=20`).

Falta el dominio propio: cuando se compre `cristinaborquez.com`, en el proyecto → Custom domains → agregar
`app.cristinaborquez.com`. La TWA necesita `/.well-known/assetlinks.json` en la raíz de ese dominio; ya va en
`public/.well-known/` y se publica solo.

## Publicarla en Google Play

1. **Cuenta de Play Console** con el correo de Cristina (pago único de US$25 y verificación de identidad).
   Roberto se agrega como administrador.
2. **Herramientas** (una sola vez, en la computadora de Roberto): `npm install -g @bubblewrap/cli`. Bubblewrap
   descarga solo el JDK y el SDK de Android la primera vez.
3. **Llave de subida**: `bubblewrap build` la crea en la ruta de `android/twa-manifest.json`
   (`C:/Users/Roberto/Documents/llaves-cb/`, **fuera del repositorio**). Guardar el archivo y su contraseña en
   Bitwarden. Si se pierde, Google puede cambiarla, pero tarda; si se filtra, alguien podría subir versiones falsas.
4. **Compilar**: desde `app-clientas/android/` correr `bubblewrap build`. Sale `app-release-bundle.aab`.
5. **Subir a Play**: crear la app «Cristina Borquez Beauty Salon», activar *Firma de apps de Play* y subir el `.aab`
   a **prueba cerrada**. Con cuenta personal, Google pide **12 personas probándola 14 días** antes de publicarla
   (la propuesta dice 12 a 15 clientas de confianza).
6. **Enlazar la web con la app**: en Play Console → Integridad de la app → copiar la huella SHA-256 de la llave de
   firma de Play y pegarla en `public/.well-known/assetlinks.json` (donde dice `PEGAR_AQUI…`). Volver a publicar la
   web. Sin esto, la app abre con la barra del navegador arriba.
7. **Ficha de la tienda**: ícono 512 × 512 (`public/icons/icon-512.png`), imagen destacada 1024 × 500, 2 a 8 capturas
   del teléfono, descripción corta y larga, aviso de privacidad (ya existe en `02_Legal_y_Clientas`, se publica en
   la web) y el formulario de *Seguridad de los datos* (nombre, teléfono y citas; no se venden ni se comparten).

> **Confirmado el 22 de octubre de 2026:** identificador `com.cristinaborquez.app` y dominio
> `app.cristinaborquez.com`. En Play el identificador ya no se puede cambiar nunca: no tocarlo en
> `android/twa-manifest.json` ni en `public/.well-known/assetlinks.json`.

## Lo que sigue

- **WhatsApp oficial** (falta `WA_TOKEN` y el número definitivo): activa la entrada con código, los avisos al salón y
  la confirmación y el recordatorio a las clientas (ya programados).
- Anticipos con Mercado Pago, catálogo de productos, dominio `cristinaborquez.com` y publicación en Google Play.

## API y automatización (Cloudflare)

- **`/api`** (Pages Functions, misma dirección de la app): `servicios`, `disponibilidad`, `citas`, `club`, `acceso/codigo`,
  `acceso/verificar`, `mi-club`, `firma/<id>` (consentimiento con enlace personal que crea CB Control; pantalla `#/firmar/<id>`,
  sin entrar al Club). Código en `api/` y `functions/api/`. Lee y escribe la base de CB Control (Dexie Cloud).
- **`avisos/`**: Worker `cb-avisos` que corre cada 10 minutos y manda por WhatsApp la confirmación de la cita (cuando el
  salón la confirma en CB Control) y el recordatorio del día anterior; y cada minuto copia las citas a Google Calendar.
  Publicar: `npx wrangler deploy --config avisos/wrangler.toml`.
- **Secretos** (Cloudflare, nunca en el repo), en el proyecto de Pages `cristinaborquez-app` y en el Worker `cb-avisos`:
  `DEXIE_CLIENT_ID`, `DEXIE_CLIENT_SECRET`, `SESION_SECRETO` (solo Pages), `WA_TOKEN`, `WA_PHONE_ID`, `WA_AVISOS`
  (números del salón que reciben avisos, separados por coma, con 52 adelante), `GOOGLE_CUENTA_SERVICIO`, `GOOGLE_CALENDARIO`.
  Opcional en el Worker: `RECORDATORIOS=todas` para recordar también las citas que agenda el salón a mano.
- **Pruebas locales**: `npm run build`, luego `npm run dexie:falso` (base falsa, puerto 8799) y `npm run api:local` (app + API en
  8788; enlace de prueba `/#/firmar/firma_00000000000000000000000000000001`). Pruebas: `scripts/*.check.ts` (comando en cada archivo).
  Google simulado: `npx esbuild scripts/google.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module`.

## Google Calendar (`api/google.ts`)

Conexión desde el servidor con una **cuenta de servicio** (sin ventanas de permiso ni tokens que venzan):

- **Tiempo real para las clientas**: `/api/disponibilidad` y `/api/citas` leen en cada consulta lo que Cristina (y cada
  auxiliar con «Google Calendar ID») tiene como **Ocupado** en Google y no ofrecen esos horarios. Lo marcado como
  «Disponible», lo rechazado y las copias que hace CB Control no cuentan. Si Google falla, la agenda sigue sin esos bloqueos.
- **Espejo CB Control → Google** (Worker `cb-avisos`, cada minuto): citas pendientes/confirmadas/en curso desde hoy y
  vacaciones/apoyo del equipo. Cada evento lleva la marca privada `cb=1` con el id y una firma: solo se escribe lo que
  cambió; lo cancelado o borrado sale de Google; las completadas se quedan. Una cita va al calendario de quien la atiende
  (si tiene «Google Calendar ID»), si no al de Cristina.
- **Ocupado → CB Control** (mismo Worker, cada minuto): lo ocupado en Google de los próximos 180 días, sin títulos, se
  guarda en Dexie como `configuracion/ocupadoGoogle` (solo si cambió; si un calendario falla no se toca). CB Control lo
  suma a los bloqueos de su agenda (`useAgenda`) y lo muestra en el Calendario como «G Ocupado».

Puesta en marcha (una sola vez, proyecto de Google Cloud «CristinaBorquezSalon», con la Google Calendar API habilitada):

1. Google Cloud → IAM y administración → Cuentas de servicio → **Crear cuenta de servicio** (p. ej. `cb-calendario`,
   sin roles). En la cuenta → Claves → Agregar clave → **JSON**: se descarga un archivo. No subirlo al repo ni mandarlo por chat.
2. Cristina, en Google Calendar (web) → su calendario → Configuración y uso compartido → **Compartir con personas
   específicas** → el correo de la cuenta de servicio (`…@….iam.gserviceaccount.com`) → **Hacer cambios en eventos**.
3. Secretos (desde `app-clientas/`, con el JSON descargado; luego borrar el archivo):
   ```
   Get-Content RUTA\llave.json -Raw | npx wrangler pages secret put GOOGLE_CUENTA_SERVICIO --project-name cristinaborquez-app
   Get-Content RUTA\llave.json -Raw | npx wrangler secret put GOOGLE_CUENTA_SERVICIO --config avisos/wrangler.toml
   npx wrangler pages secret put GOOGLE_CALENDARIO --project-name cristinaborquez-app
   npx wrangler secret put GOOGLE_CALENDARIO --config avisos/wrangler.toml
   ```
   (`GOOGLE_CALENDARIO` = el Gmail de Cristina.) Publicar el Worker y hacer push (Pages vuelve a construir la app).

## Plantillas de WhatsApp (darlas de alta en Meta → WhatsApp Manager → Plantillas, idioma Español (MEX))

| Nombre | Categoría | Texto (las variables van entre llaves dobles) |
|---|---|---|
| `codigo_acceso` | Autenticación | Plantilla de código de Meta con botón «Copiar código». Tu código para entrar a tu Club Cristina Borquez es {{1}}. |
| `cita_recibida` | Utilidad | Hola, {{1}}. Recibimos tu solicitud de {{2}} para el {{3}} a las {{4}}. Te confirmamos en breve. Cristina Borquez Beauty Salon. |
| `cita_confirmada` | Utilidad | ¡Listo, {{1}}! Tu cita de {{2}} quedó confirmada para el {{3}} a las {{4}}. {{5}} Te esperamos en Plaza Galilea, planta alta. |
| `recordatorio_cita` | Utilidad | Hola, {{1}}. Te recordamos tu cita de {{2}} mañana, {{3}}, a las {{4}}. Si necesitas cambiarla, respóndenos aquí. |
| `aviso_salon` | Utilidad | Aviso de CB Control: {{1}} |
