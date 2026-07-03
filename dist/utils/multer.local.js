"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localUpload = exports.localMediaDir = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
// Determine Termux home directory or fallback
const homeDir = process.env.HOME || os_1.default.homedir();
const baseUploadDir = process.env.LOCAL_MEDIA_PATH || path_1.default.join(homeDir, 'B_Hair_Media');
// Ensure directory exists
if (!fs_1.default.existsSync(baseUploadDir)) {
    fs_1.default.mkdirSync(baseUploadDir, { recursive: true });
}
exports.localMediaDir = baseUploadDir;
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, exports.localMediaDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // Original extension
        const ext = path_1.default.extname(file.originalname);
        // Clean original name (remove special characters)
        const cleanName = path_1.default.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
        cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    }
});
// No file size limits as requested
exports.localUpload = (0, multer_1.default)({ storage });
