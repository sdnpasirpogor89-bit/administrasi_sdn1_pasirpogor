// src/utils/imageUtils.js
export const compressImage = async (file, options = {}) => {
  const { maxWidth = 800, maxHeight = 800, quality = 0.7 } = options;
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
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
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const validateImageFile = async (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'Format file harus JPG, PNG, atau WebP'
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'Ukuran file maksimal 2MB'
    };
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        resolve({
          isValid: false,
          message: 'Resolusi gambar minimal 100x100px'
        });
      } else if (img.width > 4000 || img.height > 4000) {
        resolve({
          isValid: false,
          message: 'Resolusi gambar maksimal 4000x4000px'
        });
      } else {
        resolve({ isValid: true, message: '' });
      }
    };
    img.onerror = () => resolve({
      isValid: false,
      message: 'Gagal memuat gambar'
    });
    img.src = URL.createObjectURL(file);
  });
};

export const blobToBase64 = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
  });
};