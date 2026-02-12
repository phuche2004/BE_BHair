import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.config';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let resource_type = 'auto'; // Default to auto detection
        let folder = 'bhair_app';
        let allowed_formats = undefined; // Allow all supported formats by default or restrict

        if (file.mimetype.startsWith('image')) {
            resource_type = 'image';
            allowed_formats = ['jpg', 'png', 'jpeg', 'webp'];
        } else if (file.mimetype.startsWith('video')) {
            resource_type = 'video';
            allowed_formats = ['mp4', 'webm', 'mov'];
        }

        return {
            folder: folder,
            resource_type: resource_type,
            allowed_formats: allowed_formats,
            public_id: `${file.fieldname}-${Date.now()}`
        } as any;
    },
});

const upload = multer({ storage: storage });
export default upload;
