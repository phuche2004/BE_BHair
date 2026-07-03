"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.ExplorerController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const user_model_1 = __importStar(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class ExplorerController {
    constructor() {
        this.renderLogin = (req, res) => {
            var _a;
            if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) {
                return res.redirect('/explorer');
            }
            res.render('login', { error: null });
        };
        this.handleLogin = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { phoneNumber, password } = req.body;
                const user = yield user_model_1.default.findOne({ phoneNumber });
                if (!user || user.password === undefined) {
                    return res.render('login', { error: 'Số điện thoại hoặc mật khẩu không đúng' });
                }
                const isMatch = yield bcrypt_1.default.compare(password, user.password);
                if (!isMatch) {
                    return res.render('login', { error: 'Số điện thoại hoặc mật khẩu không đúng' });
                }
                if (user.role !== user_model_1.UserRole.ADMIN && user.role !== user_model_1.UserRole.MANAGER) {
                    return res.render('login', { error: 'Bạn không có quyền quản trị.' });
                }
                const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, fullName: user.fullName, shopId: (_a = user.shopId) !== null && _a !== void 0 ? _a : null }, process.env.JWT_SECRET, { expiresIn: '30d' });
                // Set HttpOnly cookie
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
                });
                res.redirect('/explorer');
            }
            catch (error) {
                res.render('login', { error: 'Lỗi hệ thống: ' + error.message });
            }
        });
        this.handleLogout = (req, res) => {
            res.clearCookie('token');
            res.redirect('/explorer/login');
        };
        this.renderExplorer = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Tắt cache trình duyệt/Cloudflare để luôn cập nhật UI mới nhất
                res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                const currentPath = req.query.path || '/';
                const fullPath = this.getSafePath(currentPath);
                // Ensure base dir exists
                if (!fs_1.default.existsSync(this.getBasePath())) {
                    fs_1.default.mkdirSync(this.getBasePath(), { recursive: true });
                }
                if (!fs_1.default.existsSync(fullPath)) {
                    return res.redirect('/explorer');
                }
                const items = fs_1.default.readdirSync(fullPath, { withFileTypes: true });
                const files = items.map(item => {
                    const stats = fs_1.default.statSync(path_1.default.join(fullPath, item.name));
                    return {
                        name: item.name,
                        isDirectory: item.isDirectory(),
                        size: stats.size,
                        modifiedAt: stats.mtime
                    };
                }).sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory)
                        return -1;
                    if (!a.isDirectory && b.isDirectory)
                        return 1;
                    return a.name.localeCompare(b.name);
                });
                // Parent path calculation for the "Up" button
                let parentPath = '/';
                if (currentPath !== '/') {
                    parentPath = path_1.default.dirname(currentPath);
                    if (parentPath === '.')
                        parentPath = '/';
                }
                res.render('explorer', {
                    files,
                    currentPath,
                    parentPath,
                    user: req.user
                });
            }
            catch (error) {
                res.status(500).send(`Lỗi hệ thống: ${error.message}`);
            }
        });
        this.uploadFile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const currentPath = req.body.currentPath || '/';
                if (req.file) {
                    const targetDir = this.getSafePath(currentPath);
                    if (!fs_1.default.existsSync(targetDir)) {
                        fs_1.default.mkdirSync(targetDir, { recursive: true });
                    }
                    // Giải mã Latin1 sang UTF-8 do lỗi của Multer với Tiếng Việt
                    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
                    const finalPath = path_1.default.join(targetDir, originalName);
                    fs_1.default.renameSync(req.file.path, finalPath);
                }
                res.redirect(`/explorer?path=${encodeURIComponent(currentPath)}`);
            }
            catch (error) {
                res.status(500).send(`Upload thất bại: ${error.message}`);
            }
        });
        this.createFolder = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const currentPath = req.body.currentPath || '/';
                const folderName = req.body.folderName;
                if (folderName) {
                    const targetDir = path_1.default.join(this.getSafePath(currentPath), folderName);
                    if (!fs_1.default.existsSync(targetDir)) {
                        fs_1.default.mkdirSync(targetDir);
                    }
                }
                res.redirect(`/explorer?path=${encodeURIComponent(currentPath)}`);
            }
            catch (error) {
                res.status(500).send(`Tạo thư mục thất bại: ${error.message}`);
            }
        });
        this.deleteItem = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const currentPath = req.body.currentPath || '/';
                const itemName = req.body.itemName;
                if (itemName) {
                    const targetPath = path_1.default.join(this.getSafePath(currentPath), itemName);
                    if (fs_1.default.existsSync(targetPath)) {
                        const stats = fs_1.default.statSync(targetPath);
                        if (stats.isDirectory()) {
                            fs_1.default.rmSync(targetPath, { recursive: true, force: true });
                        }
                        else {
                            fs_1.default.unlinkSync(targetPath);
                        }
                    }
                }
                res.redirect(`/explorer?path=${encodeURIComponent(currentPath)}`);
            }
            catch (error) {
                res.status(500).send(`Xóa thất bại: ${error.message}`);
            }
        });
        this.downloadFile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const filePath = req.query.file;
                if (!filePath)
                    return res.status(400).send('No file specified');
                const targetPath = this.getSafePath(filePath);
                if (fs_1.default.existsSync(targetPath) && fs_1.default.statSync(targetPath).isFile()) {
                    res.download(targetPath);
                }
                else {
                    res.status(404).send('File không tồn tại');
                }
            }
            catch (error) {
                res.status(500).send(`Tải file thất bại: ${error.message}`);
            }
        });
        this.streamFile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const filePath = req.query.file;
                if (!filePath)
                    return res.status(400).send('No file specified');
                const targetPath = this.getSafePath(filePath);
                if (fs_1.default.existsSync(targetPath) && fs_1.default.statSync(targetPath).isFile()) {
                    res.sendFile(targetPath);
                }
                else {
                    res.status(404).send('File không tồn tại');
                }
            }
            catch (error) {
                res.status(500).send(`Xem file thất bại: ${error.message}`);
            }
        });
    }
    getBasePath() {
        // Trỏ thẳng ra thư mục Download ngoài bộ nhớ trong của Android
        return '/sdcard/Download/Phuc_Data';
    }
    getSafePath(reqPath) {
        const base = this.getBasePath();
        // Prevent directory traversal
        const safePath = path_1.default.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
        return path_1.default.join(base, safePath);
    }
}
exports.ExplorerController = ExplorerController;
