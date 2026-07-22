export const uploadEventImage = async (file) => {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", "nova-eko-events");

  const response = await fetch("https://api.cloudinary.com/v1_1/dkse7snw2/image/upload", {
    method: "POST",
    body: form,
  });
  const data = await response.json();

  if (!data.secure_url) {
    throw new Error("Image upload failed.");
  }

  return data.secure_url;
};
