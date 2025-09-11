# Salón Control App

Una aplicación web completa para la gestión integral de un salón de belleza.

## 🌟 Características

- ✅ **Gestión de Citas**: Programar, editar y administrar citas con estados
- ✅ **Registro de Ventas**: Control completo de ventas y pagos con múltiples métodos
- ✅ **Inventario**: Gestión de productos con alertas de stock bajo
- ✅ **Clientes**: Base de datos completa con recordatorios de cumpleaños
- ✅ **Servicios y Precios**: Catálogo personalizable con categorías
- ✅ **Reportes**: Análisis y gráficos detallados con métricas de negocio
- ✅ **100% Responsivo**: Optimizado para web, tablet y móviles
- ✅ **Persistencia de Datos**: Usa localStorage del navegador
- ✅ **Interfaz Intuitiva**: Diseño moderno con Tailwind CSS

## 🛠 Tecnologías

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **Navegación**: React Router DOM
- **Build Tool**: Vite
- **Linting**: ESLint + TypeScript

## 📋 Requisitos Previos

- Node.js 16.0 o superior
- npm o yarn

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd salon_control_app
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abre tu navegador**
   - Ve a `http://localhost:3000`

## 📜 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo con hot reload
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción
- `npm run lint` - Revisar código con ESLint

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables (futuro)
├── pages/              # Páginas principales de la app
│   ├── CitasPage.tsx   # Gestión de citas
│   ├── VentasPage.tsx  # Registro de ventas
│   ├── InventarioPage.tsx # Control de inventario
│   ├── ClientesPage.tsx # Base de datos de clientes
│   ├── PreciosPage.tsx # Lista de servicios
│   └── ReportesPage.tsx # Análisis y reportes
├── hooks/              # Custom hooks
│   └── useInitializeData.ts # Inicialización de datos
├── services/           # Servicios externos
│   ├── emailService.tsx # Servicio de emails
│   ├── googleCalendar.tsx # Integración Google Calendar
│   └── whatsappService.ts # Servicio WhatsApp
├── data/              # Datos iniciales
│   └── servicios_dataset.json # Servicios predefinidos
├── App.tsx            # Componente principal
├── App.css            # Estilos globales
└── main.tsx           # Punto de entrada
```

## 🎯 Funcionalidades Detalladas

### 📅 Gestión de Citas
- **CRUD completo**: Crear, leer, actualizar y eliminar citas
- **Estados múltiples**: Pendiente, confirmada, completada, cancelada
- **Filtros avanzados**: Por fecha, cliente, servicio y estado
- **Vista adaptativa**: Tabla en desktop, tarjetas en móvil
- **Validación**: Campos obligatorios y fechas futuras

### 💰 Registro de Ventas
- **Transacciones completas**: Precio total, anticipos y saldos
- **Métodos de pago**: Efectivo, tarjeta, transferencia
- **Cálculos automáticos**: Saldos pendientes calculados automáticamente
- **Autocompletado**: Precios se llenan automáticamente desde servicios
- **Métricas en tiempo real**: Totales de ingresos, anticipos y saldos

### 📦 Control de Inventario
- **Gestión de stock**: Cantidades actuales y mínimas
- **Alertas inteligentes**: Productos con stock bajo resaltados
- **Categorización**: Shampoo, tinte, tratamiento, herramientas, otros
- **Proveedores**: Registro de proveedores y fechas de vencimiento
- **Edición in-line**: Cambiar cantidades directamente en la tabla

### 👥 Base de Datos de Clientes
- **Perfiles completos**: Nombre, contacto, cumpleaños
- **Recordatorios**: Cumpleaños próximos destacados automáticamente
- **Sistema de notas**: Comentarios y preferencias por cliente
- **Estados**: Marcado de clientes en riesgo de baja
- **Datos de contacto**: Email y teléfono para comunicación

### ✂️ Servicios y Precios
- **Catálogo dinámico**: Lista completa de servicios
- **Categorías**: Corte, color, tratamiento, peinado, otros
- **Precios flexibles**: Edición de precios directa en la tabla
- **Anticipos**: Configuración de anticipos por servicio
- **Duración**: Tiempo estimado por servicio
- **Descripciones**: Detalles de cada servicio

### 📊 Reportes y Análisis
- **Gráficos interactivos**: Visualizaciones con Recharts
- **Métricas clave**: Ingresos, ventas, clientes únicos, citas completadas
- **Análisis temporal**: Filtros por fecha personalizables
- **Servicios populares**: Ranking de servicios más solicitados
- **Métodos de pago**: Distribución por tipo de pago
- **Exportación**: Datos descargables en formato CSV

## 🎨 Características de UX/UI

### 📱 Diseño Responsivo
- **Mobile First**: Diseñado primero para móviles
- **Breakpoints inteligentes**: Adaptación automática según dispositivo
- **Touch Friendly**: Botones y controles optimizados para touch
- **Navegación móvil**: Menú hamburguesa en pantallas pequeñas

### 🎯 Usabilidad
- **Estados visuales**: Colores y iconos intuitivos para cada estado
- **Feedback inmediato**: Confirmaciones y validaciones en tiempo real
- **Filtros inteligentes**: Búsqueda y filtrado instantáneo
- **Acciones rápidas**: Edición y eliminación con un clic
- **Formularios inteligentes**: Autocompletado y validación

### 🚀 Performance
- **Carga rápida**: Optimizado con Vite
- **Componentes eficientes**: Re-renders mínimos con useMemo
- **Bundle optimizado**: Código dividido y tree-shaking
- **Imágenes optimizadas**: SVG icons para mejor rendimiento

## 🔧 Configuración Opcional de Servicios

### 📧 Configuración de Email (Opcional)
Para habilitar recordatorios automáticos por email, configura las variables de entorno:

**EmailJS (Gratuito):**
```env
REACT_APP_EMAILJS_SERVICE_ID=tu_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=tu_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=tu_public_key
```

**Resend API (Profesional):**
```env
REACT_APP_RESEND_API_KEY=tu_api_key
REACT_APP_EMAIL_FROM=noreply@tusalon.com
```

### 📅 Google Calendar (Opcional)
Para sincronizar citas con Google Calendar:

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Calendar API
3. Configurar OAuth 2.0
4. Agregar variables:
```env
REACT_APP_GOOGLE_CLIENT_ID=tu_client_id
REACT_APP_GOOGLE_API_KEY=tu_api_key
```

### 📱 WhatsApp (Opcional)
Para enviar recordatorios por WhatsApp:

**Twilio:**
```env
REACT_APP_TWILIO_ACCOUNT_SID=tu_account_sid
REACT_APP_TWILIO_AUTH_TOKEN=tu_auth_token
REACT_APP_TWILIO_WHATSAPP_NUMBER=+14155238886
```

**WhatsApp Business API:**
```env
REACT_APP_WHATSAPP_BUSINESS_TOKEN=tu_access_token
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
```

## 🚀 Deployment

### Build para Producción
```bash
npm run build
```

### Deploy en Netlify
1. Conecta tu repositorio en [Netlify](https://netlify.com)
2. Configura las variables de entorno en el panel
3. Deploy automático en cada push

### Deploy en Vercel
1. Conecta tu repositorio en [Vercel](https://vercel.com)
2. Configura las variables de entorno
3. Deploy automático

### Deploy en Servidor Propio
1. Ejecuta `npm run build`
2. Sube el contenido de `dist/` a tu servidor web
3. Configura el servidor para servir archivos estáticos

## 🗂 Datos Iniciales

La aplicación viene con datos de ejemplo para probar todas las funcionalidades:

- **Servicios**: 6 servicios predefinidos con precios y categorías
- **Clientes**: 3 clientes de ejemplo con datos completos
- **Citas**: Citas de ejemplo para hoy y próximos días
- **Ventas**: Historial de ventas de ejemplo con diferentes métodos de pago
- **Inventario**: Productos de ejemplo con diferentes niveles de stock

## 🔄 Gestión de Estado

- **localStorage**: Persistencia automática de todos los datos
- **React State**: Estado local sincronizado con localStorage
- **Inicialización automática**: Datos de ejemplo se cargan la primera vez
- **Sincronización**: Cambios se guardan automáticamente

## 🎨 Personalización

### Colores
Los colores principales se pueden cambiar en `tailwind.config.js`:
```javascript
colors: {
  purple: { /* Tu paleta personalizada */ }
}
```

### Datos Iniciales
Modifica `src/data/servicios_dataset.json` para cambiar los servicios predefinidos.

### Componentes
Todos los componentes están en `src/pages/` y son fácilmente personalizables.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- Abre un [issue](https://github.com/tu-usuario/salon-control-app/issues)
- Revisa la documentación en el código
- Contacta al desarrollador

## 🔮 Roadmap

### Próximas Características
- [ ] Notificaciones push
- [ ] Modo offline con Service Workers
- [ ] Importación/exportación de datos
- [ ] Tema oscuro
- [ ] Múltiples idiomas
- [ ] Integración con sistemas de pago
- [ ] Aplicación móvil nativa
- [ ] Base de datos en la nube

### Mejoras Técnicas
- [ ] Tests unitarios con Jest
- [ ] Tests e2e con Cypress
- [ ] CI/CD pipeline
- [ ] Documentación con Storybook
- [ ] PWA (Progressive Web App)

---

**¡Gracias por usar Salón Control App!** 💄✨

Si encuentras útil este proyecto, no olvides darle una ⭐ en GitHub.