"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const explorer_controller_1 = require("../controllers/explorer.controller");
const multer_1 = __importDefault(require("multer"));
const os_1 = __importDefault(require("os"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const upload = (0, multer_1.default)({ dest: os_1.default.tmpdir() });
const router = express_1.default.Router();
const controller = new explorer_controller_1.ExplorerController();
// Custom Web Auth Middleware for Explorer
// This automatically redirects to /explorer/login instead of returning JSON error
const requireWebAuth = (req, res, next) => {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
    if (!token) {
        return res.redirect('/explorer/login');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Cho phép MANAGER hoặc ADMIN
        if (decoded.role !== user_model_1.UserRole.MANAGER && decoded.role !== user_model_1.UserRole.ADMIN) {
            return res.status(403).send('Forbidden: Bạn không có quyền truy cập thư mục này.');
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.clearCookie('token');
        return res.redirect('/explorer/login');
    }
};
// Auth Routes (Public)
router.get('/login', controller.renderLogin);
router.post('/login', controller.handleLogin);
router.get('/logout', controller.handleLogout);
// Apply Web Auth Middleware to protect the following routes
router.use(requireWebAuth);
// Render UI
router.get('/', controller.renderExplorer);
// Actions
router.post('/upload', upload.single('file'), controller.uploadFile);
router.post('/mkdir', controller.createFolder);
router.post('/delete', controller.deleteItem);
router.get('/download', controller.downloadFile);
router.get('/stream', controller.streamFile);
exports.default = router;
