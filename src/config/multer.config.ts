import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.config';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let resource_type = 'auto'; // Default to auto detection
        let folder = 'bhair_app';
        
        if (file.fieldname === 'images1') {
            folder = 'bhair_app/cover_images';
        } else if (file.fieldname === 'images2') {
            folder = 'bhair_app/detail_images';
        } else if (file.fieldname === 'images3') {
            folder = 'bhair_app/other_images';
        } else if (file.fieldname === 'videos') {
            folder = 'bhair_app/videos';
        } else if (file.fieldname === 'avatar') {
            folder = 'bhair_app/avatars';
        } else if (file.fieldname === 'image') {
            if (req.originalUrl && req.originalUrl.includes('/ai/')) {
                folder = 'bhair_app/ai_analysis';
            } else {
                folder = 'bhair_app/services';
            }
        }

        let allowed_formats = undefined; // Allow all supported formats by default or restrict
        let transformation: any = undefined;

        if (file.mimetype.startsWith('image')) {
            resource_type = 'image';
            allowed_formats = ['jpg', 'png', 'jpeg', 'webp'];
            transformation = [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }];
        } else if (file.mimetype.startsWith('video')) {
            resource_type = 'video';
            allowed_formats = ['mp4', 'webm', 'mov'];
            // Compress video quality and transcode to optimal format automatically
            transformation = [{ width: 1280, crop: 'limit', quality: 'auto', fetch_format: 'auto' }];
        }

        return {
            folder: folder,
            resource_type: resource_type,
            allowed_formats: allowed_formats,
            transformation: transformation,
            public_id: `${file.fieldname}-${Date.now()}`
        } as any;
    },
});

const upload = multer({ storage: storage });
export default upload;
