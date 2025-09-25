// src/components/configuracion/ConfiguracionEmailModal.tsx
import { X, Save, Mail, Settings, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { ConfiguracionEmpresa } from '../../types/config';

interface ConfiguracionEmailModalProps {
  isOpen: boolean;
  configuracion: ConfiguracionEmpresa;
  onSave: (emailConfig: ConfiguracionEmpresa['email']) => void;
  onClose: () => void;
}

export default function ConfiguracionEmailModal({ 
  isOpen, 
  configuracion, 
  onSave, 
  onClose 
}: ConfiguracionEmailModalProps) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<'emailjs' | 'smtp'>(
    configuracion.email.servicio || 'emailjs'
  );
  const [configurado, setConfigurado] = useState(configuracion.email.configurado);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  
  // Estados para EmailJS
  const [emailjsData, setEmailjsData] = useState({
    serviceId: configuracion.email.emailjs?.serviceId || '',
    templateId: configuracion.email.emailjs?.templateId || '',
    publicKey: configuracion.email.emailjs?.publicKey || ''
  });

  // Estados para SMTP
  const [smtpData, setSmtpData] = useState({
    host: configuracion.email.smtp?.host || '',
    puerto: configuracion.email.smtp?.puerto || 587,
    usuario: configuracion.email.smtp?.usuario || '',
    password: configuracion.email.smtp?.password || ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailConfig: ConfiguracionEmpresa['email'] = {
      configurado: true,
      servicio: servicioSeleccionado,
      ...(servicioSeleccionado === 'emailjs' 
        ? { emailjs: emailjsData }
        : { smtp: smtpData }
      )
    };

    onSave(emailConfig);
    setConfigurado(true);
  };

  const handleClose = () => {
    setConfigurado(configuracion.email.configurado);
    onClose();
  };

  const handlePruebaEmail = async () => {
    setEnviandoPrueba(true);
    // Simular envío de prueba
    setTimeout(() => {
      setEnviandoPrueba(false);
      alert('Email de prueba enviado correctamente');
    }, 2000);
  };

  const isFormValid = () => {
    if (servicioSeleccionado === 'emailjs') {
      return emailjsData.serviceId && emailjsData.templateId && emailjsData.publicKey;
    } else {
      return smtpData.host && smtpData.usuario && smtpData.password;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail size={24} />
            Configuración de Email
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Selector de Servicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Proveedor de Email
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setServicioSeleccionado('emailjs')}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    servicioSeleccionado === 'emailjs'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Mail size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">EmailJS</h3>
                      <p className="text-sm text-gray-500">Gratis, fácil configuración</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setServicioSeleccionado('smtp')}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    servicioSeleccionado === 'smtp'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Settings size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">SMTP</h3>
                      <p className="text-sm text-gray-500">Servidor propio</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Configuración EmailJS */}
            {servicioSeleccionado === 'emailjs' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración EmailJS</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Para configurar EmailJS:
                  </p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
                    <li>Crea una cuenta en <a href="https://emailjs.com" target="_blank" rel="noopener noreferrer" className="underline">EmailJS.com</a></li>
                    <li>Configura un servicio de email</li>
                    <li>Crea una plantilla de email</li>
                    <li>Copia los valores aquí</li>
                  </ol>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service ID *
                    </label>
                    <input
                      type="text"
                      value={emailjsData.serviceId}
                      onChange={(e) => setEmailjsData({...emailjsData, serviceId: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="service_xxxxxxx"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template ID *
                    </label>
                    <input
                      type="text"
                      value={emailjsData.templateId}
                      onChange={(e) => setEmailjsData({...emailjsData, templateId: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="template_xxxxxxx"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Public Key *
                  </label>
                  <input
                    type="text"
                    value={emailjsData.publicKey}
                    onChange={(e) => setEmailjsData({...emailjsData, publicKey: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user_xxxxxxxxxxxxxxxx"
                    required
                  />
                </div>
              </div>
            )}

            {/* Configuración SMTP */}
            {servicioSeleccionado === 'smtp' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración SMTP</h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-800 mb-2">
                    Configuración para servidores SMTP comunes:
                  </p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li><strong>Gmail:</strong> smtp.gmail.com:587</li>
                    <li><strong>Outlook:</strong> smtp-mail.outlook.com:587</li>
                    <li><strong>Yahoo:</strong> smtp.mail.yahoo.com:587</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servidor SMTP *
                    </label>
                    <input
                      type="text"
                      value={smtpData.host}
                      onChange={(e) => setSmtpData({...smtpData, host: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="smtp.gmail.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puerto
                    </label>
                    <input
                      type="number"
                      value={smtpData.puerto}
                      onChange={(e) => setSmtpData({...smtpData, puerto: Number(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="587"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario/Email *
                  </label>
                  <input
                    type="email"
                    value={smtpData.usuario}
                    onChange={(e) => setSmtpData({...smtpData, usuario: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="tu-email@gmail.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={smtpData.password}
                    onChange={(e) => setSmtpData({...smtpData, password: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••••••"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para Gmail, usa una contraseña de aplicación en lugar de tu contraseña normal
                  </p>
                </div>
              </div>
            )}

            {/* Prueba de Configuración */}
            {isFormValid() && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Probar Configuración</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Envía un email de prueba para verificar que la configuración funciona correctamente.
                </p>
                <button
                  type="button"
                  onClick={handlePruebaEmail}
                  disabled={enviandoPrueba}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {enviandoPrueba ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Enviar Prueba
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Estado de Configuración */}
            {configurado && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Email configurado correctamente
                    </p>
                    <p className="text-xs text-green-700">
                      El sistema ya puede enviar recordatorios automáticos por email
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {configurado ? 'Cerrar' : 'Cancelar'}
            </button>
            {!configurado && (
              <button
                type="submit"
                disabled={!isFormValid()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                <Save size={16} />
                Configurar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}