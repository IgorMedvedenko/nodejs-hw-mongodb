import cloudinary from 'cloudinary';
import { getEnvVar } from './getEnvVar.js';
import { CLOUDINARY } from '../constants/index.js';

cloudinary.v2.config({
  secure: true,
  cloud_name: getEnvVar(CLOUDINARY.CLOUD_NAME),
  api_key: getEnvVar(CLOUDINARY.API_KEY),
  api_secret: getEnvVar(CLOUDINARY.API_SECRET),
});
export const saveFileToCloudinary = async (file) => {
  const response = await new Promise((resolve, reject) => {
    cloudinary.v2.uploader
      .upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      })
      .end(file.buffer);
  });
  return response.secure_url;
};
