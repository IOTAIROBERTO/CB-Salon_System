# Cristina Borquez Beauty Salon · Ficha de producto del sistema

**CB Control** (gestión interna del salón) + **App de clientas** (reservas, Club y consentimientos) + servidor ligero de
automatización. Estado al **28 de octubre de 2026**, revisado contra el código del repositorio.

Sirve de base para compararlo con las apps de salones mejor valoradas en México. Al final hay una
[matriz de comparación](#8-matriz-para-comparar-con-otras-apps) lista para llenar.

---

## Índice

1. [Resumen en una página](#1-resumen-en-una-página)
2. [Cómo está armado](#2-cómo-está-armado-sin-tecnicismos)
3. [CB Control: para qué sirve y qué hace](#3-cb-control-para-qué-sirve-y-qué-hace)
4. [App de clientas: para qué sirve y qué hace](#4-app-de-clientas-para-qué-sirve-y-qué-hace)
5. [Automatización (servidor)](#5-automatización-servidor)
6. [Procesos paso a paso](#6-procesos-paso-a-paso)
7. [Qué está en producción y qué falta](#7-qué-está-en-producción-y-qué-falta)
8. [Matriz para comparar con otras apps](#8-matriz-para-comparar-con-otras-apps)

---

## 1. Resumen en una página

| | CB Control | App de clientas |
|---|---|---|
| **Para quién** | Cristina (dueña), Roberto y auxiliares | Clientas actuales y nuevas |
| **Para qué** | Operar todo el salón: agenda, cobros, inventario, clientas, Club, equipo, gastos y reportes | Pedir cita con horarios reales, unirse al Club, ver sus puntos y firmar el consentimiento desde el celular |
| **Dirección** | https://cb-control.pages.dev | https://cristinaborquez-app.pages.dev (dominio propio pendiente) |
| **Cómo se usa** | Navegador en computadora, tableta o celular. Entra con código al correo | App web instalable (PWA) desde el navegador, sin tienda. No pide cuenta para agendar |
| **Datos** | En la nube (Dexie Cloud), con copia local: funciona sin internet y sube los cambios al volver | Lee y escribe en la misma base de CB Control a través de la API |
| **Tiempo real** | Lo que hacen las clientas llega al instante a la campana | Catálogo, horarios, reglas del Club y menú del break se refrescan solos (al abrir, al volver y cada minuto) |

**Lo que lo distingue** (frente a una app genérica de reservas):

- **Agenda que entiende el color**: cada servicio tiene tiempo activo, tiempo de **proceso** (el tinte actuando) y
  tiempo de cierre. Mientras el tinte actúa, Cristina puede empezar otra clienta. Las apps genéricas bloquean todo el
  servicio.
- **Proceso de valoración antes de confirmar**: la clienta manda fotos y respuestas sobre su cabello; Cristina fija
  precio y anticipo *antes* de confirmar. Todos los precios son «desde».
- **Google Calendar de Cristina en tiempo real**: lo ocupado en su calendario personal no se ofrece a las clientas, y
  las citas de CB Control se copian a su calendario cada minuto.
- **Club de lealtad propio de 5 niveles** con puntos, regalos, celebraciones, recomendadas, saldo a favor y tarjetas de
  regalo, integrado al cobro.
- **Consentimiento informado digital** con firma en el celular y constancia (fecha, dispositivo y huella).
- **Costo de plataforma casi cero**: planes gratis de Cloudflare y Dexie Cloud; sin comisión por reserva ni mensualidad
  de software.

---

## 2. Cómo está armado (sin tecnicismos)

```
 Clientas                         Salón
 ────────                         ─────
 App de clientas (PWA)            CB Control (navegador)
        │                                 │
        ▼                                 ▼
  API /api (Cloudflare) ──────►  Base de datos en la nube (Dexie Cloud)  ◄── sincroniza ── copia local
        │                                 ▲
        ▼                                 │
  Google Calendar de Cristina ◄── Worker «cb-avisos» (cada minuto / cada 10 min) ──► WhatsApp oficial (pendiente)
```

- **Una sola base de datos** para todo: lo que se edita en CB Control (precios, horario, reglas del Club, menú) es lo
  que ve la clienta, sin copiar nada a mano.
- **Indicador de sincronización** junto a la campana de CB Control: «Todo está en la nube», «Subiendo cambios…» o
  «Sin internet».
- **Roles**: *Dueña* (todo) y *Empleada* (sin Reportes ni Configuración; no puede usar saldo a favor ni canjear puntos;
  solo consulta los datos del equipo).
- **Seguridad de la app de clientas**: «No soy robot» (Cloudflare Turnstile) encendido; topes de solicitudes por
  teléfono y por día; códigos por WhatsApp de un solo uso con límites de intentos; la API nunca modifica una ficha
  existente sin que la clienta confirme su teléfono.

---

## 3. CB Control: para qué sirve y qué hace

**Para qué sirve:** es el sistema de gestión del salón. Sustituye la libreta, el Excel y los recordatorios sueltos:
agenda con disponibilidad real, cobro con desglose, inventario y proveedores, fichas de clientas con consentimientos,
programa de lealtad, pago al equipo, gastos y reportes. Todo con la identidad de marca (negro, dorado y marfil).

El menú está agrupado como se trabaja en el salón: **Agenda · Ventas · Clientas · Salón**.

### 3.1 Agenda

**Citas**
- Lista con las activas primero (por fecha y hora) y las cerradas después; búsqueda por clienta o servicio.
- Indicadores: citas pendientes, en proceso, saldos por cobrar y anticipos sin pagar.
- Estados: *pendiente → confirmada → iniciada → completada* (o *cancelada*).
- **Nueva cita**: clienta, servicio, quién atiende (una o varias personas; la comisión se reparte), horarios libres
  calculados por el motor de agenda o una hora manual, anticipo, descripción del trabajo («raíz 3 cm + matiz…») y
  notas. En CB Control se puede agendar cualquier hora futura, incluso fuera de las reglas que aplican a clientas (con
  aviso si choca).
- En cada cita: indicador de **cumpleaños**, **nota de reserva por WhatsApp** (fecha, servicio, precio «desde»,
  anticipo, política de 48 h y cómo llegar), **consentimiento** (imprimir prellenado o pedir la firma en la app),
  editar, reagendar y eliminar.
- **Reagendar**: elige nueva fecha, hora y quién atiende, y arma el WhatsApp para proponerle el cambio a la clienta.
- **Cobro** (finalizar la cita): cambiar el servicio, agregar servicios adicionales, descuento manual (0–50 %) o del
  Club (nivel o amiga recomendada), regalos del Club como cortesía, saldo a favor, **usar los puntos en ese mismo
  cobro**, redondeo a decena, propina, método de pago (efectivo, tarjeta, transferencia, mixto o saldo a favor),
  desglose de comisiones por persona y descripción de lo que se trabajó.
- **«De Google, sin registrar»** (solo dueña): eventos con hora que Cristina apuntó a mano en su Google Calendar.
  «Registrar como cita» la crea ya llena (sin duplicar el evento); «Es personal» lo esconde.
- Pestaña **Calendario de Google**: el calendario de Cristina incrustado dentro de Citas.

**Calendario**
- Vista **mes**: citas por color de estado, vacaciones, días inhábiles y apoyo del equipo, y «G Ocupado» de Google.
- Vista **día**: agenda por persona en franjas; el tiempo de proceso se ve rayado (se puede agendar otra clienta), el
  gris es descanso o bloqueo. Clic en una cita para moverla.

**Campana (Bandeja de avisos)**
- Llega en tiempo real lo que hacen las clientas solas: solicitudes de cita, altas al Club, consentimientos firmados.
- Notificación del navegador por cada aviso nuevo.
- Lista fija **«Por confirmar · desde la app»**: las solicitudes no vencen solas; se quedan hasta que alguien las
  valore, confirme o cancele.
- **Valorar solicitud**: ver las fotos y respuestas del cabello, fijar el precio acordado y el anticipo con su forma de
  pago (transferencia, depósito en banco u OXXO, en el salón, incluido o sin anticipo), mandar el WhatsApp ya escrito
  con los datos de pago y confirmar. Con transferencia o depósito no se confirma sin marcar «anticipo recibido».

### 3.2 Ventas

**Ventas**
- Registrar venta de productos a una clienta, con quién vendió y método de pago. El descuento por nivel del Club se
  aplica solo (los productos del break tienen su propia escala).
- Totales: número de ventas, ingresos y promedio por venta. Búsqueda por clienta.
- **Tarjetas de regalo**: se venden con folio impreso y monto; cuentan como ingreso el día de la venta. La clienta
  tiene 6 meses para activarla y, ya activada, es saldo a favor que no vence.

**Inventario**
- **Productos**: stock, stock mínimo, costo y precio (margen), categoría y proveedor. Alertas de stock bajo y de precio
  por debajo del costo (pérdida). Movimientos de entrada y salida con motivo (compra, devolución, ajuste, venta, uso
  interno, pérdida, vencimiento).
- **Proveedores**: contacto, WhatsApp, web, qué venden, días de crédito, calificación 1–10, productos ligados y «lo
  que más le compro» en 12 meses.
- **Compras**: al registrar una compra sube el stock, se actualiza el costo de cada producto y, si se pide, queda
  anotada en Gastos. Resumen del mes, de 12 meses y lo **por pagar a proveedores**.

**Catálogo**
- Servicios con precio y anticipo («desde»), categoría, comisión, duración, tiempo de proceso y tiempo de cierre.
- Dos textos separados: **descripción para la app** («Más info» que ve la clienta) y **notas internas** (nunca salen
  del salón).
- **Listas de precios por año**: al cerrar una lista queda como histórica de solo consulta y se abre la del año
  siguiente con los mismos precios para ajustarlos.
- **Cotizador de servicios fuera de Hermosillo**: zonas editables (km, días, mínimo de clientas, anticipación),
  traslado, viáticos y hospedaje; arma la cotización para pegarla en WhatsApp con anticipo del 30 %.

### 3.3 Clientas

**Clientes**
- Ficha: nombre, teléfono, correo, cumpleaños, comentarios (preferencias, alergias), activa/inactiva. Aviso de ficha
  repetida (mismo nombre o teléfono).
- Vista de tabla o tarjetas, estadísticas y **banner de cumpleañeras** (hoy y este mes).
- **Consentimientos** en la ficha: firmados en la app o registrados en papel con foto; permisos de fotos (sí/no) y de
  redes (con rostro, sin rostro, no). Sin consentimiento, sus fotos no se publican.
- **Saldo a favor**: activar tarjeta de regalo por folio o abonar (pedido no recogido, ajuste). Se usa en el cobro.

**Club** (programa de lealtad «Club Cristina Borquez»)
- Reglas editables por la dueña (con «valores sugeridos»): puntos por peso, umbrales de nivel, multiplicadores,
  bonos, descuento por recomendada, inactividad, aniversario, constancia.
- Lista de clientas por nivel, puntos, lo que les falta para el siguiente nivel y lo que pueden canjear.
- Tarjeta de cada clienta con código (lector de tarjeta o búsqueda): beneficios disponibles, canje por beneficio, por
  saldo a favor o por tarjeta de regalo, movimientos de puntos e historial de canjes, y WhatsApp con su saldo.
- Las reglas completas están en [4.3 Mi Club](#43-mi-club).

**Campañas** (correo)
- Campañas por correo con plantillas (promoción, recordatorio, cumpleaños), filtro de destinatarias (todas, activas,
  nuevas de 30 días o selección manual).
- Automatizaciones: felicitación de cumpleaños, bienvenida a clienta nueva, reactivación por días sin visita,
  seguimiento después de la visita (por ejemplo, pedir reseña) y recordatorio de cita.
- Usa EmailJS desde el navegador; sin EmailJS configurado trabaja en **modo simulación** (no salen correos).

### 3.4 Salón

**Equipo**
- Fichas del equipo: especialidad, cumpleaños, comisión %, **pago por hora**, **bono por cita apoyada** (por
  categoría de servicio), si toma citas propias y qué categorías atiende, y su Google Calendar.
- Calendario de trabajo: vacaciones, día inhábil, horario especial y **día de apoyo con horas** (para el pago). Las
  vacaciones bloquean su agenda sola.
- **Pago por horas** con recibo imprimible («Recibí de conformidad») y ganancias por rango de fechas (comisiones de
  citas y ventas, calculadas sobre lo cobrado con descuento, sin propina).

**Gastos**: fijos (recurrentes) y variables, pagado o pendiente, total del mes.

**Documentos**
- **Formatos del salón** listos para imprimir (17): consentimiento informado, autorización de imagen, aviso de
  privacidad, tarjeta de cuidados en casa, ficha de clienta, entrada de mercancía, corte de caja, nota de venta,
  apertura y cierre, tiempos por servicio, acuerdo por horas, registro de horas, recibo de pago, notas de
  capacitación (2), ficha técnica de color y lista de precios vigente (para exhibir, PROFECO).
- Archivos y notas propios (se guardan solo en ese dispositivo).

**Galería**: página pública con los trabajos del salón, sin inicio de sesión, para compartir por WhatsApp, Google e
Instagram. Hay también una página pública de **reseñas** que invita a calificar en Google.

**Reportes** (solo dueña): ingresos brutos (servicios + productos), gastos, ganancia neta, ingresos por servicios y
por productos, saldos por cobrar, gráfica por periodo, historial de citas completadas y canceladas con su desglose, y
exportar a CSV.

**Configuración** (solo dueña)
- **General**: datos del salón y **datos para el anticipo** (se pegan en el WhatsApp al valorar).
- **Agenda**: horario por día con descanso, margen entre citas, anticipación mínima y días máximos para clientas,
  reglas de **trabajos largos** (no se ofrecen tarde), quién atiende y **bloqueos** (cursos, citas personales,
  vacaciones del salón).
- **Equipo**: invitar por correo y elegir rol (dueña o empleada).
- **Google Calendar**, **WhatsApp** y **correo**: estado de cada integración.
- **Datos y respaldos**: respaldo automático diario a una carpeta, copia manual y restaurar.

---

## 4. App de clientas: para qué sirve y qué hace

**Para qué sirve:** que una clienta agende sola a cualquier hora con horarios reales, sin esperar respuesta por
WhatsApp, y que el salón reciba la solicitud ya con fotos y datos para valorar. Además, une a las clientas al Club,
les muestra sus puntos y les deja firmar el consentimiento desde su celular.

**Cómo se instala:** desde el navegador («Agregar a pantalla de inicio»). La app guía: botón «Instalar» en Android,
pasos para iPhone y «ábrela en tu navegador» si viene de Instagram o Facebook. Se actualiza sola. **No está en Google
Play ni App Store** (decisión del 27 de octubre de 2026). En computadora se ve a pantalla completa.

### 4.1 Inicio
Logo y lema, botón **Agendar mi cita**, trabajos del salón, invitación al Club, cómo llegar (mapa), horario, WhatsApp,
Instagram y Facebook. Horario y datos salen en vivo de CB Control.

### 4.2 Agendar (2 pasos, sin cuenta)
1. **Servicio**: catálogo en vivo con precios «desde» y «Más info» de cada servicio. Si no sabe cuál pedir, elige el
   más parecido y Cristina le dice cuál necesita.
2. **Día, hora y datos**: días y horas libres en tiempo real de las **próximas dos semanas** (agenda de CB Control +
   ocupado en el Google Calendar de Cristina). En servicios de color: largo, color actual, químicos recientes, qué
   busca y **hasta 4 fotos** del cabello. Nombre, teléfono (WhatsApp), notas, cumpleaños opcional y casilla para
   unirse al Club.
- Muestra las **políticas de reserva** antes de enviar: la solicitud aparta el horario, los precios son «desde», el
  anticipo se acuerda después (en la app no se cobra nada), 48 h para cambios y citas del mismo día solo por WhatsApp.
- Al enviar: **«Solicitud recibida»** y botón **«Avisar a Cristina por WhatsApp»** con el mensaje ya escrito.
- Si el horario se ocupó mientras llenaba, se actualizan los libres. Si la API falla, ofrece WhatsApp.

### 4.3 Mi Club
- **Reglas del Club** explicadas para clientas, en vivo desde CB Control.
- **Únete al Club**: alta gratis con nombre, teléfono, cumpleaños y teléfono de la amiga que la recomendó.
- **Mi tarjeta**: entra con su teléfono y un código por WhatsApp; ve puntos, nivel, saldo en pesos, regalos
  disponibles, próximas citas, últimos puntos y consentimientos por firmar. *Se activa cuando el WhatsApp oficial esté
  conectado.*

**Reglas actuales del Club** (valores sugeridos; la dueña puede ajustarlos; el programa arranca en limpio el 1 de enero
de 2027):

| Concepto | Regla |
|---|---|
| Niveles | Marfil (0) · Miel (150) · Ámbar (500) · Dorado (1,000) · Ónix (1,700) puntos |
| Cómo se mide el nivel | Puntos disponibles, contando solo los ganados en los últimos 12 meses. Gastar puntos baja el nivel |
| Ganar puntos | 1 punto por cada $10 en servicios y por cada $5 en productos, × multiplicador del nivel (1 a 1.3) |
| Puntos dobles | Mes de cumpleaños y martes/miércoles (no se acumulan entre sí) |
| Bonos | Bienvenida 100 (+100 si llegó recomendada), reserva en línea 40, aniversario 100–300 según nivel |
| Amiga recomendada | Si la amiga paga diseño de color o maquillaje: 20 % en la próxima cita (tope $600); otro servicio: 200 puntos |
| Beneficios permanentes | Descuentos crecientes en productos (hasta 10 %), maquillaje social (hasta 15 %), corte y peinado (hasta 15 %), comida del break (hasta 15 %), flequillo mensual desde Ámbar, antojo y bebida mensual en Ónix |
| Regalo de nivel | Uno por nivel, cuesta puntos y se renueva a los 12 meses: ampolleta, mascarilla, corte, corte + ampolleta |
| Canje | Puntos valen dinero en todos los niveles ($0.25 por punto, mínimo 200): saldo a favor o tarjeta de regalo (vale más desde Ámbar) |
| Inactividad | Pierde 5 % de puntos a los 75 días sin visita, 7 % a los 90 y 12 % cada 30 días más (Dorado y Ónix, 15 días más de gracia) |
| Cortesía para todas | Café, té caliente y agua |

### 4.4 Break
Menú del break con fotos y precios en vivo del Inventario; café, té y agua de cortesía; descuento del Club en la
comida. Productos para el cabello: «próximamente» (por ahora se preguntan por WhatsApp).

### 4.5 Firmar consentimiento (`#/firmar/<enlace>`)
Con el enlace personal que manda el salón (WhatsApp o QR): datos, historial y salud, condiciones del servicio,
autorizaciones (fotos y redes), aviso de privacidad, tutor si es menor y **firma con el dedo**. No pide cuenta. Guarda
fecha, hora, dispositivo y una huella del documento como constancia. El enlace vence en 7 días y sirve una vez.

---

## 5. Automatización (servidor)

| Pieza | Qué hace | Estado |
|---|---|---|
| **API `/api`** | Catálogo, datos del salón, disponibilidad, crear cita, alta al Club, código de acceso, mi Club, firma | En producción |
| **Disponibilidad** | Mismo motor de agenda que CB Control + ocupado de Google consultado en cada petición | En producción |
| **Espejo a Google** (cada minuto) | Copia citas activas, vacaciones y apoyo del equipo al calendario de quien atiende; borra lo cancelado; solo escribe lo que cambió | En producción |
| **Ocupado de Google → CB Control** (cada minuto) | Lo ocupado de los próximos 180 días bloquea la agenda de CB Control | En producción |
| **Eventos de Google sin registrar** | Trae lo que Cristina apuntó a mano para registrarlo como cita | En producción |
| **WhatsApp a clientas** (cada 10 min) | «Recibimos tu solicitud», «cita confirmada» y recordatorio del día anterior | Programado; **espera el WhatsApp oficial** |
| **WhatsApp al salón** | Avisos de solicitudes y recordatorio cada 4 h (9–21 h) de las que siguen sin confirmar | Programado; **espera el WhatsApp oficial** |
| **Código por WhatsApp** | Entrar a Mi tarjeta y confirmar el teléfono antes de apartar | Programado; **espera el WhatsApp oficial** |
| **Anti-spam** | Turnstile, máximo de solicitudes pendientes por teléfono y por día, límites de códigos e intentos | En producción |

Mientras no hay WhatsApp oficial, los mensajes salen **a mano con un clic** (WhatsApp Web con el texto ya escrito)
desde la campana, Valorar, la cita y el Club.

---

## 6. Procesos paso a paso

### 6.1 La clienta agenda desde la app (proceso estándar)
1. La clienta elige servicio, día y hora libres, contesta las preguntas del cabello y sube fotos (servicios de color).
2. La API revisa «no soy robot» y los topes, y **aparta el horario** con la cita en estado *pendiente* (origen app).
   No se puede pedir cita para el mismo día.
3. En CB Control suena la **campana** y la solicitud queda fija en «Por confirmar».
4. La clienta puede tocar «Avisar a Cristina por WhatsApp».
5. Cristina abre **Valorar**: ve fotos y respuestas, fija el **precio acordado** y el **anticipo** con su forma de pago.
6. Manda el **WhatsApp ya escrito** (precio, anticipo y datos de pago, o «se paga en el salón», y política de 48 h).
7. Con transferencia o depósito, espera el comprobante, marca **«Ya recibimos el anticipo»** y **confirma**. Con pago
   en el salón, incluido o sin anticipo, confirma de una vez.
8. *(Con WhatsApp oficial)* la clienta recibe la confirmación automática y el **recordatorio el día anterior**.
9. Si nadie la confirma, sigue en «Por confirmar» (no vence sola) y *(con WhatsApp oficial)* el salón recibe
   recordatorios cada 4 h.

### 6.2 El salón agenda (WhatsApp, llamada o en persona)
1. Citas → **Nueva cita**: clienta (o se crea la ficha), servicio, quién atiende y horario libre o manual.
2. Anticipo sugerido del catálogo; se marca confirmado cuando llega.
3. **Nota de reserva por WhatsApp** desde la cita.
4. La cita aparece en el Google Calendar de quien atiende en menos de un minuto.

### 6.3 Cita apuntada a mano en Google Calendar
1. Cristina apunta un evento con hora en su Google Calendar (con prisa, sin abrir CB Control).
2. Al minuto, en Citas aparece «De Google, sin registrar» (solo dueña).
3. **Registrar como cita** (ya llena con fecha, hora y título; el evento se adopta, no se duplica) o **Es personal**.

### 6.4 Día de la cita
1. Si es servicio químico: **consentimiento** (enlace a la app por WhatsApp o QR; sin celular, formato impreso
   prellenado y foto del firmado en la ficha).
2. La cita pasa a *iniciada*.
3. **Cobro**: ajustar servicio, adicionales y descuentos; aplicar beneficios del Club, saldo a favor o puntos; redondeo,
   propina y método de pago; descripción del trabajo. Se reparten las comisiones.
4. La cita queda *completada*; los puntos del Club se recalculan solos desde lo cobrado.

### 6.5 Cambios y cancelaciones
- **Reagendar** desde la cita (o moverla en la agenda del día) y mandar el WhatsApp con la propuesta.
- Política: cambios o cancelaciones con **al menos 48 h** conservan el anticipo; con menos, o si no llega, se pierde.
- Al cancelar o borrar, la cita sale sola de Google Calendar.

### 6.6 Consentimiento informado
1. Desde la cita (ícono de celular) o la ficha: **Firma en la app** → QR, WhatsApp o copiar enlace.
2. La clienta firma en su celular; llega un aviso a la campana y queda en su ficha con sus permisos de fotos y redes.
3. Alternativa en papel: imprimir prellenado y guardar la foto del formato firmado.

### 6.7 Alta y uso del Club
1. Alta: en la app («Únete al Club» o casilla al agendar) o en el salón (ficha). Desde la app, la API crea la ficha
   nueva y avisa; si el teléfono ya existe, el cambio queda como nota para el salón.
2. Puntos: se calculan solos con cada cita cobrada y cada venta (con multiplicadores y dobles).
3. Canje (solo dueña): en el cobro o en Club → beneficio, saldo a favor o tarjeta de regalo.
4. La clienta consulta su tarjeta en la app *(cuando haya WhatsApp oficial)* o recibe su saldo por WhatsApp.

### 6.8 Venta de producto o del break
Ventas → Registrar venta → clienta, productos, quién vende, método de pago. Descuento del nivel automático, baja el
stock y suma puntos.

### 6.9 Tarjetas de regalo y saldo a favor
1. Ventas → Tarjetas de regalo: folio impreso, monto, quién compra y método de pago (ingreso del día).
2. La clienta la activa en su ficha (por folio) dentro de 6 meses: se vuelve saldo a favor que no vence.
3. Pedidos pagados no recogidos en 10 días también pasan a saldo a favor.
4. El saldo se usa en el cobro como anticipo o pago total o parcial.

### 6.10 Compras e inventario
1. Inventario → Compras → Registrar compra: proveedor, folio, productos, piezas y costo.
2. Sube el stock, actualiza el costo y, si se marca, se anota en Gastos (pagada o con crédito del proveedor).
3. Alertas de stock bajo y de productos vendidos por debajo del costo.

### 6.11 Equipo y pago
1. Equipo: pago por hora, bonos por cita apoyada y categorías que atiende.
2. Calendario de trabajo: días de apoyo con horas, vacaciones e inhábiles (bloquean su agenda).
3. Pagos: suma horas + bonos del periodo e imprime el **recibo de pago**.

### 6.12 Gastos, reportes y respaldos
- Gastos fijos y variables se anotan al pagarlos (o vienen de las compras).
- Reportes: ingresos, gastos y ganancia neta del periodo; exportar CSV.
- Respaldo automático diario a una carpeta de la computadora donde se configure, además de la nube.

### 6.13 Campañas por correo
Plantillas → campaña con filtro de destinatarias → enviar. Las automatizaciones (cumpleaños, nueva clienta,
reactivación, post-visita, recordatorio) se revisan al abrir CB Control y cada 12 h, con un lote por regla al día.

### 6.14 Servicios fuera de Hermosillo
Catálogo → Cotizador: zona, número de clientas y servicios → traslado, viáticos y hospedaje → cotización copiada para
WhatsApp con anticipo del 30 % y días mínimos de anticipación.

---

## 7. Qué está en producción y qué falta

**En producción**
- CB Control completo (secciones 3.1 a 3.4) con nube, roles y trabajo sin internet.
- App de clientas: Inicio, Agendar con horarios en tiempo real, Únete al Club, reglas del Club, Break y Firmar.
- Google Calendar en ambos sentidos, campana en tiempo real, valoración y anti-spam.

**Pendiente**
| Pendiente | Qué destraba |
|---|---|
| **WhatsApp oficial** (número y token de Meta) | Confirmaciones y recordatorios automáticos, código de acceso, Mi tarjeta del Club, avisos al salón por WhatsApp |
| **Pagos en línea** (Mercado Pago, también OXXO) | Cobrar el anticipo dentro de la app y confirmar sola la cita al pagar |
| **Dominio** `cristinaborquez.com` | Direcciones propias (app.cristinaborquez.com) |
| **Catálogo de productos en la app** | Ver y apartar productos (hoy por WhatsApp) |
| **CB Control instalable en celular con notificaciones push** | Avisos al equipo aunque CB Control esté cerrado |
| **Correo (EmailJS)** | Que las campañas dejen de estar en simulación |
| **Arranque del Club** | Los puntos cuentan desde el 1 de enero de 2027 |

**No contemplado hoy** (útil para la comparación): facturación electrónica (CFDI), terminal de cobro integrada,
lista de espera, varias sucursales, presencia en un *marketplace* de salones, reseñas dentro de la app, SMS, paquetes
o membresías de pago, app en tiendas.

---

## 8. Matriz para comparar con otras apps

Columnas libres para las apps a comparar (por ejemplo, las más usadas por salones en México como AgendaPro, Fresha o
Booksy). Valores de CB: **Sí**, **Parcial** o **No**, con la nota que lo explica.

| Área | Criterio | CB Control + App | Nota CB | App A | App B | App C |
|---|---|---|---|---|---|---|
| **Reservas** | Reserva en línea 24/7 | Sí | Sin cuenta, horarios reales | | | |
| | Disponibilidad en tiempo real | Sí | Agenda + Google Calendar en cada consulta | | | |
| | Tiempos de proceso (tinte actuando) | Sí | Libera a quien atiende mientras actúa | | | |
| | Varias personas por cita / por colaboradora | Sí | Agenda por persona y categorías | | | |
| | Valoración con fotos antes de confirmar | Sí | Hasta 4 fotos y preguntas del cabello | | | |
| | Confirmación manual o automática | Manual | Por diseño: Cristina confirma todo | | | |
| | Anticipo en línea | No | Transferencia, depósito o en salón; Mercado Pago pendiente | | | |
| | Recordatorios automáticos | Parcial | Programados; esperan el WhatsApp oficial | | | |
| | Lista de espera | No | | | | |
| | Sincronización con Google Calendar | Sí | Dos sentidos, cada minuto | | | |
| | Reserva desde Instagram / Google | Parcial | Enlace a la app; sin integración nativa | | | |
| **Clientas** | Ficha con historial | Sí | Citas, ventas, saldo, consentimientos | | | |
| | Consentimiento digital con firma | Sí | Con constancia; papel con foto como respaldo | | | |
| | Fotos del antes/después con permisos | Parcial | Permisos sí; galería pública aparte | | | |
| | App propia para clientas | Sí | PWA con la marca, sin tienda | | | |
| **Lealtad** | Programa de puntos | Sí | 5 niveles, multiplicadores, inactividad | | | |
| | Recomendadas | Sí | Descuento o puntos | | | |
| | Tarjetas de regalo | Sí | Folio impreso; saldo que no vence | | | |
| | Saldo a favor / monedero | Sí | | | | |
| **Cobro** | Punto de venta de servicios y productos | Sí | Descuentos, propina, redondeo, mixto | | | |
| | Terminal o pagos integrados | No | | | | |
| | Facturación CFDI | No | | | | |
| | Comisiones automáticas | Sí | Repartidas entre quienes atienden | | | |
| **Inventario** | Stock, mínimos y alertas | Sí | | | | |
| | Proveedores y compras | Sí | Crédito, por pagar, calificación | | | |
| **Equipo** | Roles y permisos | Sí | Dueña / empleada | | | |
| | Pago por hora, bonos y recibos | Sí | | | | |
| | App del equipo con notificaciones | Parcial | Notificaciones con CB Control abierto | | | |
| **Marketing** | Campañas por correo | Parcial | En simulación sin EmailJS | | | |
| | Campañas por WhatsApp / SMS | Parcial | Mensajes uno a uno con un clic | | | |
| | Reseñas | Parcial | Página que lleva a Google | | | |
| | Presencia en marketplace | No | | | | |
| **Gestión** | Gastos y ganancia neta | Sí | | | | |
| | Reportes y exportar | Sí | CSV | | | |
| | Funciona sin internet | Sí | Sube al volver la conexión | | | |
| | Respaldos | Sí | Nube + copia diaria local | | | |
| | Varias sucursales | No | | | | |
| **Costo** | Mensualidad | $0 | Planes gratis (Dexie Cloud: hasta 3 usuarios) | | | |
| | Comisión por reserva | $0 | | | | |
| | WhatsApp | Por mensaje | Tarifas de Meta cuando se conecte | | | |
| **Marca** | Identidad propia del salón | Sí | Todo con la marca, sin logos de terceros | | | |
| | Personalización a la medida | Sí | Desarrollo propio | | | |
