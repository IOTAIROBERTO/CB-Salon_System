// src/pages/EmailCampaignsPage.tsx - Versión corregida y completa
import { useState, useEffect } from 'react';
import { Mail, Send, Calendar, Users, Eye, Plus, Edit, Trash2, Play, Pause, Settings, Bot, FileText, CheckSquare, Square, Copy } from 'lucide-react';
import { emailService } from '../services/emailService';

interface Campaign {
  id: string;
  nombre: string;
  tipo: 'recordatorio' | 'confirmacion' | 'promocional' | 'cumpleanos' | 'seguimiento';
  estado: 'borrador' | 'activa' | 'pausada' | 'completada';
  plantillaId: string;
  asunto: string;
  contenidoPersonalizado?: string;
  fechaCreacion: string;
  fechaEnvio?: string;
  destinatarios: string[]; // Array de IDs de clientes
  filtroTipo: 'manual' | 'todos' | 'activos' | 'cumpleanos' | 'nuevos';
  enviadoA: number;
  tasaApertura: number;
}

interface EmailTemplate {
  id: string;
  nombre: string;
  tipo: Campaign['tipo'];
  asunto: string;
  contenido: string;
  variables: string[];
  fechaCreacion: string;
  activa: boolean;
}

interface AutomationRule {
  id: string;
  nombre: string;
  activa: boolean;
  trigger: 'cita_creada' | 'cita_confirmada' | 'cumpleanos' | 'cliente_nuevo' | 'cita_completada';
  plantillaId: string;
  condiciones: {
    diasAntes?: number;
    tipoServicio?: string[];
    horaEnvio?: string;
  };
  filtroClientes: 'todos' | 'activos' | 'nuevos';
}

interface CampaignFormData {
  nombre: string;
  tipo: Campaign['tipo'];
  plantillaId: string;
  asunto: string;
  contenidoPersonalizado: string;
  filtroTipo: Campaign['filtroTipo'];
  destinatarios: string[];
}

interface TemplateFormData {
  nombre: string;
  tipo: EmailTemplate['tipo'];
  asunto: string;
  contenido: string;
}

interface AutomationFormData {
  nombre: string;
  trigger: AutomationRule['trigger'];
  plantillaId: string;
  diasAntes: number;
  horaEnvio: string;
  filtroClientes: AutomationRule['filtroClientes'];
  tipoServicio: string[];
}

