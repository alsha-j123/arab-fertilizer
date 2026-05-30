const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 or URL image to Cloudinary
 * Returns the secure URL
 */
const uploadImage = async (imageData, folder = 'arab-fertilizer/products') => {
  const result = await cloudinary.uploader.upload(imageData, {
    folder,
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
    ]
  });
  return result.secure_url;
};

const deleteImage = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadImage, deleteImage };
