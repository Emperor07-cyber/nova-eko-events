// src/utils/uploadImageToCloudinary.js
import axios from "axios";

const uploadImageToCloudinary = async (imageFile) => {
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "nova-eko-events"); // set in Cloudinary
  formData.append("cloud_name", "dkse7snw2");

  const response = await axios.post(
    "https://api.cloudinary.com/v1_1/dkse7snw2/image/upload",
    formData
  );

  return response.data.secure_url; // returns the uploaded image URL
};

export default uploadImageToCloudinary;