// Plantillas mejoradas con HTML/CSS para diferentes servicios
const PLANTILLAS_AVANZADAS: EmailTemplate[] = [
  {
    id: 'tpl_recordatorio_corte',
    nombre: 'Recordatorio - Corte de Cabello',
    tipo: 'recordatorio',
    asunto: '✂️ Recordatorio: Tu cita de corte es mañana - {{clienteName}}',
    contenido: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #fff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 15px 15px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✂️ Tu Cita de Mañana</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Recordatorio de corte de cabello</p>
        </div>
        
        <!-- Contenido -->
        <div style="padding: 30px 20px; background: #f8f9ff;">
          <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h2 style="color: #333; margin-top: 0;">¡Hola {{clienteName}}!</h2>
            <p>Este es un recordatorio de que tienes una cita programada para mañana:</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: white;">📅 Detalles de tu cita</h3>
              <p style="margin: 5px 0; color: white;"><strong>Servicio:</strong> {{serviceName}}</p>
              <p style="margin: 5px 0; color: white;"><strong>Fecha:</strong> {{appointmentDate}}</p>
              <p style="margin: 5px 0; color: white;"><strong>Hora:</strong> {{appointmentTime}}</p>
            </div>
            
            <div style="background: #e8f2ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h4 style="color: #667eea; margin-top: 0;">💡 Para tu cita de corte:</h4>
              <ul style="color: #555; padding-left: 20px;">
                <li>Llega 10 minutos antes</li>
                <li>Trae una foto de referencia del corte que deseas</li>
                <li>Menciona si has usado algún tratamiento químico recientemente</li>
                <li>Si necesitas cancelar, hazlo con 24h de anticipación</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:{{salonPhone}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                📞 Contactar salón
              </a>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 25px; color: #666; background: #f1f1f1; border-radius: 0 0 15px 15px;">
          <p style="margin: 0;">¡Te esperamos para tu nuevo look!</p>
          <p style="margin: 5px 0 0 0;"><strong>{{salonName}}</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">{{salonAddress}}</p>
        </div>
      </div>
    `,
    variables: ['clienteName', 'serviceName', 'appointmentDate', 'appointmentTime', 'salonPhone', 'salonName', 'salonAddress'],
    fechaCreacion: new Date().toISOString(),
    activa: true
  },
  {
    id: 'tpl_recordatorio_manicure',
    nombre: 'Recordatorio - Manicure/Pedicure',
    tipo: 'recordatorio',
    asunto: '💅 Recordatorio: Tu cita de manicure es mañana - {{clienteName}}',
    contenido: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #fff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #8b5a7b; padding: 30px 20px; text-align: center; border-radius: 15px 15px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">💅 Tu Cita de Mañana</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Recordatorio de manicure</p>
        </div>
        
        <!-- Contenido -->
        <div style="padding: 30px 20px; background: #fef8ff;">
          <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h2 style="color: #8b5a7b; margin-top: 0;">¡Hola {{clienteName}}!</h2>
            <p>Tu cita de manicure está programada para mañana:</p>
            
            <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #8b5a7b; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0;">📅 Detalles de tu cita</h3>
              <p style="margin: 5px 0;"><strong>Servicio:</strong> {{serviceName}}</p>
              <p style="margin: 5px 0;"><strong>Fecha:</strong> {{appointmentDate}}</p>
              <p style="margin: 5px 0;"><strong>Hora:</strong> {{appointmentTime}}</p>
            </div>
            
            <div style="background: #ffe8f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h4 style="color: #c2185b; margin-top: 0;">💡 Para tu cita de manicure:</h4>
              <ul style="color: #555; padding-left: 20px;">
                <li>Retira cualquier esmalte anterior</li>
                <li>Evita cortar las cutículas 24h antes</li>
                <li>Trae una imagen del diseño que deseas</li>
                <li>Si tienes alguna alergia, infórmanos</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 25px; color: #8b5a7b; background: #fef8ff;">
          <p style="margin: 0;">¡Prepárate para lucir unas hermosas!</p>
          <p style="margin: 5px 0 0 0;"><strong>{{salonName}}</strong></p>
        </div>
      </div>
    `,
    variables: ['clienteName', 'serviceName', 'appointmentDate', 'appointmentTime', 'salonName'],
    fechaCreacion: new Date().toISOString(),
    activa: true
  },
  {
    id: 'tpl_cumpleanos_especial',
    nombre: 'Cumpleaños - Oferta Especial',
    tipo: 'cumpleanos',
    asunto: '🎂 ¡Feliz Cumpleaños {{clienteName}}! 🎁 Regalo especial para ti',
    contenido: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #fff;">
        <!-- Header animado -->
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff6b6b 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 15px 15px 0 0; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><text y=\".9em\" font-size=\"20\">🎉</text></svg>') repeat; opacity: 0.1;"></div>
          <h1 style="margin: 0; font-size: 32px; position: relative; z-index: 2;">🎂 ¡FELIZ CUMPLEAÑOS!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; position: relative; z-index: 2;">{{clienteName}}</p>
        </div>
        
        <!-- Contenido -->
        <div style="padding: 30px 20px; background: #fff8f0;">
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center;">
            <h2 style="color: #ff6b6b; margin-top: 0; font-size: 24px;">¡Es tu día especial!</h2>
            <p style="font-size: 16px; color: #555; margin-bottom: 30px;">Queremos celebrar contigo con un regalo increíble</p>
            
            <!-- Oferta destacada -->
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 30px; border-radius: 20px; margin: 25px 0; position: relative;">
              <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 28px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎁 REGALO DE CUMPLEAÑOS</h3>
              </div>
              <div style="background: white; color: #ff6b6b; padding: 20px; border-radius: 50px; margin: 20px 0; font-size: 36px; font-weight: bold; text-shadow: none;">
                25% OFF
              </div>
              <p style="font-size: 18px; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">En cualquier servicio que elijas</p>
              <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.9;">Válido durante todo tu mes de cumpleaños</p>
            </div>
            
            <!-- Servicios recomendados -->
            <div style="background: #fff8f0; padding: 25px; border-radius: 15px; margin: 25px 0; text-align: left;">
              <h4 style="color: #ff6b6b; margin-top: 0; text-align: center;">✨ Servicios perfectos para tu celebración:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 24px; margin-bottom: 5px;">💇‍♀️</div>
                  <strong>Corte + Peinado</strong>
                </div>
                <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 24px; margin-bottom: 5px;">💅</div>
                  <strong>Manicure Especial</strong>
                </div>
                <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 24px; margin-bottom: 5px;">✨</div>
                  <strong>Facial Premium</strong>
                </div>
                <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 24px; margin-bottom: 5px;">💄</div>
                  <strong>Maquillaje Fiesta</strong>
                </div>
              </div>
            </div>
            
            <div style="margin: 30px 0;">
              <a href="tel:{{salonPhone}}" style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255,107,107,0.4); transition: transform 0.3s ease;">
                🎂 ¡Agenda tu cita de cumpleaños!
              </a>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; border-radius: 0 0 15px 15px;">
          <p style="margin: 0; font-size: 18px;">¡Que tengas un día maravilloso lleno de alegría!</p>
          <p style="margin: 10px 0 5px 0; font-weight: bold;">{{salonName}}</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">{{salonAddress}} | {{salonPhone}}</p>
        </div>
      </div>
    `,
    variables: ['clienteName', 'salonName', 'salonAddress', 'salonPhone'],
    fechaCreacion: new Date().toISOString(),
    activa: true
  },
  {
    id: 'tpl_promocional_verano',
    nombre: 'Promocional - Verano',
    tipo: 'promocional',
    asunto: '☀️ {{clienteName}}, ¡Prepárate para el verano! Ofertas especiales',
    contenido: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #fff;">
        <!-- Header veraniego -->
        <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 50%, #fd79a8 100%); color: #2d3436; padding: 40px 20px; text-align: center; border-radius: 15px 15px 0 0;">
          <h1 style="margin: 0; font-size: 32px;">☀️ ¡VERANO 2024!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.8;">Luce radiante esta temporada</p>
        </div>
        
        <!-- Contenido -->
        <div style="padding: 30px 20px; background: linear-gradient(180deg, #fff 0%, #fff8f0 100%);">
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2 style="color: #e17055; margin-top: 0; text-align: center;">¡Hola {{clienteName}}!</h2>
            <p style="text-align: center; font-size: 16px; color: #555; margin-bottom: 30px;">
              El verano está aquí y queremos que luzcas increíble en cada momento
            </p>
            
            <!-- Paquetes de verano -->
            <div style="margin: 30px 0;">
              <h3 style="color: #e17055; text-align: center; margin-bottom: 25px;">🌺 PAQUETES DE VERANO 🌺</h3>
              
              <!-- Paquete 1 -->
              <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; color: #2d3436;">
                <div style="text-align: center;">
                  <h4 style="margin: 0 0 10px 0; font-size: 20px;">🌊 PAQUETE SIRENA</h4>
                  <p style="margin: 0 0 15px 0;">Corte + Hidratación + Ondas de playa</p>
                  <div style="background: white; color: #e17055; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 18px;">
                    $899 (Antes $1,200)
                  </div>
                </div>
              </div>
              
              <!-- Paquete 2 -->
              <div style="background: linear-gradient(135deg, #fab1a0 0%, #fd79a8 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; color: white;">
                <div style="text-align: center;">
                  <h4 style="margin: 0 0 10px 0; font-size: 20px;">☀️ PAQUETE GOLDEN</h4>
                  <p style="margin: 0 0 15px 0;">Manicure + Pedicure + Depilación</p>
                  <div style="background: white; color: #e17055; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 18px;">
                    $649 (Antes $850)
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Servicios individuales -->
            <div style="background: #fff8f0; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <h4 style="color: #e17055; margin-top: 0; text-align: center;">💫 O elige servicios individuales:</h4>
              <ul style="color: #555; list-style: none; padding: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #eee;">🌺 Cortes frescos para el verano - 15% OFF</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #eee;">☀️ Tratamientos protectores solares - 20% OFF</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #eee;">🏖️ Manicures tropicales - 10% OFF</li>
                <li style="padding: 8px 0;">🌊 Depilación preparación playa - 25% OFF</li>
              </ul>
            </div>
            
            <div style="background: #e8f4f8; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
              <p style="margin: 0; color: #2d3436; font-weight: bold;">⏰ OFERTA VÁLIDA HASTA EL 31 DE JULIO</p>
              <p style="margin: 5px 0 0 0; color: #555; font-size: 14px;">No dejes pasar esta oportunidad única</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:{{salonPhone}}" style="background: linear-gradient(135deg, #e17055 0%, #fd79a8 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(225,112,85,0.4);">
                🌺 ¡Reserva tu paquete de verano!
              </a>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); color: #2d3436; border-radius: 0 0 15px 15px;">
          <p style="margin: 0;">¡Este verano, luce espectacular!</p>
          <p style="margin: 5px 0 0 0; font-weight: bold;">{{salonName}}</p>
        </div>
      </div>
    `,
    variables: ['clienteName', 'salonName', 'salonPhone'],
    fechaCreacion: new Date().toISOString(),
    activa: true
  }
];

