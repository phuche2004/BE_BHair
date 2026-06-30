import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Determine Termux home directory or fallback
const homeDir = process.env.HOME || os.homedir();
const baseUploadDir = process.env.LOCAL_MEDIA_PATH || path.join(homeDir, 'B_Hair_Media');

// Ensure directory exists
if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
}

export const localMediaDir = baseUploadDir;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, localMediaDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // Original extension
        const ext = path.extname(file.originalname);
        // Clean original name (remove special characters)
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
        cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    }
});

// No file size limits as requested
export const localUpload = multer({ storage });
