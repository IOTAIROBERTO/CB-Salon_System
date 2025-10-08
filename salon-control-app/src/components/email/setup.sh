# ============================================
# Script de Instalación - Email Marketing System
# Versión: 2.0 Consolidada (Windows PowerShell)
# ============================================

# Configurar colores
$host.UI.RawUI.ForegroundColor = "White"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# 1. Verificar directorio
function Test-Directory {
    Write-Header "1. Verificando Directorio"
    
    if (-not (Test-Path "src")) {
        Write-Error "No se encuentra la carpeta 'src'. Ejecuta este script desde la raíz del proyecto."
        exit 1
    }
    
    if (-not (Test-Path "src\components")) {
        Write-Error "No se encuentra 'src\components'. Verifica la estructura del proyecto."
        exit 1
    }
    
    Write-Success "Directorio verificado correctamente"
}

# 2. Crear backup
function New-Backup {
    Write-Header "2. Creando Backup"
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "backup_email_$timestamp"
    
    if (Test-Path "src\components\email") {
        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
        Copy-Item -Path "src\components\email" -Destination $backupDir -Recurse
        Write-Success "Backup creado en: $backupDir"
    } else {
        Write-Info "No hay archivos existentes para hacer backup"
    }
}

# 3. Crear estructura de carpetas
function New-Structure {
    Write-Header "3. Creando Estructura de Carpetas"
    
    $folders = @(
        "src\components\email\campaigns",
        "src\components\email\analytics",
        "src\components\email\templates",
        "src\components\email\config",
        "src\components\email\shared",
        "src\components\citas"
    )
    
    foreach ($folder in $folders) {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
    }
    
    Write-Success "Estructura de carpetas creada:"
    Write-Info "  📁 src\components\email\"
    Write-Info "    ├── 📁 campaigns\"
    Write-Info "    ├── 📁 analytics\"
    Write-Info "    ├── 📁 templates\"
    Write-Info "    ├── 📁 config\"
    Write-Info "    └── 📁 shared\"
    Write-Info "  📁 src\components\citas\"
}

# 4. Mostrar instrucciones de descarga
function Show-DownloadInstructions {
    Write-Header "4. Archivos a Descargar de Artifacts"
    
    Write-Info "Descarga estos archivos de los Artifacts de Claude:"
    Write-Host ""
    Write-Host "  1. EmailIntegration.tsx"
    Write-Host "     → src\components\email\config\EmailIntegration.tsx"
    Write-Host ""
    Write-Host "  2. CitaEmailButton.tsx"
    Write-Host "     → src\components\citas\CitaEmailButton.tsx"
    Write-Host ""
    Write-Host "  3. EmailCampaigns.tsx"
    Write-Host "     → src\components\email\EmailCampaigns.tsx"
    Write-Host ""
    Write-Host "  4. EmailCampaignWizard.tsx"
    Write-Host "     → src\components\email\campaigns\EmailCampaignWizard.tsx"
    Write-Host ""
    Write-Host "  5. CampaignCard.tsx"
    Write-Host "     → src\components\email\campaigns\CampaignCard.tsx"
    Write-Host ""
    
    Read-Host "Presiona ENTER cuando hayas descargado y colocado estos archivos"
}

# 5. Verificar archivos descargados
function Test-Downloads {
    Write-Header "5. Verificando Archivos Descargados"
    
    $essentialFiles = @(
        "src\components\email\config\EmailIntegration.tsx",
        "src\components\citas\CitaEmailButton.tsx",
        "src\components\email\EmailCampaigns.tsx",
        "src\components\email\campaigns\EmailCampaignWizard.tsx",
        "src\components\email\campaigns\CampaignCard.tsx"
    )
    
    $missingCount = 0
    
    foreach ($file in $essentialFiles) {
        if (Test-Path $file) {
            Write-Success "Encontrado: $(Split-Path $file -Leaf)"
        } else {
            Write-Warning "Falta: $file"
            $missingCount++
        }
    }
    
    if ($missingCount -gt 0) {
        Write-Warning "Faltan $missingCount archivos esenciales"
        Write-Info "El sistema funcionará de forma limitada"
    } else {
        Write-Success "¡Todos los archivos esenciales están presentes!"
    }
}

# 6. Mostrar instrucciones de copia
function Show-CopyInstructions {
    Write-Header "6. Archivos Opcionales (Copiar de Documentos)"
    
    Write-Info "Para funcionalidad completa, copia estos archivos de tus documentos:"
    Write-Host ""
    Write-Host "IMPORTANTES:"
    Write-Host "  • CampaignScheduler.tsx → campaigns\"
    Write-Host "  • AdvancedSegmentation.tsx → shared\"
    Write-Host "  • EmailToastNotifications.tsx → shared\"
    Write-Host ""
    Write-Host "RECOMENDADOS:"
    Write-Host "  • CampaignAnalyticsDashboard.tsx → analytics\"
    Write-Host "  • EmailHistoryTracker.tsx → analytics\"
    Write-Host "  • EmailTemplateLibrary.tsx → templates\"
    Write-Host "  • EmailBestPracticesGuide.tsx → shared\"
    Write-Host ""
}