export default function EmailCampaignsPage() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>(PLANTILLAS_AVANZADAS);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRule | null>(null);
  
  const [formData, setFormData] = useState<CampaignFormData>({
    nombre: '',
    tipo: 'promocional',
    plantillaId: '',
    asunto: '',
    contenidoPersonalizado: '',
    filtroTipo: 'todos',
    destinatarios: []
  });

  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>({
    nombre: '',
    tipo: 'promocional',
    asunto: '',
    contenido: ''
  });

  const [automationFormData, setAutomationFormData] = useState<AutomationFormData>({
    nombre: '',
    trigger: 'cita_creada',
    plantillaId: '',
    diasAntes: 1,
    horaEnvio: '10:00',
    filtroClientes: 'todos',
    tipoServicio: []
  });

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isEmailConfigured, setIsEmailConfigured] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadData();
    checkEmailConfiguration();
  }, []);

  const loadData = () => {
    const campaignsData = JSON.parse(localStorage.getItem('emailCampaigns') || '[]');
    const templatesData = JSON.parse(localStorage.getItem('emailTemplates') || JSON.stringify(PLANTILLAS_AVANZADAS));
    const automationsData = JSON.parse(localStorage.getItem('emailAutomations') || '[]');
    const clientsData = JSON.parse(localStorage.getItem('clientes') || '[]');
    
    setCampaigns(campaignsData);
    // Merge templates existentes con las nuevas
    const mergedTemplates = [...PLANTILLAS_AVANZADAS];
    templatesData.forEach((saved: EmailTemplate) => {
      if (!mergedTemplates.find(t => t.id === saved.id)) {
        mergedTemplates.push(saved);
      }
    });
    setTemplates(mergedTemplates);
    localStorage.setItem('emailTemplates', JSON.stringify(mergedTemplates));
    
    setAutomations(automationsData);
    setClients(clientsData.filter((c: any) => c.activo && c.email));
  };

  const checkEmailConfiguration = () => {
    const config = JSON.parse(localStorage.getItem('emailConfig') || '{}');
    setIsEmailConfigured(!!(config.serviceId && config.templateId && config.publicKey));
  };

  // ===== GESTIÓN DE CAMPAÑAS =====
  const saveCampaign = () => {
    const selectedTemplate = templates.find(t => t.id === formData.plantillaId);
    
    const newCampaign: Campaign = {
      id: editingCampaign?.id || `camp_${Date.now()}`,
      ...formData,
      asunto: formData.asunto || selectedTemplate?.asunto || '',
      estado: 'borrador',
      fechaCreacion: editingCampaign?.fechaCreacion || new Date().toISOString(),
      enviadoA: editingCampaign?.enviadoA || 0,
      tasaApertura: editingCampaign?.tasaApertura || 0
    };

    const updatedCampaigns = editingCampaign
      ? campaigns.map(c => c.id === editingCampaign.id ? newCampaign : c)
      : [...campaigns, newCampaign];

    setCampaigns(updatedCampaigns);
    localStorage.setItem('emailCampaigns', JSON.stringify(updatedCampaigns));
    
    resetCampaignForm();
    setShowModal(false);
  };

  const duplicateCampaign = (campaign: Campaign) => {
    const newCampaign: Campaign = {
      ...campaign,
      id: `camp_${Date.now()}`,
      nombre: `${campaign.nombre} (Copia)`,
      estado: 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaEnvio: undefined,
      enviadoA: 0,
      tasaApertura: 0
    };

    const updatedCampaigns = [...campaigns, newCampaign];
    setCampaigns(updatedCampaigns);
    localStorage.setItem('emailCampaigns', JSON.stringify(updatedCampaigns));
  };

  const deleteCampaign = (campaignId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) return;
    
    const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
    setCampaigns(updatedCampaigns);
    localStorage.setItem('emailCampaigns', JSON.stringify(updatedCampaigns));
  };

  const editCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      nombre: campaign.nombre,
      tipo: campaign.tipo,
      plantillaId: campaign.plantillaId,
      asunto: campaign.asunto,
      contenidoPersonalizado: campaign.contenidoPersonalizado || '',
      filtroTipo: campaign.filtroTipo,
      destinatarios: campaign.destinatarios
    });
    setSelectedClients(campaign.destinatarios);
    setShowModal(true);
  };

  // ===== GESTIÓN DE PLANTILLAS =====
  const saveTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: editingTemplate?.id || `tpl_${Date.now()}`,
      ...templateFormData,
      variables: extractVariables(templateFormData.contenido),
      fechaCreacion: editingTemplate?.fechaCreacion || new Date().toISOString(),
      activa: true
    };

    const updatedTemplates = editingTemplate
      ? templates.map(t => t.id === editingTemplate.id ? newTemplate : t)
      : [...templates, newTemplate];

    setTemplates(updatedTemplates);
    localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
    
    resetTemplateForm();
    setShowTemplateModal(false);
  };

  const extractVariables = (contenido: string): string[] => {
    const matches = contenido.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))];
  };

  const deleteTemplate = (templateId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
  };

  // ===== GESTIÓN DE AUTOMATIZACIONES =====
  const saveAutomation = () => {
    const newAutomation: AutomationRule = {
      id: editingAutomation?.id || `auto_${Date.now()}`,
      nombre: automationFormData.nombre,
      activa: true,
      trigger: automationFormData.trigger,
      plantillaId: automationFormData.plantillaId,
      condiciones: {
        diasAntes: automationFormData.diasAntes,
        horaEnvio: automationFormData.horaEnvio,
        tipoServicio: automationFormData.tipoServicio
      },
      filtroClientes: automationFormData.filtroClientes
    };

    const updatedAutomations = editingAutomation
      ? automations.map(a => a.id === editingAutomation.id ? newAutomation : a)
      : [...automations, newAutomation];

    setAutomations(updatedAutomations);
    localStorage.setItem('emailAutomations', JSON.stringify(updatedAutomations));
    
    resetAutomationForm();
    setShowAutomationModal(false);
  };

  const toggleAutomation = (automationId: string) => {
    const updatedAutomations = automations.map(a =>
      a.id === automationId ? { ...a, activa: !a.activa } : a
    );
    setAutomations(updatedAutomations);
    localStorage.setItem('emailAutomations', JSON.stringify(updatedAutomations));
  };

  const deleteAutomation = (automationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta automatización?')) return;
    
    const updatedAutomations = automations.filter(a => a.id !== automationId);
    setAutomations(updatedAutomations);
    localStorage.setItem('emailAutomations', JSON.stringify(updatedAutomations));
  };

  const editAutomation = (automation: AutomationRule) => {
    setEditingAutomation(automation);
    setAutomationFormData({
      nombre: automation.nombre,
      trigger: automation.trigger,
      plantillaId: automation.plantillaId,
      diasAntes: automation.condiciones.diasAntes || 1,
      horaEnvio: automation.condiciones.horaEnvio || '10:00',
      filtroClientes: automation.filtroClientes,
      tipoServicio: automation.condiciones.tipoServicio || []
    });
    setShowAutomationModal(true);
  };

  // ===== SELECCIÓN DE CLIENTES =====
  const getFilteredClients = () => {
    switch (formData.filtroTipo) {
      case 'cumpleanos':
        const mesActual = new Date().getMonth() + 1;
        return clients.filter(client => {
          const clientMonth = new Date(client.cumple).getMonth() + 1;
          return clientMonth === mesActual;
        });
      case 'nuevos':
        const treintaDias = new Date();
        treintaDias.setDate(treintaDias.getDate() - 30);
        return clients.filter(client => 
          new Date(client.fechaRegistro) > treintaDias
        );
      case 'activos':
        return clients.filter(client => client.activo);
      case 'manual':
        return clients;
      default:
        return clients;
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    const filteredClients = getFilteredClients();
    setSelectedClients(filteredClients.map(c => c.id));
  };

  const clearClientSelection = () => {
    setSelectedClients([]);
  };

  // ===== FUNCIONES DE RESET =====
  const resetCampaignForm = () => {
    setFormData({
      nombre: '',
      tipo: 'promocional',
      plantillaId: '',
      asunto: '',
      contenidoPersonalizado: '',
      filtroTipo: 'todos',
      destinatarios: []
    });
    setEditingCampaign(null);
    setSelectedClients([]);
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      nombre: '',
      tipo: 'promocional',
      asunto: '',
      contenido: ''
    });
    setEditingTemplate(null);
  };

  const resetAutomationForm = () => {
    setAutomationFormData({
      nombre: '',
      trigger: 'cita_creada',
      plantillaId: '',
      diasAntes: 1,
      horaEnvio: '10:00',
      filtroClientes: 'todos',
      tipoServicio: []
    });
    setEditingAutomation(null);
  };

  // ===== FUNCIONES AUXILIARES =====
  const getTipoLabel = (tipo: Campaign['tipo']) => {
    const tipos = {
      recordatorio: 'Recordatorio',
      confirmacion: 'Confirmación',
      promocional: 'Promocional',
      cumpleanos: 'Cumpleaños',
      seguimiento: 'Seguimiento'
    };
    return tipos[tipo];
  };

  const getStatusColor = (estado: Campaign['estado']) => {
    switch (estado) {
      case 'activa': return 'text-green-600 bg-green-100';
      case 'pausada': return 'text-yellow-600 bg-yellow-100';
      case 'completada': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTriggerLabel = (trigger: AutomationRule['trigger']) => {
    const triggers = {
      cita_creada: 'Cita creada',
      cita_confirmada: 'Cita confirmada',
      cumpleanos: 'Cumpleaños del cliente',
      cliente_nuevo: 'Cliente nuevo',
      cita_completada: 'Cita completada'
    };
    return triggers[trigger];
  };

  const handleTemplatePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
  };

  const replaceVariablesForPreview = (content: string) => {
    const variables = {
      clienteName: 'María García',
      serviceName: 'Corte de Cabello',
      appointmentDate: 'Viernes, 15 de marzo de 2024',
      appointmentTime: '10:30 AM',
      salonName: 'Beauty Salon Total Control',
      salonAddress: 'Calle Principal 123, Col. Centro',
      salonPhone: '+52 55 1234-5678'
    };

    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Email Marketing
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona campañas, plantillas y automatizaciones de email
          </p>
        </div>
      </div>

      {/* Configuración requerida */}
      {!isEmailConfigured && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={20} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-800">
              Configuración requerida
            </h3>
          </div>
          <p className="text-orange-700 text-sm">
            Para enviar emails, configura EmailJS en Configuración → Email Marketing.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'campaigns', label: 'Campañas', icon: Mail },
            { id: 'templates', label: 'Plantillas', icon: FileText },
            { id: 'automations', label: 'Automatizaciones', icon: Bot }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Campañas</p>
                  <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                </div>
                <Mail size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {campaigns.filter(c => c.estado === 'activa').length}
                  </p>
                </div>
                <Play size={24} className="text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Emails Enviados</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {campaigns.reduce((sum, c) => sum + c.enviadoA, 0)}
                  </p>
                </div>
                <Send size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clientes</p>
                  <p className="text-2xl font-bold text-purple-600">{clients.length}</p>
                </div>
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          {/* Botón nueva campaña */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Campaña
            </button>
          </div>

          {/* Lista de campañas */}
          <div className="bg-white rounded-lg shadow">
            {campaigns.length === 0 ? (
              <div className="p-8 text-center">
                <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay campañas creadas
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primera campaña de email marketing
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Crear primera campaña
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaña</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatarios</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{campaign.nombre}</div>
                            <div className="text-sm text-gray-500">{campaign.asunto}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {getTipoLabel(campaign.tipo)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.estado)}`}>
                            {campaign.estado.charAt(0).toUpperCase() + campaign.estado.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {campaign.filtroTipo === 'manual' ? campaign.destinatarios.length : getFilteredClients().length}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => editCampaign(campaign)}
                              className="text-blue-600 hover:text-blue-900 p-1" 
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => duplicateCampaign(campaign)}
                              className="text-green-600 hover:text-green-900 p-1" 
                              title="Duplicar"
                            >
                              <Copy size={16} />
                            </button>
                            <button 
                              onClick={() => deleteCampaign(campaign.id)}
                              className="text-red-600 hover:text-red-900 p-1" 
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Plantillas */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Plantilla
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{template.nombre}</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {getTipoLabel(template.tipo)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTemplatePreview(template)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Vista previa"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setTemplateFormData({
                          nombre: template.nombre,
                          tipo: template.tipo,
                          asunto: template.asunto,
                          contenido: template.contenido
                        });
                        setShowTemplateModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <strong>Asunto:</strong> {template.asunto}
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <strong>Variables:</strong> {template.variables.join(', ')}
                </div>
                
                <div className="text-xs text-gray-500">
                  Creada: {new Date(template.fechaCreacion).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Automatizaciones */}
      {activeTab === 'automations' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAutomationModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Automatización
            </button>
          </div>

          <div className="bg-white rounded-lg shadow">
            {automations.length === 0 ? (
              <div className="p-8 text-center">
                <Bot size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay automatizaciones configuradas
                </h3>
                <p className="text-gray-600 mb-4">
                  Configura reglas automáticas para enviar emails
                </p>
                <button
                  onClick={() => setShowAutomationModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Crear primera automatización
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Automatización</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plantilla</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {automations.map((automation) => {
                      const template = templates.find(t => t.id === automation.plantillaId);
                      return (
                        <tr key={automation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{automation.nombre}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {getTriggerLabel(automation.trigger)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {template?.nombre || 'Plantilla no encontrada'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              automation.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {automation.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleAutomation(automation.id)}
                                className="text-yellow-600 hover:text-yellow-900 p-1"
                                title={automation.activa ? 'Desactivar' : 'Activar'}
                              >
                                {automation.activa ? <Pause size={16} /> : <Play size={16} />}
                              </button>
                              <button
                                onClick={() => editAutomation(automation)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => deleteAutomation(automation.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Campaña */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
              </h2>
              
              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la campaña *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ej: Promoción de verano"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de campaña *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => {
                        const newTipo = e.target.value as Campaign['tipo'];
                        setFormData({
                          ...formData, 
                          tipo: newTipo,
                          plantillaId: '' // Reset template when changing type
                        });
                      }}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="promocional">Promocional</option>
                      <option value="recordatorio">Recordatorio</option>
                      <option value="confirmacion">Confirmación</option>
                      <option value="cumpleanos">Cumpleaños</option>
                      <option value="seguimiento">Seguimiento</option>
                    </select>
                  </div>
                </div>

                {/* Selección de plantilla */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plantilla de email *
                  </label>
                  <select
                    value={formData.plantillaId}
                    onChange={(e) => {
                      const selectedTemplate = templates.find(t => t.id === e.target.value);
                      setFormData({
                        ...formData, 
                        plantillaId: e.target.value,
                        asunto: selectedTemplate?.asunto || ''
                      });
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Seleccionar plantilla</option>
                    {templates
                      .filter(t => t.tipo === formData.tipo && t.activa)
                      .map(template => (
                        <option key={template.id} value={template.id}>
                          {template.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Vista previa de plantilla */}
                {formData.plantillaId && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Vista previa de la plantilla:</h4>
                    {(() => {
                      const template = templates.find(t => t.id === formData.plantillaId);
                      return template ? (
                        <div className="text-sm">
                          <div className="mb-2"><strong>Asunto:</strong> {template.asunto}</div>
                          <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: replaceVariablesForPreview(template.contenido).substring(0, 500) + '...'
                              }}
                            />
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Asunto personalizado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto del email (opcional - personalizar plantilla)
                  </label>
                  <input
                    type="text"
                    value={formData.asunto}
                    onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Dejar vacío para usar el asunto de la plantilla"
                  />
                </div>

                {/* Contenido personalizado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido personalizado (opcional)
                  </label>
                  <textarea
                    value={formData.contenidoPersonalizado}
                    onChange={(e) => setFormData({...formData, contenidoPersonalizado: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-32"
                    placeholder="Dejar vacío para usar el contenido de la plantilla. Usar {{variables}} para personalización."
                  />
                </div>

                {/* Selección de destinatarios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinatarios *
                  </label>
                  <div className="space-y-3">
                    <select
                      value={formData.filtroTipo}
                      onChange={(e) => {
                        const newFiltro = e.target.value as Campaign['filtroTipo'];
                        setFormData({...formData, filtroTipo: newFiltro});
                        if (newFiltro !== 'manual') {
                          setSelectedClients([]);
                        }
                      }}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="todos">Todos los clientes</option>
                      <option value="activos">Clientes activos</option>
                      <option value="cumpleanos">Cumpleañeros del mes</option>
                      <option value="nuevos">Clientes nuevos (30 días)</option>
                      <option value="manual">Selección manual</option>
                    </select>

                    {formData.filtroTipo === 'manual' && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">
                            Clientes seleccionados: {selectedClients.length}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={selectAllClients}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Seleccionar todos
                            </button>
                            <button
                              type="button"
                              onClick={clearClientSelection}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Limpiar selección
                            </button>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                          {clients.map(client => (
                            <label key={client.id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedClients.includes(client.id)}
                                onChange={() => toggleClientSelection(client.id)}
                                className="h-4 w-4 text-purple-600"
                              />
                              <span className="text-sm">{client.nombre}</span>
                              <span className="text-xs text-gray-500">({client.email})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Destinatarios que recibirán el email: {
                        formData.filtroTipo === 'manual' 
                          ? selectedClients.length 
                          : getFilteredClients().length
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetCampaignForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Actualizar destinatarios según el tipo de filtro
                    const updatedFormData = {
                      ...formData,
                      destinatarios: formData.filtroTipo === 'manual' 
                        ? selectedClients 
                        : getFilteredClients().map(c => c.id)
                    };
                    setFormData(updatedFormData);
                    saveCampaign();
                  }}
                  disabled={!formData.nombre || !formData.plantillaId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                >
                  {editingCampaign ? 'Actualizar' : 'Crear'} Campaña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Plantilla */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la plantilla *
                    </label>
                    <input
                      type="text"
                      value={templateFormData.nombre}
                      onChange={(e) => setTemplateFormData({...templateFormData, nombre: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ej: Recordatorio estándar"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={templateFormData.tipo}
                      onChange={(e) => setTemplateFormData({...templateFormData, tipo: e.target.value as EmailTemplate['tipo']})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="promocional">Promocional</option>
                      <option value="recordatorio">Recordatorio</option>
                      <option value="confirmacion">Confirmación</option>
                      <option value="cumpleanos">Cumpleaños</option>
                      <option value="seguimiento">Seguimiento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto del email *
                  </label>
                  <input
                    type="text"
                    value={templateFormData.asunto}
                    onChange={(e) => setTemplateFormData({...templateFormData, asunto: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Usa {{variables}} para personalizar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido del email *
                  </label>
                  <textarea
                    value={templateFormData.contenido}
                    onChange={(e) => setTemplateFormData({...templateFormData, contenido: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-64"
                    placeholder="Escribe el contenido del email. Usa HTML para formato avanzado y {{variables}} como {{clienteName}}, {{serviceName}}, etc."
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Variables disponibles: {{clienteName}}, {{serviceName}}, {{appointmentDate}}, {{appointmentTime}}, {{salonName}}, {{salonPhone}}, {{salonAddress}}
                  </div>
                </div>

                {/* Vista previa */}
                {templateFormData.contenido && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Vista previa:</h4>
                    <div className="bg-white p-3 rounded border max-h-60 overflow-y-auto">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: replaceVariablesForPreview(templateFormData.contenido)
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    resetTemplateForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!templateFormData.nombre || !templateFormData.asunto || !templateFormData.contenido}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                >
                  {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Automatización */}
      {showAutomationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingAutomation ? 'Editar Automatización' : 'Nueva Automatización'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la automatización *
                  </label>
                  <input
                    type="text"
                    value={automationFormData.nombre}
                    onChange={(e) => setAutomationFormData({...automationFormData, nombre: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ej: Recordatorio automático de citas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disparador *
                  </label>
                  <select
                    value={automationFormData.trigger}
                    onChange={(e) => setAutomationFormData({...automationFormData, trigger: e.target.value as AutomationRule['trigger']})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="cita_creada">Cuando se crea una cita</option>
                    <option value="cita_confirmada">Cuando se confirma una cita</option>
                    <option value="cumpleanos">En el cumpleaños del cliente</option>
                    <option value="cliente_nuevo">Cliente nuevo registrado</option>
                    <option value="cita_completada">Cita completada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plantilla a usar *
                  </label>
                  <select
                    value={automationFormData.plantillaId}
                    onChange={(e) => setAutomationFormData({...automationFormData, plantillaId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Seleccionar plantilla</option>
                    {templates.filter(t => t.activa).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.nombre} ({getTipoLabel(template.tipo)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días antes/después
                    </label>
                    <input
                      type="number"
                      value={automationFormData.diasAntes}
                      onChange={(e) => setAutomationFormData({...automationFormData, diasAntes: Number(e.target.value)})}
                      className="w-full border rounded-lg px-3 py-2"
                      min="-30"
                      max="30"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Positivo = antes del evento, Negativo = después del evento
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de envío
                    </label>
                    <input
                      type="time"
                      value={automationFormData.horaEnvio}
                      onChange={(e) => setAutomationFormData({...automationFormData, horaEnvio: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aplicar a
                  </label>
                  <select
                    value={automationFormData.filtroClientes}
                    onChange={(e) => setAutomationFormData({...automationFormData, filtroClientes: e.target.value as AutomationRule['filtroClientes']})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="todos">Todos los clientes</option>
                    <option value="activos">Solo clientes activos</option>
                    <option value="nuevos">Solo clientes nuevos</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowAutomationModal(false);
                    resetAutomationForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveAutomation}
                  disabled={!automationFormData.nombre || !automationFormData.plantillaId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                >
                  {editingAutomation ? 'Actualizar' : 'Crear'} Automatización
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa de Plantilla */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Vista Previa: {previewTemplate.nombre}
                </h2>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asunto:</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {replaceVariablesForPreview(previewTemplate.asunto)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenido:</label>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: replaceVariablesForPreview(previewTemplate.contenido)
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}