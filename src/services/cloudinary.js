// src/services/cloudinary.js

// ⚠️ REEMPLAZA ESTO CON TUS DATOS DE CLOUDINARY
const CLOUD_NAME = "dzsbrf05n"; 
const UPLOAD_PRESET = "trivia_dibujos"; // El preset Unsigned que creaste

export async function uploadImageToCloudinary(base64Image) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  
  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData
    });
    
    const data = await response.json();
    
    if (data.secure_url) {
      return { ok: true, url: data.secure_url };
    } else {
      return { ok: false, error: data.error.message };
    }
  } catch (error) {
    return { ok: false, error: "Error de red al subir la imagen" };
  }
}