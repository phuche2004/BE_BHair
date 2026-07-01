"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const cloudinary_config_1 = __importDefault(require("./cloudinary.config"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_config_1.default,
    params: (req, file) => __awaiter(void 0, void 0, void 0, function* () {
        let resource_type = 'auto'; // Default to auto detection
        let folder = 'bhair_app';
        if (file.fieldname === 'images1') {
            folder = 'bhair_app/cover_images';
        }
        else if (file.fieldname === 'images2') {
            folder = 'bhair_app/detail_images';
        }
        else if (file.fieldname === 'images3') {
            folder = 'bhair_app/other_images';
        }
        else if (file.fieldname === 'videos') {
            folder = 'bhair_app/videos';
        }
        else if (file.fieldname === 'avatar') {
            folder = 'bhair_app/avatars';
        }
        else if (file.fieldname === 'image') {
            if (req.originalUrl && req.originalUrl.includes('/ai/')) {
                folder = 'bhair_app/ai_analysis';
            }
            else {
                folder = 'bhair_app/services';
            }
        }
        let allowed_formats = undefined; // Allow all supported formats by default or restrict
        let transformation = undefined;
        if (file.mimetype.startsWith('image')) {
            resource_type = 'image';
            allowed_formats = ['jpg', 'png', 'jpeg', 'webp'];
            transformation = [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }];
        }
        else if (file.mimetype.startsWith('video')) {
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
        };
    }),
});
const upload = (0, multer_1.default)({ storage: storage });
exports.default = upload;
