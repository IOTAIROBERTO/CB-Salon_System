# App de clientas · Cristina Borquez Beauty Salon

La app que se publica en Google Play. Es una **app web instalable (PWA)** hecha con el mismo stack que CB Control
(Vite, React, TypeScript y Tailwind con la paleta de marca). Para Android se empaqueta como
**Trusted Web Activity (TWA)** con Bubblewrap, como dice la propuesta: abre a pantalla completa con su ícono, recibe
notificaciones y se actualiza sola cada vez que se publica la web (sin subir otra versión a Play).

## Qué hay hoy (fase 1)

| Pantalla | Qué hace |
|---|---|
| Inicio | Logo, botón para agendar, Club, cómo llegar, horario, WhatsApp, Instagram y Facebook. |
| Agendar | Catálogo 2027 por categoría («desde $…»). La clienta elige servicio, fecha y turno y la solicitud sale **por WhatsApp ya escrita**; Cristina o Roberto confirman y mandan el anticipo. |
| Productos | Aviso de catálogo próximo y botón para preguntar por WhatsApp. |
| Mi Club | Reglas del Club Cristina Borquez: cómo se juntan puntos, niveles, descuentos, canje y cortesías. |

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

## Lo que sigue (fases de la propuesta)

- **Fase 3 · API y cuenta de la clienta**: Cloudflare Workers que leen CB Control (Dexie Cloud por REST); entrar con
  el teléfono; tarjeta del Club con puntos, nivel y saldo; catálogo de productos; la solicitud de cita llega directo
  a CB Control para que Cristina o Roberto la confirmen.
- **Fase 4 · Notificaciones y Play**: recordatorios de cita, anticipo y campañas; publicación en Google Play.
