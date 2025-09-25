// src/utils/emailJSLoader.ts
export const loadEmailJS = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Si EmailJS ya está cargado, resolver inmediatamente
    if (window.emailjs) {
      resolve();
      return;
    }

    // Si ya hay un script cargándose, esperar
    if (document.querySelector('script[src*="emailjs"]')) {
      const checkLoaded = () => {
        if (window.emailjs) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Crear y cargar el script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
      console.log('📧 EmailJS loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('❌ Failed to load EmailJS');
      reject(new Error('Failed to load EmailJS'));
    };
    
    document.head.appendChild(script);
  });
};

// Función para inicializar EmailJS con configuración
export const initializeEmailJS = async (publicKey: string): Promise<boolean> => {
  try {
    await loadEmailJS();
    if (window.emailjs && publicKey) {
      window.emailjs.init(publicKey);
      console.log('✅ EmailJS initialized with public key');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error initializing EmailJS:', error);
    return false;
  }
};