// src/utils/imageUtils.ts

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  file?: File;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// Validar archivo de imagen
export const validateImageFile = (file: File): ImageValidationResult => {
  // Verificar si es un archivo
  if (!file) {
    return { isValid: false, error: 'No se seleccionó ningún archivo' };
  }

  // Verificar tipo de archivo
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'El archivo debe ser una imagen' };
  }

  // Verificar tipos permitidos
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Formato no permitido. Use JPG, PNG, GIF o WebP' };
  }

  // Verificar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'El archivo es muy grande. Máximo 5MB' };
  }

  return { isValid: true, file };
};

// Redimensionar imagen manteniendo proporción
export const resizeImage = (
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 300,
      maxHeight = 300,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No se pudo crear el contexto del canvas'));
      return;
    }

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Configurar canvas
      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a base64
      const mimeType = format === 'png' ? 'image/png' : `image/${format}`;
      const base64 = canvas.toDataURL(mimeType, quality);
      
      resolve(base64);
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    // Crear URL para la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    reader.readAsDataURL(file);
  });
};

// Optimizar imagen para logo
export const optimizeLogo = async (file: File): Promise<string> => {
  const validation = validateImageFile(file);
  
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return await resizeImage(file, {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.9,
    format: file.type.includes('png') ? 'png' : 'jpeg'
  });
};

// Crear thumbnail pequeño
export const createThumbnail = async (file: File): Promise<string> => {
  const validation = validateImageFile(file);
  
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return await resizeImage(file, {
    maxWidth: 64,
    maxHeight: 64,
    quality: 0.7,
    format: 'jpeg'
  });
};

// Obtener información de la imagen
export const getImageInfo = (file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        name: file.name
      });
    };

    img.onerror = () => {
      reject(new Error('Error al obtener información de la imagen'));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    reader.readAsDataURL(file);
  });
};

// Convertir base64 a blob
export const base64ToBlob = (base64: string): Blob => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

// Formatear tamaño de archivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Verificar si una URL es válida
export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};