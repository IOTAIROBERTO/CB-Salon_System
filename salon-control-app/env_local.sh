# =============================================================================
# CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA SALON CONTROL APP
# =============================================================================
# Copia este archivo a .env.local y completa las variables con tus credenciales

# -----------------------------------------------------------------------------
# GOOGLE CALENDAR INTEGRATION
# -----------------------------------------------------------------------------
# Para obtener estas credenciales:
# 1. Ve a Google Cloud Console: https://console.cloud.google.com/
# 2. Crea un nuevo proyecto o selecciona uno existente
# 3. Habilita la API de Google Calendar
# 4. Crea credenciales (OAuth 2.0 Client IDs)
# 5. Agrega tu dominio a los orígenes autorizados

REACT_APP_GOOGLE_CLIENT_ID=tu_google_client_id_aqui
REACT_APP_GOOGLE_API_KEY=tu_google_api_key_aqui

# -----------------------------------------------------------------------------
# EMAIL SERVICE - OPCIÓN 1: EMAILJS (Gratuito, fácil de configurar)
# -----------------------------------------------------------------------------
# Para obtener estas credenciales:
# 1. Regístrate en EmailJS: https://www.emailjs.com/
# 2. Crea un servicio de email (Gmail, Outlook, etc.)
# 3. Crea una plantilla de email
# 4. Obtén tu Service ID, Template ID y Public Key

REACT_APP_EMAILJS_SERVICE_ID=tu_emailjs_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=tu_emailjs_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=tu_emailjs_public_key

# -----------------------------------------------------------------------------
# EMAIL SERVICE - OPCIÓN 2: RESEND (Profesional, 100 emails gratis/mes)
# -----------------------------------------------------------------------------
# Para obtener estas credenciales:
# 1. Regístrate en Resend: https://resend.com/
# 2. Verifica tu dominio o usa el dominio de pruebas
# 3. Crea una API Key
# 4. Configura tu email remitente

REACT_APP_RESEND_API_KEY=tu_resend_api_key_aqui
REACT_APP_EMAIL_FROM=noreply@tudominio.com

# -----------------------------------------------------------------------------
# CONFIGURACIÓN ADICIONAL (Opcional)
# -----------------------------------------------------------------------------
# URL base para APIs personalizadas
REACT_APP_EMAIL_API_URL=https://tu-api-personalizada.com
REACT_APP_EMAIL_API_KEY=tu_api_key_personalizada

# =============================================================================
# INSTRUCCIONES DE INSTALACIÓN Y CONFIGURACIÓN
# =============================================================================

# 1. CONFIGURAR GOOGLE CALENDAR:
# ===============================
# - Ve a https://console.cloud.google.com/
# - Crea un proyecto nuevo llamado "salon-control-app"
# - Habilita la "Google Calendar API"
# - Ve a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth 2.0"
# - Tipo de aplicación: "Aplicación web"
# - Orígenes autorizados: http://localhost:3000, https://tudominio.com
# - Copia el Client ID a REACT_APP_GOOGLE_CLIENT_ID
# - Crea una "Clave de API" y cópiala a REACT_APP_GOOGLE_API_KEY

# 2. CONFIGURAR EMAILJS (Opción más fácil):
# =========================================
# - Regístrate en https://www.emailjs.com/
# - Conecta tu cuenta de Gmail/Outlook
# - Crea un servicio y copia el Service ID
# - Crea una plantilla con estas variables:
#   * {{to_email}} - Email del destinatario
#   * {{to_name}} - Nombre del cliente
#   * {{subject}} - Asunto del email
#   * {{message}} - Mensaje en texto plano
#   * {{html_message}} - Mensaje en HTML
# - Obtén tu Public Key desde la configuración

# 3. CONFIGURAR RESEND (Opción profesional):
# ==========================================
# - Regístrate en https://resend.com/
# - Verifica tu dominio (o usa onboarding@resend.dev para pruebas)
# - Crea una API Key en el dashboard
# - Configura el email remitente autorizado

# 4. INSTALACIÓN DE DEPENDENCIAS:
# ===============================
# npm install lucide-react  # (ya debería estar instalado)

# 5. ESTRUCTURA DE ARCHIVOS:
# ==========================
# Crea estas carpetas en tu proyecto:
# src/
#   services/
#     googleCalendar.ts
#     emailService.ts
#   pages/
#     CitasPage.tsx (actualizado)

# 6. CONFIGURACIÓN DE CORS Y DOMINIOS:
# ====================================
# Para Google Calendar:
# - Agrega http://localhost:3000 (desarrollo)
# - Agrega tu dominio de producción
# 
# Para EmailJS:
# - No requiere configuración adicional de CORS
# 
# Para Resend:
# - Configura SPF, DKIM records si usas tu propio dominio

# 7. PRUEBAS:
# ===========
# - Desarrollo: Las funciones funcionarán con credenciales de prueba
# - Producción: Verifica que todos los dominios estén autorizados
# - Emails: Revisa la carpeta de spam inicialmente

# 8. FUNCIONALIDADES:
# ==================
# ✅ Sincronización bidireccional con Google Calendar
# ✅ Emails automáticos de confirmación
# ✅ Recordatorios 24 horas antes
# ✅ Notificaciones de cambios de cita
# ✅ Plantillas de email profesionales
# ✅ Gestión de permisos y errores

# 9. TROUBLESHOOTING:
# ==================
# Error: "Google API not loaded"
# - Verifica que REACT_APP_GOOGLE_CLIENT_ID esté configurado
# - Revisa la consola del navegador para errores de CORS
# 
# Error: "Email service not configured"
# - Verifica que al menos EmailJS o Resend esté configurado
# - Revisa que las variables de entorno estén en .env.local
# 
# Los emails no llegan:
# - Revisa la carpeta de spam
# - Verifica que el dominio esté verificado (Resend)
# - Revisa los logs en EmailJS dashboard

# 10. SEGURIDAD:
# ==============
# - NUNCA commits el archivo .env.local
# - Usa variables de entorno en producción
# - Limita los dominios autorizados en Google Cloud
# - Usa API keys con permisos mínimos necesarios
# - Para WhatsApp Business: configura webhooks seguros
# - Twilio: activa restricciones de IP si es posible

# =============================================================================
# EJEMPLOS DE USO Y MENSAJES
# =============================================================================

# EJEMPLO DE MENSAJE DE WHATSAPP CONFIRMACIÓN:
# ✅ *Cita Confirmada*
# 
# Hola Ana López 👋
# 
# Tu cita ha sido confirmada exitosamente:
# 
# 📅 *Detalles de tu cita:*
# • Servicio: Corte de cabello
# • Fecha: lunes, 10 de septiembre de 2025  
# • Hora: 10:00
# 
# 📍 *Ubicación:* Calle Principal 123, Col. Centro
# 
# ⏰ *Por favor llega 10 minutos antes*
# 
# Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.
# 
# 📞 +52 55 1234-5678
# 
# ¡Te esperamos! ✨
# *Tu Salón de Belleza*

# FORMATO DE NÚMEROS DE TELÉFONO:
# ✅ +5215512345678 (formato internacional completo)
# ✅ 5215512345678 (se agrega + automáticamente) 
# ✅ 5512345678 (se agrega +52 automáticamente para México)
# ❌ 55-1234-5678 (se limpia y formatea automáticamente)