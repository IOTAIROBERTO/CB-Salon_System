# App de clientas · Cristina Borquez Beauty Salon

**App web instalable (PWA)** hecha con el mismo stack que CB Control (Vite, React, TypeScript y Tailwind con la paleta
de marca). Se instala desde el navegador («Agregar a pantalla de inicio») y se actualiza sola con cada publicación.
En computadora se ve a pantalla completa (barra arriba, contenido en columnas). **No se publica en Google Play**
(decisión del 27 de octubre de 2026); la carpeta `android/` queda solo por si algún día se retoma.

## Qué hay hoy

| Pantalla | Qué hace |
|---|---|
| Inicio | Logo, botón para agendar, Club, cómo llegar, horario, WhatsApp, Instagram y Facebook. Aviso para instalarla sin tienda: botón «Instalar» en Android, pasos de «Agregar a pantalla de inicio» en iPhone y «ábrela en tu navegador» si viene de Instagram o Facebook. No sale si ya está instalada o si la clienta lo cerró. |
| Agendar | Catálogo vivo de CB Control («desde $…») y horarios libres en tiempo real (agenda + lo ocupado en el Google Calendar de Cristina). La cita llega «pendiente» a CB Control; el salón confirma y manda el anticipo. WhatsApp queda de respaldo. |
| Break | Menú del break con fotos; catálogo de productos aún no (se pregunta por WhatsApp). |
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

## Lo que sigue

- **WhatsApp oficial** (falta `WA_TOKEN` y el número definitivo): activa la entrada con código, los avisos al salón y
  la confirmación y el recordatorio a las clientas (ya programados).
- Anticipos con Mercado Pago, catálogo de productos y dominio `cristinaborquez.com`.

## API y automatización (Cloudflare)

- **`/api`** (Pages Functions, misma dirección de la app): `servicios`, `disponibilidad`, `citas`, `club`, `acceso/codigo`,
  `acceso/verificar`, `mi-club`, `cita/<id>.<secreto>` (+ `/cancelar`, `/reagendar`: «Mi cita», pantalla `#/cita/<enlace>`, ver
  abajo), `firma/<id>` (consentimiento con enlace personal que crea CB Control; pantalla `#/firmar/<id>`,
  sin entrar al Club). Código en `api/` y `functions/api/`. Lee y escribe la base de CB Control (Dexie Cloud).
- **`avisos/`**: Worker `cb-avisos` que corre cada 10 minutos y manda por WhatsApp la confirmación de la cita (cuando el
  salón la confirma en CB Control) y el recordatorio del día anterior; cada minuto manda al celular del salón cada aviso
  nuevo de la campana con Web Push (`api/push.ts`: los dispositivos que activaron los avisos en CB Control, tabla
  `suscripciones`) y copia las citas a Google Calendar. Publicar: `npx wrangler deploy --config avisos/wrangler.toml`.
- **Secretos** (Cloudflare, nunca en el repo), en el proyecto de Pages `cristinaborquez-app` y en el Worker `cb-avisos`:
  `DEXIE_CLIENT_ID`, `DEXIE_CLIENT_SECRET`, `SESION_SECRETO` (solo Pages), `WA_TOKEN`, `WA_PHONE_ID`, `WA_AVISOS`
  (números del salón que reciben avisos, separados por coma, con 52 adelante), `GOOGLE_CUENTA_SERVICIO`, `GOOGLE_CALENDARIO`,
  `VAPID_PRIVADA` (solo el Worker; su llave pública `VAPID_PUBLICA` va en `avisos/wrangler.toml` y en CB Control
  `src/components/avisos/AvisosCelular.tsx`: si se cambia el par, cada celular vuelve a activar sus avisos).
  `TURNSTILE_SECRETO` (solo Pages): «no soy robot» en agendar, Club y código. Encender en orden: primero la llave pública en
  `src/components/NoSoyRobot.tsx` y publicar, después el secreto (al revés la API rechazaría la app vieja).
- **Contra citas falsas** (sin vencimiento automático): Turnstile; con WhatsApp conectado, solo aparta horario quien confirma
  su teléfono con código (la API responde 428 y la app lo pide); la campana de CB Control fija las citas de la app por
  confirmar y el Worker se las recuerda al salón por WhatsApp cada 4 h (9 a 21 h) hasta confirmarlas.
  Opcional en el Worker: `RECORDATORIOS=todas` para recordar también las citas que agenda el salón a mano.
- **Pruebas locales**: `npm run build`, luego `npm run dexie:falso` (base falsa, puerto 8799) y `npm run api:local` (app + API en
  8788; enlace de prueba `/#/firmar/firma_00000000000000000000000000000001`). Pruebas: `scripts/*.check.ts` (comando en cada archivo).
  Google simulado: `npx esbuild scripts/google.check.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module`.
  Web Push (cifrado contra el vector del RFC 8291, VAPID y avisos de la campana): igual con `scripts/push.check.ts`.
  «Mi cita» (ver, cambiar, cancelar, saldo a favor, «no llegó»): `scripts/micita.check.ts`; en local, `/#/cita/c1.00000000000000000000000000000001`.
- **«Mi cita»**: cada cita tiene un enlace personal (`<id>.<secreto>`; el secreto vive en `cita.enlace`). Lo da la app al
  agendar («Ver mi cita», y queda en Inicio como «Tu próxima cita») y CB Control lo pone en la nota de reserva y en el
  WhatsApp de Valorar. La clienta ve estado, precio, anticipo (con datos de pago si falta) y dirección, la agrega a su
  calendario, y la cambia (con 48 h o más, horarios reales) o la cancela sola: con 48 h o más su anticipo pagado pasa a
  saldo a favor; con menos se queda como anticipo perdido. Nunca muestra su teléfono ni su apellido.
- **Vista previa y aceptación**: antes de pedir, la clienta revisa y acepta servicio, día y hora, precio «desde», anticipo
  y políticas (la cita guarda `politicasAceptadas`). Cuando Cristina valora (precio final, anticipo y «Lo que haremos»),
  «Mi cita» le abre el resumen para aceptarlo (`/aceptar`, queda `aceptacion` como constancia); si no falta anticipo por
  transferencia, la cita queda confirmada al aceptar. Si Cristina cambia lo aceptado, la clienta lo vuelve a aceptar.
- **Una cita por servicio**: no se aparta el mismo servicio dos veces ni un horario que se cruza con otra cita suya (sin
  teléfono verificado llega como aviso «por confirmar a mano», sin revelar nada; verificado, se le dice). Antes de la
  valoración puede cambiar de servicio en «Mi cita» en vez de pedir otra cita.
- **Reservar rápido**: con su permiso, el celular recuerda nombre, teléfono y último servicio («Lo de siempre»: servicio,
  hora y «Pedir»). «Recordar mis datos» se puede quitar al agendar.

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
