// src/utils/uploadImageToCloudinary.js
import axios from "axios";

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UPLOAD_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL || `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const uploadImageToCloudinary = async (imageFile) => {
  if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary upload is not configured. Set VITE_CLOUDINARY_UPLOAD_PRESET and VITE_CLOUDINARY_CLOUD_NAME.");
  }

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);

  return response.data.secure_url; // returns the uploaded image URL
};

export default uploadImageToCloudinary;