# 7. Crear archivo de configuración de ejemplo
function New-ConfigExample {
    Write-Header "7. Creando Archivo de Configuración"
    
    $configContent = @'
{
  "provider": "emailjs",
  "emailjs": {
    "serviceId": "service_xxxxxxx",
    "templateId": "template_xxxxxxx",
    "publicKey": "user_xxxxxxxxxxxxxxx"
  }
}
'@
    
    $configContent | Out-File -FilePath "src\components\email\config\emailjs.example.json" -Encoding UTF8
    
    Write-Success "Creado: emailjs.example.json"
    Write-Info "Configura EmailJS y renombra a emailjs.json"
}

# 8. Actualizar .gitignore
function Update-GitIgnore {
    Write-Header "8. Actualizando .gitignore"
    
    if (Test-Path ".gitignore") {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        
        if ($gitignoreContent -notmatch "emailjs\.json") {
            $newRules = @"

# Email Configuration
src/components/email/config/emailjs.json
backup_email_*
"@
            Add-Content -Path ".gitignore" -Value $newRules
            Write-Success ".gitignore actualizado"
        } else {
            Write-Info ".gitignore ya contiene las reglas necesarias"
        }
    } else {
        Write-Warning "No se encontró .gitignore"
    }
}

# 9. Crear README
function New-ReadmeFile {
    Write-Header "9. Creando README del Sistema"
    
    $readmeContent = @'
# 📧 Email Marketing System

## Estructura del Sistema

```
email/
├── campaigns/          # Gestión de campañas
├── analytics/          # Métricas y reportes
├── templates/          # Plantillas y editor
├── config/             # Configuración
├── shared/             # Componentes compartidos
└── EmailCampaigns.tsx  # Componente principal
```

## Archivos Esenciales

1. **EmailIntegration.tsx** - Configuración de EmailJS/Resend
2. **EmailCampaignWizard.tsx** - Wizard de creación
3. **CampaignCard.tsx** - Tarjetas de campaña
4. **EmailCampaigns.tsx** - Componente principal

## Configuración Rápida

1. Configura EmailJS en `config/EmailIntegration.tsx`
2. Crea tu primera campaña con el wizard
3. Envía emails desde citas con `CitaEmailButton.tsx`

## Documentación

Ver `GUÍA_DE_IMPLEMENTACIÓN.md` para instrucciones completas.
'@
    
    $readmeContent | Out-File -FilePath "src\components\email\README.md" -Encoding UTF8
    Write-Success "README creado en src\components\email\"
}

# 10. Generar reporte
function New-Report {
    Write-Header "10. Generando Reporte de Instalación"
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = "installation_report_$timestamp.txt"
    
    $reportContent = @"
============================================
REPORTE DE INSTALACIÓN
============================================

Fecha: $(Get-Date)
Usuario: $env:USERNAME
Directorio: $(Get-Location)

ESTRUCTURA CREADA:
$(Get-ChildItem -Path "src\components\email" -Directory -Recurse | ForEach-Object { $_.FullName })

ARCHIVOS PRESENTES:
$((Get-ChildItem -Path "src\components\email" -Filter "*.tsx" -Recurse).Count) archivos .tsx encontrados

"@
    
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Success "Reporte guardado: $reportFile"
}

# 11. Mostrar próximos pasos
function Show-NextSteps {
    Write-Header "✨ INSTALACIÓN COMPLETADA"
    
    Write-Host ""
    Write-Host "¡El sistema está listo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 PRÓXIMOS PASOS:"
    Write-Host ""
    Write-Host "1. Configura EmailJS:"
    Write-Host "   • Crea cuenta en emailjs.com"
    Write-Host "   • Configura service y template"
    Write-Host "   • Guarda credenciales en el sistema"
    Write-Host ""
    Write-Host "2. Copia archivos opcionales (si quieres funcionalidad completa)"
    Write-Host ""
    Write-Host "3. Prueba el sistema:"
    Write-Host "   • npm run dev"
    Write-Host "   • Ve a Email Marketing"
    Write-Host "   • Configura EmailJS"
    Write-Host "   • Crea tu primera campaña"
    Write-Host ""
    Write-Host "📚 DOCUMENTACIÓN:"
    Write-Host "   • GUÍA_DE_IMPLEMENTACIÓN.md"
    Write-Host "   • RESUMEN_CONSOLIDACIÓN.md"
    Write-Host "   • ÍNDICE_COMPLETO_ARCHIVOS.md"
    Write-Host ""
    Write-Host "¡Buena suerte! 🚀" -ForegroundColor Blue
    Write-Host ""
}

# ============================================
# MAIN SCRIPT
# ============================================

Clear-Host
Write-Header "🚀 INSTALACIÓN EMAIL MARKETING SYSTEM V2.0"

Test-Directory
New-Backup
New-Structure
Show-DownloadInstructions
Test-Downloads
Show-CopyInstructions
New-ConfigExample
Update-GitIgnore
New-ReadmeFile
New-Report
Show-NextSteps

Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
